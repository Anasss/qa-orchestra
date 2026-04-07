# QA Orchestra

**10 AI agents that turn your PR into a full QA report.** Clone, configure, test.

QA Orchestra is an open-source, multi-agent QA toolkit for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It chains diff analysis, AC compliance checking, test scenario design, browser validation, automation code generation, and bug reporting — all from a single workspace.

No SaaS. No API keys beyond Claude. Works with **any stack**.

---

## 30-Second Setup

```bash
# 1. Clone into your workspace (alongside your project repos)
git clone https://github.com/Anasss/qa-orchestra.git
cd qa-orchestra

# 2. Fill in your project context
cp examples/CONTEXT.example.md context/CONTEXT.md
# Edit context/CONTEXT.md with your stack, repos, URLs, and commands

# 3. Open Claude Code — agents auto-load
claude
# That's it. Type @functional-reviewer, @test-scenario-designer, etc.
```

## What It Does

```
You: "Test PR #42"

QA Orchestra:
  1. Checks out the branch, starts your app           → environment-status.md
  2. Compares diff vs acceptance criteria              → functional-review.md
  3. Generates 10-20 test scenarios                    → test-scenarios.md
  4. Validates in a real browser via Chrome MCP        → browser-validation.md
  5. Files structured bug reports for every gap        → bug-reports.md
  6. Generates Playwright/Cypress test code            → automation/*.spec.ts
```

Every agent writes to `qa-output/`. The next agent reads from there. No copy-pasting between agents.

## Agents

| Agent | Model | What it does |
|---|---|---|
| **orchestrator** | Sonnet | Routes tickets to the right agents in the right order |
| **functional-reviewer** | Opus | Compares diff vs AC — finds gaps, risks, missing coverage |
| **test-scenario-designer** | Sonnet | Generates test scenarios (happy, negative, boundary, edge) |
| **automation-writer** | Sonnet | Converts scenarios to Playwright / Cypress / Gherkin code |
| **bug-reporter** | Sonnet | Turns findings into developer-ready bug reports |
| **manual-validator** | Sonnet | Guides manual test execution, tracks pass/fail |
| **environment-manager** | Sonnet | Checks out PR branches, starts app, runs health checks |
| **browser-validator** | Sonnet | Validates scenarios in a real browser via Chrome MCP |
| **release-analyzer** | Opus | Multi-repo release diff analysis with cross-repo impact mapping |
| **smart-test-selector** | Sonnet | Maps code changes to existing tests — finds what to run, what may break |

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

```
@functional-reviewer Compare this diff against these ACs: [paste AC]
@test-scenario-designer Generate scenarios for: [paste AC]
@automation-writer Read qa-output/test-scenarios.md and generate Playwright tests
@browser-validator Validate Must Test scenarios against the running app
@bug-reporter Read qa-output/functional-review.md and create bug reports
@manual-validator Guide me through qa-output/test-scenarios.md
@release-analyzer Analyze the diff between v1.0 and HEAD across all repos
@smart-test-selector Which existing tests are affected by this diff?
```

### Common workflows

| I want to... | Run |
|---|---|
| Review a PR for AC compliance | `@functional-reviewer` |
| Generate test cases from a ticket | `@test-scenario-designer` |
| Get test scenarios + automation code | `@test-scenario-designer` then `@automation-writer` |
| Validate a feature in the browser | `@environment-manager` then `@browser-validator` |
| Analyze a release across repos | `@release-analyzer` |
| Find which tests a diff affects | `@smart-test-selector` |
| Full end-to-end QA | `@orchestrator` |

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
│   └── CONTEXT.example.md
├── qa-output/              ← Agent outputs (gitignored, generated per session)
├── CLAUDE.md               ← Claude Code project instructions
├── AGENTS.md               ← Behavioral rules for all agents
└── .mcp.json               ← MCP server config template
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

Configure in `.mcp.json`. Tokens go in `.mcp.local.json` (gitignored).

## Living Context

`context/CONTEXT.md` is the single source of truth for your stack. Every agent reads it.

`context/annotations/` accumulates project-specific learnings across sessions:
- **services.md** — backend quirks and behaviors
- **environments.md** — environment-specific gotchas
- **test-patterns.md** — test suite patterns
- **domain.md** — business logic nuances

Agents update these files automatically. Over time, your QA context gets smarter.

## Cost Per Ticket

| Pipeline | Models used | Estimated cost |
|---|---|---|
| Functional review only | Opus | ~$0.04-0.06 |
| Test scenarios + automation | Sonnet | ~$0.02-0.04 |
| Full pipeline | Opus + Sonnet | ~$0.06-0.10 |

## Why QA Orchestra?

Existing tools in this space fall into two categories:

1. **AI code review tools** (CodeRabbit, Qodo, Copilot) — focus on the PR diff. None do AC compliance, test scenario generation, or QA lifecycle orchestration.

2. **Generic agent collections** (100+ agent marketplaces) — have a single "tester" prompt. No output chaining, no orchestration, no multi-repo awareness.

QA Orchestra is the first open-source tool that chains the entire QA lifecycle: **diff analysis > AC compliance > test scenarios > browser validation > bug reports > automation code**.

## Contributing

PRs welcome. The agents live in `.claude/agents/` — each is a standalone Markdown file with YAML frontmatter. To add a new agent:

1. Create `.claude/agents/your-agent.md` with the frontmatter format
2. Add it to the agent map in `CLAUDE.md`
3. Update `AGENTS.md` if it has chaining dependencies
4. Submit a PR

## License

MIT
