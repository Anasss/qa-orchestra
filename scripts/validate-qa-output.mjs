#!/usr/bin/env node
// scripts/validate-qa-output.mjs
//
// Envelope + (optional) per-agent extension lint for the machine block
// every QA Orchestra agent emits at the top of its qa-output/*.md report:
//
//   ```json qa-orchestra
//   { "agent": "...", "version": 1, "verdict": "...", "summary": "..." }
//   ```
//
// Default mode validates the ENVELOPE only — the fields every agent
// shares (agent, version, verdict, summary, inputs, next_actions).
//
// --strict additionally validates per-agent extensions defined in
// `schemas/qa-output.schema.json` under $defs.agent_extensions
// (risk_score, ac_compliance[], gaps[], scenarios[], bugs[], etc.).
// Extensions are validated when present; they are not required.
// The JSON-schema subset supported here: type, enum, const, minimum,
// maximum, items, required, properties. Extend as the schema grows.
//
// Run locally:
//   node scripts/validate-qa-output.mjs path/to/file.md
//   node scripts/validate-qa-output.mjs --all
//   node scripts/validate-qa-output.mjs --all --strict
//   node scripts/validate-qa-output.mjs --expect-fail path/to/broken.md
//   node scripts/validate-qa-output.mjs --expect-fail --strict path/to/broken-ext.md
//
// Exit 0 on success, 1 on unexpected validation result, 2 on tool error.
//
// Zero dependencies — pure Node (18+).

import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SCHEMA_PATH = join(REPO_ROOT, "schemas", "qa-output.schema.json");

// ---------- Schema loading ----------

async function loadSchema() {
  const raw = await readFile(SCHEMA_PATH, "utf8");
  return JSON.parse(raw);
}

// Derive envelope constants from the schema so there's ONE source of
// truth (schema file) instead of the historic duplication between
// hand-rolled Sets in this file and enums in the schema.
function deriveEnvelopeRules(schema) {
  const p = schema.properties ?? {};
  return {
    validAgents: new Set(p.agent?.enum ?? []),
    validVerdicts: new Set(p.verdict?.enum ?? []),
    expectedVersion: p.version?.const,
    summaryMax: p.summary?.maxLength,
  };
}

// ---------- JSON-Schema-subset walker ----------

// Intentionally small — supports exactly what qa-output.schema.json
// currently uses. Do not expand speculatively; add keywords here when
// the schema grows.
function validateValue(value, spec, path) {
  const errs = [];
  if (!spec) return errs;

  // type — string | integer | number | boolean | object | array | null,
  // or an array of types (e.g. ["string", "null"]).
  if (spec.type !== undefined) {
    const allowed = Array.isArray(spec.type) ? spec.type : [spec.type];
    const ok = allowed.some((t) => {
      if (t === "null") return value === null;
      if (t === "integer") return Number.isInteger(value);
      if (t === "number") return typeof value === "number";
      if (t === "array") return Array.isArray(value);
      if (t === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
      return typeof value === t; // string, boolean
    });
    if (!ok) {
      const actual =
        value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
      errs.push(`${path}: expected type ${allowed.join(" or ")}, got ${actual}`);
      return errs; // bail — downstream checks would cascade
    }
  }

  if (spec.enum !== undefined && !spec.enum.includes(value)) {
    errs.push(`${path}: value ${JSON.stringify(value)} is not one of [${spec.enum.join(", ")}]`);
  }

  if (spec.const !== undefined && value !== spec.const) {
    errs.push(`${path}: must equal ${JSON.stringify(spec.const)}, got ${JSON.stringify(value)}`);
  }

  if (typeof value === "number") {
    if (spec.minimum !== undefined && value < spec.minimum) {
      errs.push(`${path}: ${value} below minimum ${spec.minimum}`);
    }
    if (spec.maximum !== undefined && value > spec.maximum) {
      errs.push(`${path}: ${value} above maximum ${spec.maximum}`);
    }
  }

  if (typeof value === "string" && spec.maxLength !== undefined && value.length > spec.maxLength) {
    errs.push(`${path}: string length ${value.length} above maxLength ${spec.maxLength}`);
  }

  if (Array.isArray(value) && spec.items) {
    value.forEach((item, i) => {
      errs.push(...validateValue(item, spec.items, `${path}[${i}]`));
    });
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(spec.required)) {
      for (const req of spec.required) {
        if (!(req in value)) errs.push(`${path}: missing required field '${req}'`);
      }
    }
    if (spec.properties) {
      for (const [prop, propSpec] of Object.entries(spec.properties)) {
        if (prop in value) {
          errs.push(...validateValue(value[prop], propSpec, `${path}.${prop}`));
        }
      }
    }
  }

  return errs;
}

