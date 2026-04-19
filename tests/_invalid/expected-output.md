```json qa-orchestra
{
  "agent": "imaginary-agent",
  "version": 2,
  "verdict": "totally-green",
  "summary": "This summary is intentionally longer than the 280-character envelope limit so the validator length check is exercised in CI. Padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding."
}
```

# Intentionally invalid fixture

This file exists to prove that `scripts/validate-qa-output.mjs` rejects malformed envelopes. The `json qa-orchestra` block above violates four envelope rules simultaneously:

1. `agent` is not one of the ten known agents.
2. `version` is not `1`.
3. `verdict` is not in the allowed enum.
4. `summary` exceeds the 280-character limit.

CI runs `node scripts/validate-qa-output.mjs --expect-fail tests/_invalid/expected-output.md` and fails if the validator accepts this fixture. Do not "fix" the block — the whole point is that it stays broken.

Directories under `tests/` whose names start with `_` are skipped by `--all` (see `findGoldenFixtures` in the validator).
