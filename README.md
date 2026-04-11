# QA Orchestra

**10 standalone QA agents for Claude Code.** Each one answers a specific question about your PR — *does this diff implement the AC?*, *what scenarios do I need?*, *which of my tests will break?* — and writes a Markdown report you can paste into GitHub or Jira.

QA Orchestra is an open-source, composable agent library for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Pick one agent, run it, get an answer. Compose them only when you want to.

**Two layers, working together**: the agents bring QA expertise — how to read a diff against acceptance criteria, how to design test scenarios that find real bugs, how to map a change to the tests that already exist. MCP brings the data they reason about — GitHub issues and PRs, Chrome DevTools for browser validation, Jira or GitLab if you use them. You bring `context/CONTEXT.md`, which describes your stack and conventions in one file.

No SaaS. No API keys beyond Claude. Works with **any stack**.

---

## Install

### Option A: Plugin install (recommended)

QA Orchestra is a Claude Code plugin. Installing it takes two steps: add the marketplace once, then install the plugin itself. You can do the install step from the CLI or from the UI — pick whichever you prefer.

**Step 1 — Add the marketplace** *(one time per machine, UI only)*:

1. Open **Manage Plugins** (Customize menu → **Manage plugins**).
2. Go to the **Marketplaces** tab. In the "GitHub repo, URL, or path" field, paste `Anasss/qa-orchestra` and click **Add**.

**Step 2 — Install the plugin** *(pick either path)*:

**CLI** — in any Claude Code chat, run:

```
/plugin install qa-orchestra@qa-orchestra
/reload-plugins
```

