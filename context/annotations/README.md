# Annotations

Project-specific learnings that agents accumulate over time.

Each file covers one area (a service, a feature, a tool, an environment).
Agents add to these files when they discover something that isn't in `CONTEXT.md`.

## Files in this directory

| File | Covers |
|---|---|
| `services.md` | Backend service behaviors, known quirks, gotchas |
| `environments.md` | Environment-specific behaviors, flakiness, known differences |
| `test-patterns.md` | Patterns specific to this codebase's test suite |
| `domain.md` | Business logic nuances not captured in AC |

## Format for each annotation

```markdown
### [Date] — [Topic]
**Context**: [what task revealed this]
**Learning**: [what was learned]
**Impact**: [which agent or scenario this affects]
```

## Example

```markdown
### 2026-04-07 — Cart Service
**Context**: Functional review of PROJ-456 (discount calculation)
**Learning**: Discount is applied BEFORE tax. AC implied after-tax. Verified in cart-service.ts:142.
**Impact**: All checkout test scenarios involving discounts must verify pre-tax calculation.
```
