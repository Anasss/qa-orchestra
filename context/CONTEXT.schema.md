# context/CONTEXT.md — Required Schema

Every agent in QA Orchestra reads `context/CONTEXT.md` before starting work. This file is your project's single source of truth for stack details, URLs, commands, and conventions. Agents never hardcode framework-specific details — they look them up here.

This document defines the **minimum schema** `context/CONTEXT.md` should follow so agents can rely on it. See [examples/CONTEXT.example.md](../examples/CONTEXT.example.md) for a filled-in example.

> This schema is **not enforced by a lint script** — `CONTEXT.md` is yours, and the agents are designed to degrade gracefully when sections are missing. But they expect the shape below. Deviating means some agents may fall back to asking you, or skip steps entirely.

---

## Required sections

### `## Application Under Test`

What's being tested. Everything an agent needs to know to open a browser or hit an API.

- **Name** and **type** (e.g., "e-commerce store", "SaaS dashboard", "internal admin tool")
- **Stack**: frontend framework, backend language/framework, database
- **Local URLs**: frontend URL, backend API base URL, admin panel URL
- **Credentials** for test accounts, if the app requires login

**Read by**: `environment-manager`, `browser-validator`, all reviewers

---

### `## Repositories`

Every repo in the workspace that agents may touch. Use a table.

| Repo | URL | Local path | Purpose |
|---|---|---|---|
| my-backend | github.com/org/my-backend | `my-backend/` | API + business logic |
| my-frontend | github.com/org/my-frontend | `my-frontend/` | UI |

**Read by**: `environment-manager` (for `git checkout`), `release-analyzer`, `functional-reviewer` (to run `git diff` locally)

---

### `## Environment Setup`

Commands to bring the environment up from a clean state. Expressed as shell commands, not prose — agents execute these directly.

- Start database / containers
- Install dependencies
- Run migrations
- Seed data (if applicable)
- Create test user (if applicable)
- Start backend (command + port)
- Start frontend (command + port)

**Read by**: `environment-manager`

---

### `## Health Check` — required for live validation

Defines what *"the app is working"* means in concrete, testable terms. The `environment-manager` uses this to decide READY vs NOT READY — so **the richer this section, the less the agent has to guess**.

For every service, specify three signals:

1. **Terminal status URL** — a URL that, when followed through redirects, returns 200. Not the first response, the final one.
2. **Content markers** — strings the response body must contain on success (a heading, a `data-testid`, a known count of domain records, a JSON field). A status code alone is not enough — the page could be a 200 error page.
3. **Log sentinel** — the log line that means the dev server is ready to serve requests (e.g., `Ready in`, `Server is ready on port`, `Listening on`).

**Example**:

```markdown
## Health Check

| Service  | Terminal URL                        | Expected status | Content marker                         | Log sentinel           |
|----------|-------------------------------------|-----------------|----------------------------------------|------------------------|
| Backend  | http://localhost:9000/health        | 200             | `"status": "ok"`                       | `Server is ready`      |
| Frontend | http://localhost:8000/              | 200             | `data-testid="product-wrapper"` x 12   | `Ready in`             |
```

**Why this matters**: without content markers, a redirect loop or a 200-wrapped error page will pass the health check and poison the downstream agents with a false READY verdict. See [`environment-manager.md`](../.claude/agents/environment-manager.md) for the failure modes this defends against.

**Read by**: `environment-manager` (required)

---

### `## Automation Framework`

The existing test suite's shape — so `automation-writer` can generate code that fits, and `smart-test-selector` can scan the right files.

- **Language** (TypeScript, Python, Java, ...)
- **Framework** (Playwright, Cypress, Selenium, Playwright-pytest, ...)
- **Test runner**
- **BDD format** (plain describe/it, Gherkin, ...)
- **Test file naming** (`*.spec.ts`, `test_*.py`, ...)
- **Test directory**
- **Run command**
- **Tags used** (e.g., `@smoke`, `@regression`, `@must-test`)

**Read by**: `automation-writer`, `smart-test-selector`, `manual-validator`

---

### `## Project Management`

How your team tracks work. Agents use this to format bug reports and test scenarios in a way your existing tools can ingest.

- **Ticket system** (GitHub Issues, Jira, Linear, ...)
- **AC format convention** (bullet points, Gherkin, custom template)
- **Bug severity definitions** (Critical / Major / Minor / Trivial — or override with your own scale)
- **Bug report format** (Steps to Reproduce, Expected, Actual, Severity, ...)
- **Branch naming convention**

**Read by**: `bug-reporter`, `orchestrator`

---

### `## Preferences`

Small but important.

- **Output language** — agents default to English unless you override here
- **Tone** (concise, developer-friendly, formal, ...)
- **Terminology overrides** (e.g., "bug" not "defect", "ticket" not "issue", "test scenario" not "test case")

**Read by**: every agent

---

## Optional sections

These are useful when present and skipped when absent. Agents do not fail without them.

- `## Custom Features` — project-specific endpoints, modules, or capabilities worth naming
- `## Products & Categories` / `## Domain Data` — seed data summary, sample record counts
- `## CI/CD` — pipeline, environments, test execution in CI
- `## Quality Standards` — definition of done, regression scope, release gates
- `## MCP Servers` — project-specific MCP configuration notes

---

## Annotations

`context/annotations/*.md` accumulate project-specific learnings over time. They are **not** part of this schema — they grow organically as agents hit surprises. Typical files:

- `services.md` — backend quirks and behaviors
- `environments.md` — environment-specific gotchas
- `test-patterns.md` — test suite conventions learned from reading real code
- `domain.md` — business logic nuances

Agents read annotations when relevant to the current task, and append to them when they learn something worth keeping.