Claude Code will confirm with `Installed qa-orchestra. Run /reload-plugins to apply.`, and the reload step then registers the agents (you'll see a line like `Reloaded: N plugins · N skills · N agents · ...`).

**UI** — in the same Manage Plugins panel, switch to the **Plugins** tab, find `qa-orchestra` under AVAILABLE, and click **Install**.

Both paths do the same thing. Once installed, all 10 agents are available in your project. Type `@functional-reviewer`, `@orchestrator`, and so on in any Claude Code chat.

### Option B: Global agents (available in all projects)

```bash
# Clone and copy agents to your global directory
git clone https://github.com/Anasss/qa-orchestra.git
cp qa-orchestra/.claude/agents/*.md ~/.claude/agents/
```

### Option C: Clone into your workspace

```bash
# 1. Clone alongside your project repos
git clone https://github.com/Anasss/qa-orchestra.git
cd qa-orchestra

# 2. Fill in your project context
cp examples/CONTEXT.example.md context/CONTEXT.md
# Edit context/CONTEXT.md with your stack, repos, URLs, and commands

# 3. Open Claude Code — agents auto-load from .claude/agents/
claude
```

### Setup (all options)

After installing, create your project context:

```bash
cp examples/CONTEXT.example.md context/CONTEXT.md
# Edit context/CONTEXT.md with your stack, repos, URLs, and commands
```

## What It Does

Pick one agent for one question. **`@functional-reviewer` is the most common entry point**:

```
You: @functional-reviewer Compare PR #42 against these ACs:
     AC-1: users can add items to the cart from the product listing page
     AC-2: the cart count in the nav header updates immediately after adding

QA Orchestra writes qa-output/functional-review.md:
  - AC-1: COVERED at src/components/quick-add-button.tsx:43
  - AC-2: AT RISK — no router.refresh() after the server action
  - 2 regression risks in unchanged code paths touched by the diff
  - Verdict: GAPS — needs browser validation on AC-2
```

One agent. One question. One Markdown file you can paste into GitHub or Jira.

**Other standalone entry points**:

- `@test-scenario-designer` — generate test scenarios from acceptance criteria (happy, negative, boundary, edge)
- `@smart-test-selector` — map a diff to your existing tests; find what to run, what may break, and where coverage is missing
- `@bug-reporter` — turn findings into developer-ready bug reports

Each runs independently. None requires the orchestrator or a prior agent to have run. See the [agent tiers below](#agents).

### Full pipeline (optional)

If you want the full chain — branch checkout → live browser validation → automation code — `@orchestrator` routes the sequence. The pipeline is powerful but has more moving parts. **If you're starting out, run one agent at a time.** Most users never touch the orchestrator.

Every agent writes to `qa-output/`. The next agent reads from there. No copy-pasting between agents.

### What QA Orchestra does NOT do

QA Orchestra is focused on **functional correctness against acceptance criteria**. It is not a general-purpose AI review tool. It does NOT do:

- **Code quality review, linting, or style feedback** — use CodeRabbit, Qodo, or Copilot for that
- **Security scanning, SAST/DAST, or dependency audits**
- **Performance profiling, load testing, or flamegraph analysis**
- **Unit-test generation from source code** — it generates scenarios from acceptance criteria, not tests from implementation details

If your question is *"does this PR pass my tests?"* or *"is this code stylistically good?"*, QA Orchestra is the wrong tool. If your question is *"does this PR actually deliver the behavior the ticket asked for?"*, it is the right tool.

## Agents

QA Orchestra ships **10 agents organized by how you'll actually use them.** Most users live in Tier 1. You can stop reading after the first table if you want — everything below it is optional.

### Tier 1 — Standalone use cases (start here)

These four agents are the daily drivers. Each answers one question, runs independently, and produces a Markdown file you can paste into GitHub, Jira, or Linear.

| Agent | Model | Answers the question |
|---|---|---|
| **functional-reviewer** | Opus | Does this diff actually implement the acceptance criteria? Where are the gaps and risks? |
| **test-scenario-designer** | Sonnet | What test scenarios do I need to cover this AC? Happy path, negative, boundary, edge. |
| **smart-test-selector** | Sonnet | Which of my existing tests does this diff affect? What's likely to break? Where are my coverage gaps? |
| **bug-reporter** | Sonnet | Turn these findings into developer-ready bug reports. |

### Tier 2 — Live validation chain

These two agents work together to test the feature in a real browser, not just read the diff. They're what separates QA Orchestra from static AI review tools.

| Agent | Model | What it does |
|---|---|---|
| **environment-manager** | Sonnet | Checks out the PR branch, starts the app locally, verifies end-to-end health before handing off |
| **browser-validator** | Sonnet | Navigates the running app via Chrome MCP, executes test scenarios, verifies expected results, and captures evidence |

**Requires**: Chrome DevTools MCP, a local dev environment, and a `context/CONTEXT.md` that describes how to start your app. See the [MCP Servers](#mcp-servers-optional) section.

### Tier 3 — Orchestration and supporting agents

You won't reach for these every day. They exist for the full-pipeline workflow and for more niche situations.

| Agent | Model | What it does |
|---|---|---|
| **orchestrator** | Sonnet | Routes a ticket through the full pipeline, deciding which agents to run and in what order |
| **release-analyzer** | Opus | Multi-repo release diff analysis — cross-repo impact, AC compliance gaps, and deployment risks |
| **automation-writer** | Sonnet | Converts test scenarios into runnable test code — Playwright, Cypress, Selenium, pytest, JUnit, or Gherkin — following your project's existing patterns |
| **manual-validator** | Sonnet | Guides manual test execution, tracks pass/fail, produces a validation report |

## Start here — pick a recipe

You landed here because you have a question. Find the row that matches and run the command. Each row is a complete, standalone invocation — nothing else to set up beyond `context/CONTEXT.md`.

| I want to... | Run |
|---|---|
| Review a PR for AC compliance | `@functional-reviewer Compare this diff against these ACs: ...` |
| Generate test scenarios from a ticket | `@test-scenario-designer Generate scenarios for these ACs: ...` |
| Find which of my existing tests a diff affects | `@smart-test-selector Which existing tests are affected by this diff?` |
| Turn findings into developer-ready bug reports | `@bug-reporter Read qa-output/functional-review.md and create bug reports` |
| Get test scenarios + runnable automation code | `@test-scenario-designer` then `@automation-writer` |
| Validate a feature live in a real browser | `@environment-manager` then `@browser-validator` |
| Analyze a release across multiple repos | `@release-analyzer Analyze the diff between v1.0 and HEAD across all repos` |
| Run the full end-to-end pipeline *(experimental)* | `@orchestrator Run full pipeline for PR #42` |

If your question isn't in the table, pick the Tier 1 agent whose description matches best and describe your task in plain English.

## Architecture

```
                    ┌──────────────────────┐
                    │     ORCHESTRATOR     │
                    │      (Sonnet)        │
                    └─────────┬────────────┘
                              │ routes
            ┌─────────────────┼─────────────────┐
            v                 v                 v
   ┌────────────────┐ ┌──────────────┐  ┌──────────────┐
   │  FUNCTIONAL    │ │    TEST      │  │   BROWSER    │
   │  REVIEWER      │ │  SCENARIO    │  │  VALIDATOR   │
   │  (Opus)        │ │  DESIGNER    │  │ (Chrome MCP) │
   └───────┬────────┘ │  (Sonnet)    │  └──────────────┘
           │          └──────┬───────┘
           v                 ├──────────────┐
   ┌────────────────┐        v              v
   │  BUG REPORTER  │ ┌──────────────┐ ┌──────────────┐
   │  (Sonnet)      │ │  AUTOMATION  │ │   MANUAL     │
   └────────────────┘ │  WRITER      │ │  VALIDATOR   │
                      │  (Sonnet)    │ │  (Sonnet)    │
                      └──────────────┘ └──────────────┘
```

## How To Use

### Full QA pipeline on a PR

```
@orchestrator Run full pipeline for PR #42 on my-backend and PR #38 on my-frontend
```

### Individual agents

**Every agent is a legitimate standalone entry point.** You don't need the orchestrator, a full pipeline, or any upstream agent to call one — just invoke the agent that matches your current question. Each agent declares its inputs (from `qa-output/` or from you) and its output file in the agent map (see [CLAUDE.md](CLAUDE.md#agent-map)), so the contract is explicit.

```
@environment-manager Checkout feature/ISSUE-1 and start the app
@functional-reviewer Compare this diff against these ACs: [paste AC]
@test-scenario-designer Generate scenarios for: [paste AC]
@automation-writer Read qa-output/test-scenarios.md and generate Playwright tests
@browser-validator Validate Must Test scenarios against the running app
@bug-reporter Read qa-output/functional-review.md and create bug reports
@manual-validator Guide me through qa-output/test-scenarios.md
@release-analyzer Analyze the diff between v1.0 and HEAD across all repos
@smart-test-selector Which existing tests are affected by this diff?
```

For a quick decision table of which agent to run for which question, see [Start here — pick a recipe](#start-here--pick-a-recipe) above.

## Output Chaining

Each agent writes structured Markdown to `qa-output/`. The next agent reads from there.

```
qa-output/
├── plan.md                 ← Orchestrator
├── environment-status.md   ← Environment Manager
├── functional-review.md    ← Functional Reviewer
├── test-scenarios.md       ← Test Scenario Designer
├── browser-validation.md   ← Browser Validator
├── bug-reports.md          ← Bug Reporter
├── validation-report.md    ← Manual Validator
├── test-selection.md       ← Smart Test Selector
├── release-analysis.md     ← Release Analyzer
└── automation/             ← Automation Writer
    ├── feature.spec.ts
    └── pages/feature.page.ts
```

## Project Structure

```
qa-orchestra/
├── .claude-plugin/         ← Plugin manifest (for /plugin install)
│   ├── plugin.json
│   └── marketplace.json
├── .claude/agents/         ← 10 native Claude Code agents (auto-discovered)
│   ├── orchestrator.md
│   ├── functional-reviewer.md
│   ├── test-scenario-designer.md
│   ├── automation-writer.md
│   ├── bug-reporter.md
│   ├── manual-validator.md
│   ├── environment-manager.md
│   ├── browser-validator.md
│   ├── release-analyzer.md
│   └── smart-test-selector.md
├── context/                ← Your project context (single source of truth)
│   ├── CONTEXT.md          ← Fill this in (only required setup)
│   └── annotations/        ← Learnings agents accumulate over time
├── examples/               ← Example configurations
│   ├── CONTEXT.example.md
│   └── mcp.example.json    ← MCP server config template
├── qa-output/              ← Agent outputs (gitignored, generated per session)
├── CLAUDE.md               ← Claude Code project instructions
└── AGENTS.md               ← Behavioral rules for all agents
```

## Stack-Agnostic Design

QA Orchestra works with **any web application**. All project-specific details live in one file: `context/CONTEXT.md`.

The agents read your start commands, repo paths, URLs, and conventions from CONTEXT.md — they never hardcode framework-specific details.

**Works with**: React, Angular, Vue, Svelte, Next.js, Nuxt, Rails, Django, Spring Boot, Express, FastAPI, Laravel, .NET, Go — any stack with a local dev server.

## MCP Servers (Optional)

QA Orchestra integrates with MCP servers for enhanced capabilities:

| Server | Purpose | Required? |
|---|---|---|
| **Chrome DevTools** | Browser validation — navigate, click, verify | For `@browser-validator` |
| **GitHub** | Read issues, PRs, diffs | For PR-based workflows |
| **Jira** | Read tickets and AC | If using Jira |
| **GitLab** | Read MRs and diffs | If using GitLab |

A template lives at `examples/mcp.example.json` — copy it to `.mcp.local.json` in your project root and fill in your tokens. `.mcp.local.json` is gitignored.

> **Don't double-configure.** If you've already installed the `chrome-devtools-mcp` or `github` plugins from Claude Code's official marketplace, do NOT also declare those servers in your own `.mcp.local.json` — Claude Code will log a "server skipped — same command/URL as already-configured" warning on startup, and one of the two declarations silently won't work. Keep each MCP server declared exactly once across your whole setup.

## Living Context

`context/CONTEXT.md` is the single source of truth for your stack. Every agent reads it.

**You don't need to be a developer to edit CONTEXT.md.** Your product owner can set AC format conventions, severity definitions, and terminology. Your QA lead can refine the review criteria. Your business analyst can document domain rules the agents should enforce. Every agent reads CONTEXT.md and adjusts its behavior accordingly — no code changes required. The expertise layer lives in Markdown, not in source files.

`context/annotations/` accumulates project-specific learnings across sessions:
- **services.md** — backend quirks and behaviors
- **environments.md** — environment-specific gotchas
- **test-patterns.md** — test suite patterns
- **domain.md** — business logic nuances

Agents update these files automatically. Over time, your QA context gets smarter.

## Why QA Orchestra?

Existing tools in this space fall into two categories:

1. **AI code review tools** (CodeRabbit, Qodo, Copilot) — focus on the PR diff. None do AC compliance, test scenario generation, or QA lifecycle orchestration.

2. **Generic agent collections** (100+ agent marketplaces) — have a single "tester" prompt. No output chaining, no orchestration, no multi-repo awareness.

QA Orchestra is the first open-source library of composable Claude Code agents covering the full QA lifecycle: **diff analysis, AC compliance, test scenarios, browser validation, bug reports, and automation code**. Each agent is standalone — use what you need, when you need it, and skip the rest.

## Contributing

PRs welcome. The agents live in `.claude/agents/` — each is a standalone Markdown file with YAML frontmatter. To add a new agent:

1. Create `.claude/agents/your-agent.md` with the frontmatter format
2. Add it to the agent map in `CLAUDE.md`
3. Update `AGENTS.md` if it has chaining dependencies
4. Submit a PR

## License

MIT
