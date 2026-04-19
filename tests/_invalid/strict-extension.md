```json qa-orchestra
{
  "agent": "functional-reviewer",
  "version": 1,
  "verdict": "fail",
  "summary": "Strict-mode fixture: envelope is valid, but three extension fields violate schema/qa-output.schema.json.",
  "risk_score": 15,
  "ac_compliance": [
    { "id": "AC-1", "status": "coverage" }
  ],
  "regression_risk": "moderate"
}
```

# Intentionally invalid fixture — strict mode only

This file exists to prove `--strict` catches what the default (envelope-only) validator misses.

The envelope is valid: `agent`, `version`, `verdict`, `summary` all conform. Running `node scripts/validate-qa-output.mjs tests/_invalid/strict-extension.md` (without `--strict`) should PASS — this is deliberate.

The per-agent extension for `functional-reviewer` contains three violations, all defined in `schemas/qa-output.schema.json` under `$defs.agent_extensions.functional-reviewer`:

1. `risk_score: 15` — exceeds `maximum: 10`.
2. `ac_compliance[0].status: "coverage"` — not in `enum: ["covered", "partial", "missing", "ambiguous"]`.
3. `regression_risk: "moderate"` — not in `enum: ["low", "medium", "high"]`.

CI runs `node scripts/validate-qa-output.mjs --expect-fail --strict tests/_invalid/strict-extension.md` and fails if the validator accepts this fixture. Do not "fix" the block — the whole point is that it stays broken.

Directories under `tests/` whose names start with `_` are skipped by `--all` (see `findGoldenFixtures` in the validator), so this fixture is only exercised by explicit file-path invocations.
