```json qa-orchestra
{
  "agent": "functional-reviewer",
  "version": 1,
  "verdict": "pass",
  "summary": "All 5 ACs have matching code. Ready to merge.",
  "inputs": [
    { "kind": "ac", "ref": "ticket #42 — Add dark mode toggle" },
    { "kind": "diff", "ref": "main...feature/dark-mode" }
  ],
  "risk_score": 2,
  "ac_compliance": [
    { "id": "AC-1", "status": "covered", "file_ref": "Header.tsx:10" },
    { "id": "AC-2", "status": "covered", "file_ref": "DarkModeToggle.tsx:7-11" },
    { "id": "AC-3", "status": "covered", "file_ref": "DarkModeToggle.tsx:12" },
    { "id": "AC-4", "status": "covered", "file_ref": "DarkModeToggle.tsx:16" },
    { "id": "AC-5", "status": "covered", "file_ref": "DarkModeToggle.tsx:4" }
  ],
  "gaps": [],
  "regression_risk": "low"
}
```

# Intentionally wrong fixture — content check only

This file is schema-VALID (envelope + extensions all well-formed) but content-WRONG. The machine block claims all 5 ACs are covered; in reality the dark-mode fixture has two planted gaps (AC-3 localStorage persistence and AC-5 prefers-color-scheme default).

This is the worst-case failure mode of `functional-reviewer`: claiming every AC is implemented when two aren't. The schema validator can't catch it — it's a correctness problem, not a shape problem. The content checker at `scripts/evals/functional-reviewer.mjs` catches it.

CI runs `node scripts/evals/functional-reviewer.mjs --expect-fail tests/functional-reviewer/eval-fixtures/missed-gaps.md` and fails if the checker accepts this fixture. Do not "fix" the `gaps: []` — the whole point is that it stays wrong.