// Validate per-agent extensions. Extension shape lives at
// schema.$defs.agent_extensions[agent] as { fieldName: <subschema> }.
// Extensions are validated when present; they are NOT required.
function validateExtensions(block, schema) {
  const extensions = schema?.$defs?.agent_extensions;
  if (!extensions) return [];
  const extSpec = extensions[block.agent];
  if (!extSpec) return []; // agent has no defined extension — nothing to strict-check

  const errs = [];
  for (const [field, fieldSpec] of Object.entries(extSpec)) {
    if (field in block) {
      errs.push(...validateValue(block[field], fieldSpec, field));
    }
  }
  return errs;
}

// ---------- Machine-block extraction ----------

// Extract the first ```json qa-orchestra ... ``` fenced block.
// Returns a discriminated union:
//   { ok: true,  json, startLine }
//   { ok: false, error }
function extractMachineBlock(raw) {
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/^```json\s+qa-orchestra\s*$/.test(lines[i])) continue;
    const start = i;
    const buf = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^```\s*$/.test(lines[j])) {
        return { ok: true, json: buf.join("\n"), startLine: start + 1 };
      }
      buf.push(lines[j]);
    }
    return { ok: false, error: `fence opened at line ${start + 1} is never closed` };
  }
  return { ok: false, error: "missing ```json qa-orchestra fenced block (must appear before any other content)" };
}

// ---------- Envelope validation ----------

function validateEnvelope(block, rules) {
  const errs = [];

  if (!block || typeof block !== "object" || Array.isArray(block)) {
    errs.push("machine block must be a JSON object");
    return errs;
  }

  for (const key of ["agent", "version", "verdict", "summary"]) {
    if (!(key in block)) errs.push(`missing required field: ${key}`);
  }

  if ("agent" in block && !rules.validAgents.has(block.agent)) {
    errs.push(`agent must be one of the ${rules.validAgents.size} known agents, got ${JSON.stringify(block.agent)}`);
  }
  if ("version" in block && block.version !== rules.expectedVersion) {
    errs.push(`version must be ${rules.expectedVersion}, got ${JSON.stringify(block.version)}`);
  }
  if ("verdict" in block && !rules.validVerdicts.has(block.verdict)) {
    errs.push(`verdict must be one of ${[...rules.validVerdicts].join("|")}, got ${JSON.stringify(block.verdict)}`);
  }
  if ("summary" in block) {
    if (typeof block.summary !== "string") errs.push("summary must be a string");
    else if (block.summary.length > rules.summaryMax) {
      errs.push(`summary exceeds ${rules.summaryMax} chars (${block.summary.length})`);
    }
  }
  if ("inputs" in block) {
    if (!Array.isArray(block.inputs)) errs.push("inputs must be an array");
    else {
      block.inputs.forEach((x, i) => {
        if (!x || typeof x !== "object") errs.push(`inputs[${i}] must be object`);
        else {
          if (typeof x.kind !== "string") errs.push(`inputs[${i}].kind must be string`);
          if (typeof x.ref !== "string") errs.push(`inputs[${i}].ref must be string`);
        }
      });
    }
  }
  if ("next_actions" in block) {
    if (!Array.isArray(block.next_actions) || block.next_actions.some((x) => typeof x !== "string")) {
      errs.push("next_actions must be an array of strings");
    }
  }

  return errs;
}

