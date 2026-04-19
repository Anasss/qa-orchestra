#!/usr/bin/env node
// scripts/evals/functional-reviewer.mjs
//
// Content checker for functional-reviewer output. Given an output file,
// asserts the machine block's gaps[] includes the expected gaps for the
// dark-mode fixture (AC-3, AC-5). Extras are reported as a hallucination
// signal but do NOT fail the check (superset-pass rule).
//
// CI runs this against tests/functional-reviewer/expected-output.md
// (must pass) and tests/functional-reviewer/eval-fixtures/missed-gaps.md
// (must fail via --expect-fail). Actual agent invocation happens locally
// — see scripts/evals/README.md.
//
// Exit: 0 pass, 1 check failure, 2 tool error. Zero deps, Node 18+.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const EXPECTED_GAPS = new Set(["AC-3", "AC-5"]);
const FIXTURE_LABEL = "dark-mode (tests/functional-reviewer/)";

function extractMachineBlock(raw) {
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/^```json\s+qa-orchestra\s*$/.test(lines[i])) continue;
    const buf = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^```\s*$/.test(lines[j])) return { ok: true, json: buf.join("\n") };
      buf.push(lines[j]);
    }
    return { ok: false, error: `fence opened at line ${i + 1} never closed` };
  }
  return { ok: false, error: "missing ```json qa-orchestra fenced block" };
}

function checkGaps(block) {
  const errs = [];
  const warns = [];

  if (block.agent !== "functional-reviewer") {
    errs.push(`expected agent "functional-reviewer", got ${JSON.stringify(block.agent)}`);
    return { errs, warns };
  }

  if (!Array.isArray(block.gaps)) {
    errs.push(`gaps must be an array, got ${Array.isArray(block.gaps) ? "array" : typeof block.gaps}`);
    return { errs, warns };
  }

  const actualIds = new Set(block.gaps.map((g) => g?.ac).filter((x) => typeof x === "string"));

  for (const expected of EXPECTED_GAPS) {
    if (!actualIds.has(expected)) errs.push(`missing expected gap: ${expected}`);
  }

  const extras = [...actualIds].filter((id) => !EXPECTED_GAPS.has(id));
  if (extras.length > 0) {
    warns.push(`hallucinated gaps (not in expected set): ${extras.join(", ")}`);
  }

  return { errs, warns };
}

async function main() {
  const argv = process.argv.slice(2);
  const expectFail = argv.includes("--expect-fail");
  const positional = argv.filter((a) => !a.startsWith("--"));
  const file = positional[0];

  if (!file) {
    console.error("usage: node scripts/evals/functional-reviewer.mjs [--expect-fail] path/to/output.md");
    process.exit(2);
  }

  let raw;
  try {
    raw = await readFile(resolve(file), "utf8");
  } catch (err) {
    console.error(`cannot read ${file}: ${err.message}`);
    process.exit(2);
  }

  const extracted = extractMachineBlock(raw);
  if (!extracted.ok) {
    if (expectFail) {
      console.log(`\u2713 ${file} rejected as expected: ${extracted.error}`);
      process.exit(0);
    }
    console.error(`\u2717 ${file}: ${extracted.error}`);
    process.exit(1);
  }

  let block;
  try {
    block = JSON.parse(extracted.json);
  } catch (err) {
    const msg = `machine block JSON parse error: ${err.message}`;
    if (expectFail) {
      console.log(`\u2713 ${file} rejected as expected: ${msg}`);
      process.exit(0);
    }
    console.error(`\u2717 ${file}: ${msg}`);
    process.exit(1);
  }

  const { errs, warns } = checkGaps(block);

  if (errs.length > 0) {
    if (expectFail) {
      console.log(`\u2713 ${file} rejected as expected (${FIXTURE_LABEL}):`);
      for (const e of errs) console.log(`    - ${e}`);
      for (const w of warns) console.log(`    - warning: ${w}`);
      process.exit(0);
    }
    console.error(`\u2717 ${file} (${FIXTURE_LABEL}):`);
    for (const e of errs) console.error(`    - ${e}`);
    for (const w of warns) console.error(`    - warning: ${w}`);
    process.exit(1);
  }

  if (expectFail) {
    console.error(`Expected ${file} to FAIL check, but it passed.`);
    process.exit(1);
  }

  console.log(`\u2713 ${file} (${FIXTURE_LABEL})`);
  for (const w of warns) console.log(`  warning: ${w}`);
  process.exit(0);
}

await main();
