```json qa-orchestra
{
  "agent": "functional-reviewer",
  "version": 1,
  "verdict": "pass",
  "summary": "All 5 ACs have matching code. Good to merge.",
  "risk_score": 2,
  "ac_compliance": [
    { "id": "AC-1", "status": "covered" },
    { "id": "AC-2", "status": "covered" }
  ],
  "gaps": [
    { "ac": "AC-MISSING-FROM-PROSE", "desc": "Never mentioned in the prose below — drift." }
  ],
  "regression_risk": "low",
  "next_actions": [
    "fake-reviewer: do something",
    "developer: merge this"
  ]
}
```

# Intentionally incoherent fixture — envelope-valid, content-contradicts

This file is schema-VALID (envelope + all extensions well-formed) but its prose and its machine block contradict each other in three ways that `--coherence` catches:

1. **Verdict drift.** The JSON block declares `verdict: "pass"`, yet this prose explicitly says **Request changes** — the two disagree.
2. **Unknown agent in next_actions.** The block names `fake-reviewer:` which is not one of the 10 known agents.
3. **Gap AC missing from prose.** The block lists a gap against an AC identifier that is deliberately never mentioned anywhere in the human-readable report below — the checker is expected to catch the drift. (The exact AC id is in the machine block above; referencing it here would defeat the test.)

All three are real classes of prose-vs-JSON drift that schema validation cannot catch. The coherence checker does.

## Summary

Verdict: **Request changes.** Keeping this in the prose deliberately to contradict the JSON above. Do not "fix" it — this fixture exists to prove the coherence checker rejects drift.

CI runs `node scripts/validate-qa-output.mjs --expect-fail --coherence tests/_invalid/coherence-drift.md` and fails if the checker accepts this fixture.