// ---------- Per-file orchestration ----------

async function validateFile(filePath, { schema, strict }) {
  const label = relative(REPO_ROOT, filePath).replaceAll("\\", "/");
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (err) {
    return { label, errors: [`cannot read file: ${err.message}`] };
  }

  const extracted = extractMachineBlock(raw);
  if (!extracted.ok) {
    return { label, errors: [extracted.error] };
  }

  let block;
  try {
    block = JSON.parse(extracted.json);
  } catch (err) {
    return { label, errors: [`machine block is not valid JSON: ${err.message}`] };
  }

  const rules = deriveEnvelopeRules(schema);
  const envelopeErrs = validateEnvelope(block, rules);

  // Extension checks only when the envelope is well-formed. No point
  // type-checking extensions on blocks that already failed envelope.
  const extErrs = strict && envelopeErrs.length === 0
    ? validateExtensions(block, schema)
    : [];

  return { label, errors: [...envelopeErrs, ...extErrs] };
}

// ---------- Fixture discovery ----------

// Walk tests/*/expected-output.md, skipping dirs starting with `_` or `.`
// (reserved for negative fixtures and hidden state).
async function findGoldenFixtures() {
  const testsDir = join(REPO_ROOT, "tests");
  const out = [];
  let entries;
  try {
    entries = await readdir(testsDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name.startsWith("_") || name.startsWith(".")) continue;
    const sub = join(testsDir, name);
    let s;
    try { s = await stat(sub); } catch { continue; }
    if (!s.isDirectory()) continue;
    const candidate = join(sub, "expected-output.md");
    try {
      await stat(candidate);
      out.push(candidate);
    } catch {
      // no expected-output.md in this subdir — skip
    }
  }
  return out.sort();
}

// ---------- Reporting ----------

function printResult({ label, errors }) {
  if (errors.length === 0) {
    console.log(`  \u2713 ${label}`);
  } else {
    console.error(`  \u2717 ${label}`);
    for (const e of errors) console.error(`      - ${e}`);
  }
}

// ---------- Argument parsing ----------

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  return {
    strict: flags.has("--strict"),
    expectFail: flags.has("--expect-fail"),
    all: flags.has("--all"),
    positional,
  };
}

// ---------- Main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let schema;
  try {
    schema = await loadSchema();
  } catch (err) {
    console.error(`cannot load schema at ${relative(REPO_ROOT, SCHEMA_PATH).replaceAll("\\", "/")}: ${err.message}`);
    process.exit(2);
  }

  const mode = args.strict ? " [--strict]" : "";
  const ctx = { schema, strict: args.strict };

  // --expect-fail FILE — invert the exit code: validator MUST find errors.
  if (args.expectFail) {
    const file = args.positional[0];
    if (!file) {
      console.error("--expect-fail requires a file path");
      process.exit(2);
    }
    const res = await validateFile(resolve(file), ctx);
    if (res.errors.length === 0) {
      console.error(`Expected ${res.label}${mode} to FAIL validation, but it passed.`);
      process.exit(1);
    }
    console.log(`\u2713 ${res.label}${mode} rejected as expected:`);
    for (const e of res.errors) console.log(`    - ${e}`);
    process.exit(0);
  }

  const files =
    args.all || args.positional.length === 0
      ? await findGoldenFixtures()
      : args.positional.map((a) => resolve(a));

  if (files.length === 0) {
    console.error("No tests/*/expected-output.md files found.");
    process.exit(2);
  }

  if (args.all || args.positional.length === 0) {
    console.log(`Validating ${files.length} golden fixture(s)${mode}:\n`);
  }

  let failed = 0;
  for (const f of files) {
    const res = await validateFile(f, ctx);
    printResult(res);
    if (res.errors.length > 0) failed++;
  }

  const word = failed === 1 ? "failure" : "failures";
  console.log(`\n${files.length} file(s) checked${mode}, ${failed} ${word}.`);
  process.exit(failed === 0 ? 0 : 1);
}

await main();
