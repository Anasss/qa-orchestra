# QA Orchestra — Claude Code Instructions

@context/CONTEXT.md

## What this project is

An open-source, multi-agent QA toolkit for Claude Code. Each QA task is handled by a specialized
agent in `.claude/agents/`. Project context is auto-loaded from `context/CONTEXT.md` above.

**Stack-agnostic.** Works with any web application — React, Angular, Vue, Rails, Django, Spring Boot,
or any other stack. All project-specific details live in `context/CONTEXT.md`.

## Quick start

```bash
# 1. Clone into your workspace
git clone https://github.com/Anasss/qa-orchestra.git

# 2. Fill in your project context
cp examples/CONTEXT.example.md context/CONTEXT.md
# Edit context/CONTEXT.md with your stack details

# 3. Open Claude Code — agents auto-load from .claude/agents/
# Type @agent-name or describe what you need
```

## How to invoke agents

```bash
# Full pipeline — checkout PR, run app, validate in browser, review diff, generate tests
"Run @orchestrator for PR #42 on my-backend and PR #38 on my-frontend"

# Direct invocation
"@environment-manager checkout feature/ISSUE-1 and start the app"
"@functional-reviewer compare this diff against these ACs: ..."
"@test-scenario-designer generate scenarios for these ACs: ..."
"@automation-writer read qa-output/test-scenarios.md and generate Playwright tests"
"@manual-validator guide me through qa-output/test-scenarios.md"
"@bug-reporter read qa-output/functional-review.md and create bug reports"
"@browser-validator validate scenarios against the running app"
"@release-analyzer analyze the diff between v1.0 and HEAD across all repos"
"@smart-test-selector which existing tests are affected by this diff?"
```

## Agent map

| Agent | Model | Reads | Writes |
|---|---|---|---|
| orchestrator | Sonnet | ticket + inputs | `qa-output/plan.md` |
| environment-manager | Sonnet | PR/branch + CONTEXT.md | `qa-output/environment-status.md` |
| functional-reviewer | Opus | AC + diff + browser findings | `qa-output/functional-review.md` |
| bug-reporter | Sonnet | functional-review + browser-validation | `qa-output/bug-reports.md` |
| test-scenario-designer | Sonnet | AC | `qa-output/test-scenarios.md` |
| automation-writer | Sonnet | test-scenarios.md | `qa-output/automation/` |
| manual-validator | Sonnet | test-scenarios.md | `qa-output/validation-report.md` |
| browser-validator | Sonnet | test-scenarios.md + Chrome MCP | `qa-output/browser-validation.md` |
| release-analyzer | Opus | multi-repo diffs + AC | `qa-output/release-analysis.md` |
| smart-test-selector | Sonnet | diff + existing tests | `qa-output/test-selection.md` |

## Execution flow

```
1. environment-manager
   └── Checkout branches, install deps, start app, health check

2. (parallel)
   ├── functional-reviewer ──→ qa-output/functional-review.md
   └── test-scenario-designer ──→ qa-output/test-scenarios.md

3. browser-validator (Chrome MCP)
   └── Navigate app, execute scenarios, verify ──→ qa-output/browser-validation.md

4. (conditional, parallel)
   ├── bug-reporter (if gaps found) ──→ qa-output/bug-reports.md
   └── automation-writer ──→ qa-output/automation/
```

## Output chaining

Every agent saves output to `qa-output/`. The next agent reads from that file.
Never paste raw output between agents — always reference the file path.

## Key principle: Live validation

The workflow is designed around **testing running code**, not just reading diffs.
The environment-manager checks out the PR branch and runs the application locally.
Browser validation happens against the actual running feature, not theoretical analysis.

## Verification

Before running any agent, define what "done" looks like.
If output looks wrong, stop — do not continue the chain with bad input.
