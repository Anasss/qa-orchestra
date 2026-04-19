# scripts/evals/

Content-correctness checkers for QA Orchestra agents.

## What this is (and isn't)

**Is:** Pure-Node checkers that read an agent's output file and assert the *content* is correct against a known-answer fixture. One checker per agent.

**Is not:** A full CI eval that invokes the agent. Agents run inside Claude Code, which uses the runner's personal subscription — GitHub Actions cannot authenticate as a human subscription without adding API keys, and QA Orchestra does not require API keys beyond the one you already have with Claude Code.

## How the split works

| Piece | Where it runs | What it proves |
|---|---|---|
| The agent itself (e.g., `@functional-reviewer`) | Locally, in Claude Code | Correctness of this run |
| Content checker (`scripts/evals/<agent>.mjs`) | Locally and in CI | The *checker* correctly recognizes right vs. wrong output |
| Golden fixture (`tests/<agent>/expected-output.md`) | CI: fed to checker | The checker accepts a known-correct output |
| Negative fixture (`tests/<agent>/eval-fixtures/*.md`) | CI: fed to checker with `--expect-fail` | The checker rejects a known-wrong output |

CI never invokes the agent. The maintainer/contributor invokes the agent locally and runs the checker against the output.

## Manual eval flow (functional-reviewer)

```bash
# 1. Invoke the agent in Claude Code locally. At a prompt:
#    @functional-reviewer review tests/functional-reviewer/input-ac.md
#    against the diff in tests/functional-reviewer/input-diff.patch
#
# 2. The agent writes its report to qa-output/functional-review.md
#
# 3. Run the content checker:
node scripts/evals/functional-reviewer.mjs qa-output/functional-review.md
```

Expected: `✓ qa-output/functional-review.md (dark-mode (tests/functional-reviewer/))`.

If the checker fails, the agent missed one or both planted gaps (AC-3 or AC-5). That's a real regression.

## Rules the checker applies (functional-reviewer)

- `gaps[]` must include `AC-3` and `AC-5`. Missing either is a failure.
- Extra gap IDs (e.g., `AC-6`, `AC-99`) are logged as `warning: hallucinated gaps` but do NOT fail the check. Superset-pass rule.
- The machine block must be well-formed. Malformed block is a failure.

## Thresholds (for multi-run tracking)

Run the agent N=5 times against the same fixture:

- 4–5 passes → ship.
- 3 passes → warning; investigate before shipping agent-body changes.
- ≤2 passes → regression; block.

We don't currently automate the N=5 loop — run manually when touching agent bodies. A local driver script is a future addition.

## What to run before opening a PR that changes functional-reviewer.md

1. Invoke the agent locally against the fixture (flow above).
2. Run `node scripts/evals/functional-reviewer.mjs qa-output/functional-review.md`.
3. Confirm pass. If fail, fix and retry.

For extra confidence, repeat steps 1–2 five times. Pass rate 4/5 or 5/5 is what you want to see.

## CI scope

CI verifies the *checker*, not the agent:

```yaml
- node scripts/evals/functional-reviewer.mjs tests/functional-reviewer/expected-output.md
- node scripts/evals/functional-reviewer.mjs --expect-fail tests/functional-reviewer/eval-fixtures/missed-gaps.md
```

If a contributor accidentally weakens the checker (e.g., removes an expected gap), CI catches it.
