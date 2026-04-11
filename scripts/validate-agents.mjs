#!/usr/bin/env node
// scripts/validate-agents.mjs
//
// Structural lint for .claude/agents/*.md files.
//
// Each agent in QA Orchestra is a standalone Markdown file with YAML
// frontmatter. This script enforces the minimum shape every agent must
// have so broken or inconsistent agents fail CI instead of shipping
// silently. It does not validate what the agent *says* — only that the
// file has the expected structure.
//
// Run locally:    node scripts/validate-agents.mjs
// Exit code 0 if all agents pass, 1 on lint failure, 2 on tool error.
//
// Zero dependencies — pure Node (18+), no npm install, no package.json.

import { readFile, readdir } from "node:fs/promises";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, "..", ".claude", "agents");

const REQUIRED_FRONTMATTER_KEYS = ["name", "description", "model", "tools"];
const VALID_MODELS = new Set(["sonnet", "opus", "haiku"]);
const REQUIRED_SECTIONS = ["## Role", "## Output format", "## Rules"];

let totalFailures = 0;
let agentCount = 0;

function recordFailure(file, message) {
  console.error(`  \u2717 ${file}: ${message}`);
  totalFailures++;
}

function recordPass(file) {
  console.log(`  \u2713 ${file}`);
}

// Split `---\n...\n---\n<body>` into { frontmatter, body }.
// Returns null if the file doesn't start with a valid frontmatter block.
function splitFrontmatter(raw) {
  if (!/^---\r?\n/.test(raw)) return null;
  const rest = raw.replace(/^---\r?\n/, "");
  const closeMatch = rest.match(/^---\s*(?:\r?\n|$)/m);
  if (!closeMatch) return null;
  const frontmatter = rest.slice(0, closeMatch.index);
  const body = rest.slice(closeMatch.index + closeMatch[0].length);
  return { frontmatter, body };
}

// Parse flat `key: value` lines from a frontmatter block.
// Does not support nested structures — intentionally simple.
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
  const file = basename(filePath);
  const stem = file.replace(/\.md$/, "");
  const raw = await readFile(filePath, "utf8");

  let hadError = false;
  const fail = (msg) => {
    recordFailure(file, msg);
    hadError = true;
  };

  const split = splitFrontmatter(raw);
  if (!split) {
    fail("missing or malformed YAML frontmatter (expected --- ... --- at the top of the file)");
    return;
  }

  const fm = parseFrontmatter(split.frontmatter);

  // Required frontmatter keys
  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!(key in fm)) {
      fail(`frontmatter missing required key: ${key}`);
    }
  }

  // name must match filename (without .md)
  if (fm.name && fm.name !== stem) {
    fail(`frontmatter name "${fm.name}" does not match filename "${stem}"`);
  }

  // model must be one of the known Claude families
  if (fm.model && !VALID_MODELS.has(fm.model)) {
    fail(
      `frontmatter model "${fm.model}" is not one of: ${[...VALID_MODELS].join(", ")}`
    );
  }

  // tools must be non-empty when declared
  if ("tools" in fm && !fm.tools) {
    fail('frontmatter tools is empty — declare the tools the agent may use (e.g., "Read, Glob, Grep, Bash")');
  }

  // Body must have an H1 heading
  if (!/^#\s+\S/m.test(split.body)) {
    fail("body is missing an H1 heading (e.g., # Agent Name)");
  }

  // Body must have each required section heading.
  // Matches the section at the start of a line, allowing trailing
  // whitespace or end-of-line — tolerant of minor formatting drift.
  for (const section of REQUIRED_SECTIONS) {
    const rx = new RegExp(`^${escapeRegex(section)}(?:\\s|$)`, "m");
    if (!rx.test(split.body)) {
      fail(`body is missing required section: ${section}`);
    }
  }

  if (!hadError) recordPass(file);
}

async function main() {
  console.log(`Validating agents in ${AGENTS_DIR}\n`);

  let files;
  try {
    files = await readdir(AGENTS_DIR);
  } catch (err) {
    console.error(`Cannot read ${AGENTS_DIR}: ${err.message}`);
    process.exit(2);
  }

  const agentFiles = files.filter((f) => f.endsWith(".md")).sort();
  if (agentFiles.length === 0) {
    console.error(`No .md files found in ${AGENTS_DIR}`);
    process.exit(2);
  }

  for (const file of agentFiles) {
    agentCount++;
    await validateAgent(join(AGENTS_DIR, file));
  }

  const word = totalFailures === 1 ? "failure" : "failures";
  console.log(`\n${agentCount} agents checked, ${totalFailures} ${word}.`);
  process.exit(totalFailures === 0 ? 0 : 1);
}

await main();
