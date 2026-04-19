#!/usr/bin/env node
// scripts/validate-agents.mjs
//
// Structural lint for .claude/agents/*.md files — catches silent
// ship-through of broken agents (missing frontmatter keys, name/filename
// mismatches, invalid models, missing required sections).
//
// Exit: 0 pass, 1 lint failure, 2 tool error. Zero deps, Node 18+.

import { readFile, readdir } from "node:fs/promises";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, "..", ".claude", "agents");

const REQUIRED_FRONTMATTER_KEYS = ["name", "description", "model", "tools"];
const VALID_MODELS = new Set(["sonnet", "opus", "haiku"]);
const REQUIRED_SECTIONS = ["## Role", "## Output format", "## Rules"];

function splitFrontmatter(raw) {
  if (!/^---\r?\n/.test(raw)) return null;
  const rest = raw.replace(/^---\r?\n/, "");
  const closeMatch = rest.match(/^---\s*(?:\r?\n|$)/m);
  if (!closeMatch) return null;
  const frontmatter = rest.slice(0, closeMatch.index);
  const body = rest.slice(closeMatch.index + closeMatch[0].length);
  return { frontmatter, body };
}

// Intentionally simple flat key:value parser. Do not replace with a real
// YAML parser — the dependency cost outweighs the feature gap at this scope.
function parseFrontmatter(frontmatter) {
  const keys = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (match) {
      keys[match[1]] = match[2].trim();
    }
  }
  return keys;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateAgent(filePath) {
  const label = basename(filePath);
  const stem = label.replace(/\.md$/, "");
  const errors = [];

  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (err) {
    return { label, errors: [`cannot read file: ${err.message}`] };
  }

  const split = splitFrontmatter(raw);
  if (!split) {
    errors.push("missing or malformed YAML frontmatter (expected --- ... --- at the top of the file)");
    return { label, errors };
  }

  const fm = parseFrontmatter(split.frontmatter);

  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!(key in fm)) errors.push(`frontmatter missing required key: ${key}`);
  }

  if (fm.name && fm.name !== stem) {
    errors.push(`frontmatter name "${fm.name}" does not match filename "${stem}"`);
  }

  if (fm.model && !VALID_MODELS.has(fm.model)) {
    errors.push(
      `frontmatter model "${fm.model}" is not one of: ${[...VALID_MODELS].join(", ")}`
    );
  }

  if ("tools" in fm && !fm.tools) {
    errors.push('frontmatter tools is empty — declare the tools the agent may use (e.g., "Read, Glob, Grep, Bash")');
  }

  if (!/^#\s+\S/m.test(split.body)) {
    errors.push("body is missing an H1 heading (e.g., # Agent Name)");
  }

  // Tolerant of trailing whitespace / EOL drift after the heading text.
  for (const section of REQUIRED_SECTIONS) {
    const rx = new RegExp(`^${escapeRegex(section)}(?:\\s|$)`, "m");
    if (!rx.test(split.body)) {
      errors.push(`body is missing required section: ${section}`);
    }
  }

  return { label, errors };
}

function printResult({ label, errors }) {
  if (errors.length === 0) {
    console.log(`  \u2713 ${label}`);
  } else {
    console.error(`  \u2717 ${label}`);
    for (const e of errors) console.error(`      - ${e}`);
  }
}

async function main() {
  console.log(`Validating agents in ${AGENTS_DIR}\n`);

  let files;
  try {
    files = await readdir(AGENTS_DIR);
  } catch (err) {
    console.error(`cannot read ${AGENTS_DIR}: ${err.message}`);
    process.exit(2);
  }

  const agentFiles = files.filter((f) => f.endsWith(".md")).sort();
  if (agentFiles.length === 0) {
    console.error(`no .md files found in ${AGENTS_DIR}`);
    process.exit(2);
  }

  let failed = 0;
  for (const file of agentFiles) {
    const res = await validateAgent(join(AGENTS_DIR, file));
    printResult(res);
    if (res.errors.length > 0) failed++;
  }

  const word = failed === 1 ? "failure" : "failures";
  console.log(`\n${agentFiles.length} agents checked, ${failed} ${word}.`);
  process.exit(failed === 0 ? 0 : 1);
}

await main();
