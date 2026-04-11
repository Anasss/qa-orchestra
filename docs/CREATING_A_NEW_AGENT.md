# Creating a New QA Agent

QA Orchestra ships with 10 agents covering common quality-engineering questions. Your team might need more — a compliance reviewer for regulated industries, a performance reviewer that knows your SLOs, a security-focused reviewer for sensitive endpoints. This guide walks through how to add one.

Agents are standalone Markdown files. There is no SDK, no build step, no registration, no code generation. If you can edit Markdown, you can write an agent.

---

## Anatomy of an agent file

Every agent lives at `.claude/agents/<agent-name>.md` and has two parts.

### 1. YAML frontmatter

```yaml
---
name: compliance-reviewer
description: Compares diffs against regulatory compliance requirements (SOC 2, HIPAA, GDPR) and flags gaps
model: opus
tools: Read, Glob, Grep, Bash
---
```

| Field | Purpose | Rules |
|---|---|---|
| `name` | Agent identifier, used in `@agent-name` invocations and the `Agent` tool's `subagent_type`. | **Must exactly match the filename** (without the `.md` extension). The structural linter enforces this. |
| `description` | One-line summary shown in autocomplete and the Claude Code agent picker. | Start with a verb. Make it concrete. "Compares diffs against AC" beats "Reviews code". |
| `model` | Which Claude model family the agent runs on. | One of `sonnet`, `opus`, `haiku`. Use `opus` for agents that do heavy reasoning (functional review, release analysis); `sonnet` for everything else; `haiku` for fast formatting or routing. |
| `tools` | Comma-separated list of tools the agent is allowed to use. | Start with `Read, Glob, Grep, Bash`. Add `Write` and `Edit` only if the agent creates or modifies files. Add `Agent` only if the agent dispatches to other sub-agents. |

### 2. The body

At a minimum, every agent file must have **three sections** — the structural linter (`scripts/validate-agents.mjs`) enforces their presence:

- **`## Role`** — one paragraph describing who the agent is and what they do. Think of it as the agent's job description. Reference `context/CONTEXT.md` and the `context/annotations/` directory where relevant. Be explicit about scope: what the agent does NOT do is often as important as what it does.
- **`## Output format`** — the exact shape of the agent's output. If the agent writes to `qa-output/`, describe the file and its top-level structure here. If the agent returns inline results, show a template.
- **`## Rules`** — non-negotiables. What the agent must and must never do. This is where you encode discipline — "never fabricate findings", "always cite file:line", "stop and ask on ambiguity instead of assuming".

Most agents also include free-form intermediate sections: `## Prerequisites`, `## Step 1 — Gather inputs`, `## Analysis framework`, `## Severity definitions (defaults — override with context/CONTEXT.md)`, and so on. These are optional and exist to guide the agent through its reasoning. Use them when the task is complex enough that a flat "Role + Rules" isn't enough scaffolding.

### Output contract (the trigger block)

By convention, every agent has a trigger block at the top of the body right after the H1 heading, stating what the agent reads and what it writes:

```markdown
> **Trigger**: A code diff and compliance rules need to be compared.
> **Reads**: Diff + `context/CONTEXT.md` + compliance policies.
> **Writes**: `qa-output/compliance-review.md`
```

This is not enforced by the linter, but downstream agents rely on it. The `bug-reporter` agent, for example, reads `qa-output/functional-review.md` — it knows that file exists because `functional-reviewer`'s trigger block says it writes there. Keep the convention consistent.

---

## The fast path: copy an existing agent

The easiest way to start is to copy the agent whose shape is closest to what you want, then edit.

| You're building... | Start from | Why |
|---|---|---|
| A new kind of reviewer (compliance, security, performance) | `.claude/agents/functional-reviewer.md` | Already has the AC-vs-diff comparison framework, severity handling, and gap-report structure. Swap the Role section for your domain. |
| A new scenario or test generator | `.claude/agents/test-scenario-designer.md` | Already has the happy / negative / boundary / edge coverage framework. Adapt the Role to your input type. |
| A routing or planning agent | `.claude/agents/orchestrator.md` | Already shows the pattern for reading inputs, deciding what to run, and producing a plan file. |
| A browser-driven agent | `.claude/agents/browser-validator.md` | Already wired up to Chrome MCP with the "for each scenario" loop and evidence-capture conventions. |
| A structured transformer (findings → reports, scenarios → tests) | `.claude/agents/bug-reporter.md` or `.claude/agents/automation-writer.md` | Already has the "one input = one output" pattern and the output-chaining conventions. |

