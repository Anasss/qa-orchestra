# Project Context — E-Commerce Store (Example)

> This is a completed example of `context/CONTEXT.md` for a Medusa-based e-commerce app.
> Copy this to `context/CONTEXT.md` and adapt it to your own project.
> Last updated: 2026-04-07

---

## Application Under Test

- **Name**: My Store
- **Type**: E-commerce store
- **Frontend**: Next.js 15 / React 19 / TypeScript (Medusa Storefront)
- **Backend**: Node.js / Medusa v2 / TypeScript
- **Database**: PostgreSQL (Docker container: `my-postgres`)
- **API layer**: REST — base URL: `http://localhost:9000/store`
- **Admin API**: REST — base URL: `http://localhost:9000/admin`
- **Frontend URL (local)**: `http://localhost:8000`
- **Admin URL**: `http://localhost:9000/app`
- **Admin credentials**: `admin@example.com` / `supersecret`

## Repositories

| Repo | URL | Local path | Purpose |
|---|---|---|---|
| my-backend | github.com/org/my-backend | `my-backend/` | Medusa API + custom modules |
| my-storefront | github.com/org/my-storefront | `my-storefront/` | Next.js storefront |
| qa-automation | github.com/org/qa-automation | `qa-automation/` | Playwright test suite |

## Environment Setup

- **Start database**: `docker start my-postgres`
- **Install backend deps**: `cd my-backend && npm install`
- **Run migrations**: `cd my-backend && npx medusa db:migrate`
- **Seed data**: `cd my-backend && npm run seed`
- **Create admin user**: `cd my-backend && npx medusa user -e admin@example.com -p supersecret`
- **Start backend**: `cd my-backend && npm run dev`
- **Start frontend**: `cd my-storefront && npm run dev`
- **Health check URL**: `http://localhost:9000/health`

## Custom Features

| Feature | Endpoint | Module |
|---|---|---|
| Newsletter | `POST /store/newsletter/subscribe` | `newsletter` |
| Promotions | `GET /store/promotions/active` | `storePromotion` |

## Products & Categories

- **12 products** across **8 categories**
- **Price range**: EUR 42 - EUR 120
- **Regions**: Europe (EUR), North America (USD)

## Automation Framework

- **Language**: TypeScript
- **Framework**: Playwright
- **Test runner**: @playwright/test
- **BDD format**: plain describe/it (no Gherkin)
- **Test file naming**: `*.spec.ts`
- **Test directory**: `qa-automation/e2e/`
- **Run command**: `npx playwright test`
- **Tags used**: `@smoke`, `@regression`, `@must-test`

## Project Management

- **Ticket system**: GitHub Issues
- **AC format**: Bullet points with expected behavior
- **Bug severity definitions**: Critical / Major / Minor / Trivial
- **Bug report format**: GitHub Issue with Steps to Reproduce, Expected, Actual, Severity
- **Branch naming**: `feature/ISSUE-N-description`

## CI/CD

- **Pipeline**: GitHub Actions
- **Test execution in CI**: `npx playwright test --project=chromium`
- **Environments**:
  - Local: `http://localhost:8000` (FE) / `http://localhost:9000` (BE)
  - Staging: N/A
  - Production: N/A

## Quality Standards

- **Definition of Done**:
  - All Must Test scenarios pass
  - No Critical or Major bugs open
  - Functional review shows no AC gaps
  - Browser validation confirms UI behavior
- **Regression scope**: Full suite on main branch, smoke only on feature PRs

## Preferences

- **Output language**: English
- **Tone**: Concise, developer-friendly
- **Terminology**:
  - "bug" not "defect"
  - "test scenario" not "test case"
  - "ticket" not "issue" or "story"
