# Project Context

> This file is read by every agent before starting work.
> Fill it in with your project details. See examples/CONTEXT.example.md for a completed reference.
> Last updated: [date]

---

## Application Under Test

- **Name**: [Your app name]
- **Type**: [e.g., E-commerce, SaaS dashboard, Mobile API]
- **Frontend**: [e.g., Next.js 15 / React 19 / TypeScript]
- **Backend**: [e.g., Node.js / Express / TypeScript]
- **Database**: [e.g., PostgreSQL, MongoDB, MySQL]
- **API layer**: [REST / GraphQL] — base URL: `http://localhost:[port]`
- **Frontend URL (local)**: `http://localhost:[port]`

## Repositories

| Repo | URL | Local path | Purpose |
|---|---|---|---|
| [backend-repo] | github.com/org/backend | `backend/` | API + services |
| [frontend-repo] | github.com/org/frontend | `frontend/` | Web application |
| [qa-repo] | github.com/org/qa | `qa/` | Test suite |

## Environment Setup

- **Start database**: `[command]`
- **Install backend deps**: `cd [backend-path] && [install command]`
- **Run migrations**: `cd [backend-path] && [migration command]`
- **Seed data**: `cd [backend-path] && [seed command]`
- **Start backend**: `cd [backend-path] && [start command]`
- **Start frontend**: `cd [frontend-path] && [start command]`
- **Health check URL**: `http://localhost:[port]/health`

## Automation Framework

- **Language**: [e.g., TypeScript, Python, Java]
- **Framework**: [e.g., Playwright, Cypress, Selenium, pytest]
- **Test runner**: [e.g., @playwright/test, jest, pytest]
- **Test file naming**: [e.g., `*.spec.ts`, `*_test.py`]
- **Test directory**: [e.g., `qa/e2e/`]
- **Run command**: [e.g., `npx playwright test`]
- **Tags used**: [e.g., `@smoke`, `@regression`, `@must-test`]

## Project Management

- **Ticket system**: [GitHub Issues / Jira / Linear / GitLab Issues]
- **AC format**: [Bullet points / Given-When-Then / Free-form]
- **Bug severity definitions**: Critical / Major / Minor / Trivial
- **Branch naming**: [e.g., `feature/ISSUE-N-description`]

## CI/CD

- **Pipeline**: [GitHub Actions / GitLab CI / Jenkins / CircleCI]
- **Test execution in CI**: [e.g., `npx playwright test --project=chromium`]
- **Environments**:
  - Local: `http://localhost:[port]`
  - Staging: [URL or N/A]
  - Production: [URL or N/A]

## Quality Standards

- **Definition of Done**:
  - All Must Test scenarios pass
  - No Critical or Major bugs open
  - Functional review shows no AC gaps
  - Browser validation confirms UI behavior
- **Regression scope**: [e.g., Full suite on main, smoke on feature PRs]

## Preferences

- **Output language**: [e.g., English, French]
- **Tone**: [e.g., Concise, developer-friendly]
- **Terminology**:
  - "bug" not "defect"
  - "test scenario" not "test case"
  - "ticket" not "issue" or "story"
