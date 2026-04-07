# AGENTS.md — QA Orchestra Behavioral Instructions

This file defines how AI agents must behave in this project.
It applies to Claude Code, Copilot, Cursor, and any agent reading this workspace.

---

## 1. Before every task

1. Project context is auto-loaded via `@context/CONTEXT.md` in CLAUDE.md — do not re-read it manually.
2. Check `context/annotations/` — scan for any annotation file relevant to your current task.
3. Check `qa-output/` — if a prior agent already ran, read its output file before starting.
4. Check `qa-output/environment-status.md` — if the environment manager has run, use its status to understand which branches are checked out and which services are running.

---

## 2. Environment-first principle

**The application must be running from the feature branch before any validation happens.**

If a PR or branch is provided:
1. The `environment-manager` agent must run first to checkout and start the app.
2. Browser validation runs against the **live running application**, not theoretical analysis.
3. The functional reviewer can read the diff locally from the checked-out branch — no need to paste diffs.

If the user says the app is already running from the feature branch, skip the environment-manager.

---

## 3. Output discipline

- **Always save output to the correct file in `qa-output/`** (see CLAUDE.md agent map).
- Output format is structured Markdown, copy-pasteable into GitHub Issues / Jira / Linear.
- Never truncate output. If content is long, split into sections but deliver completely.
- If you cannot produce a complete output (missing input), **stop and ask** — do not fabricate.
- Screenshots from browser validation go to `qa-output/screenshots/`.

---

## 4. Agent chaining

When one agent's output feeds the next:

```
environment-manager → writes qa-output/environment-status.md
functional-reviewer → writes qa-output/functional-review.md
test-scenario-designer → writes qa-output/test-scenarios.md
browser-validator   → reads test-scenarios.md, writes qa-output/browser-validation.md
bug-reporter        → reads functional-review.md + browser-validation.md
automation-writer   → reads test-scenarios.md
manual-validator    → reads test-scenarios.md
```

Never redo upstream work. Trust the file.

---

## 5. Parallelism

When the orchestrator determines that two agents can run in parallel:
- Invoke both in a single response using parallel tool calls (Agent tool with two subagents).
- Clearly label each parallel output with its agent name before saving.

---

## 6. When inputs are missing

| Missing input | Action |
|---|---|
| No AC provided | Ask the user: "Please provide the acceptance criteria for this ticket." |
| No PR or branch provided | Ask: "Please provide the PR number or branch name to checkout." |
| No diff available | Get the diff locally: `git diff main...<branch>` from the checked-out repo |
| App not running | Run `environment-manager` first |
| No test scenarios (automation-writer) | Read `qa-output/test-scenarios.md`. If missing, ask: "Run the test-scenario-designer first." |
| Chrome MCP not available | Skip browser-validation, note it in the plan |
| Ambiguous AC | Flag the ambiguity, create scenarios for both interpretations, mark as `[ASSUMPTION]`. |

Never proceed on assumed inputs without flagging them.

---

## 7. Learning loop

After completing any agent task, check: **did you learn something project-specific that isn't already in `context/annotations/`?**

Examples worth saving:
- A service behaves differently than the AC implied
- A test pattern specific to this codebase
- A known environment quirk
- A UI pattern (e.g., "data-testid attributes are used on all interactive elements")

If yes, append it to the relevant file in `context/annotations/` (services, environments, test-patterns, or domain).

---

## 8. Tone and output style

- Output language: follow `context/CONTEXT.md → Preferences → Language`.
- Be specific. Reference file names, line numbers, AC IDs.
- Distinguish facts from assumptions. Mark assumptions with `[ASSUMPTION]`.
- Do not add praise, filler, or conversational wrapping to structured outputs.
- Bug reports, test scenarios, and validation reports must be immediately usable without editing.