Copy the file, rename it, update the frontmatter `name` to match the new filename, and rewrite the Role section to describe your domain. Keep `## Output format` and `## Rules` — they usually only need small tweaks.

**Do not invent new top-level sections just to be different.** The linter is tolerant of extra sections, but contributors and downstream agents appreciate consistency. If you need a new kind of structure, open an issue first and discuss.

---

## Validation

Before submitting a new agent, run the structural linter locally:

```bash
node scripts/validate-agents.mjs
```

The linter checks:

- YAML frontmatter has `name`, `description`, `model`, `tools`
- Filename matches the frontmatter `name`
- `model` is one of `sonnet`, `opus`, `haiku`
- Body has an H1 heading
- Body has `## Role`, `## Output format`, and `## Rules` sections

If it passes, your file is structurally valid. It does NOT guarantee the agent produces good output — that's what the reference tests under `tests/` are for.

The same lint runs in CI on every push and PR via `.github/workflows/lint.yml`, so you'll get a green check on GitHub before merge.

---

## Documenting the agent

After adding the file, update three things:

1. **`README.md`** — add a row to the appropriate tier table.
   - **Tier 1** if the agent is a standalone daily driver (answers one question, runs independently, produces a Markdown file a human can paste into a ticket).
   - **Tier 2** if the agent is part of the live-validation chain (needs another agent to have run first, e.g., needs a running app or a prior file in `qa-output/`).
   - **Tier 3** if the agent is an orchestration or niche supporting agent (most users won't reach for it every day).
2. **`CLAUDE.md`** — add a row to the agent map with the agent's `Reads` and `Writes` contract. This is what downstream agents consult to know the chain.
3. **`AGENTS.md`** — only if the agent has cross-agent dependencies worth calling out in the behavioral rules.

---

## Testing your new agent

Add a worked example under `tests/<your-agent-name>/`:

- **`input-*.md`** — realistic input(s) the agent will consume. For a reviewer, this is a sample diff + sample AC. For a generator, this is a sample AC or finding. Keep it small — a 10-line diff and a 5-AC ticket are usually enough to exercise the interesting paths.
- **`expected-output.md`** — what a "good enough" output looks like for that input. Not a ground-truth string-match target. A human reading both files should be able to say "yes, this shape is what I'd expect from this agent on this input".

See [`tests/README.md`](../tests/README.md) and the existing examples under `tests/functional-reviewer/` and `tests/test-scenario-designer/` for the pattern.

**Why this matters**: LLMs aren't deterministic, and string-equality tests on LLM output produce brittle red herrings that break on every run. The reference-example pattern is slower (it needs a human to glance at the diff) but it actually catches regressions in the *shape* of an agent's answer — missing sections, missing AC verdicts, missing evidence citations — which is what usually breaks when someone edits a Role section carelessly.

---

## Stack-agnostic design

QA Orchestra agents **never hardcode framework-specific details**. All project-specific commands, URLs, file paths, and conventions come from `context/CONTEXT.md` (see [`context/CONTEXT.schema.md`](../context/CONTEXT.schema.md) for the required shape).

When writing a new agent:

- Do not hardcode npm, pytest, cargo, or any toolchain. Read the run command from CONTEXT.md's Automation Framework section.
- Do not hardcode repo names or paths. Read them from CONTEXT.md's Repositories section.
- Do not hardcode health-check URLs, content markers, or log sentinels. Read them from CONTEXT.md's Health Check section.
- Do not hardcode severity definitions, AC format, or terminology. Read them from CONTEXT.md's Project Management and Preferences sections.

If your agent needs something CONTEXT.md doesn't define, **add it to the schema** in `context/CONTEXT.schema.md` as an optional section, and the user who installs your agent will populate it for their stack.

---

## Final checklist

Before opening a PR:

- [ ] Agent file at `.claude/agents/<name>.md` with valid YAML frontmatter
- [ ] Body has `## Role`, `## Output format`, and `## Rules` sections
- [ ] Trigger block at the top naming Reads / Writes
- [ ] `node scripts/validate-agents.mjs` passes locally
- [ ] Row added to the appropriate tier in `README.md`
- [ ] Row added to the agent map in `CLAUDE.md`
- [ ] Reference example in `tests/<name>/` with realistic input + expected output
- [ ] Commit message is one line, descriptive, imperative (e.g. `feat: add compliance-reviewer agent`)

Open a PR against `main`. CI will run the structural linter automatically. Once it passes and a maintainer approves, your agent is in.
