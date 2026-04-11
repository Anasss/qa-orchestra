# Reference Tests

This directory contains reference inputs and expected outputs for individual QA Orchestra agents. It is **not** a test suite that runs automatically — LLM outputs are non-deterministic and unit-testing them by string match is a trap that produces brittle red herrings.

Instead, this is a baseline **for humans**. If you edit an agent file and want to know whether your change broke something fundamental, run the agent against the reference input here and compare the output by eye. If the *shape* of the answer has changed in a way you didn't intend (missing sections, missing AC verdicts, different structure), your edit probably has a regression.

## Contents

- [`functional-reviewer/`](functional-reviewer/) — sample diff + acceptance criteria → expected functional review
- [`test-scenario-designer/`](test-scenario-designer/) — sample acceptance criteria → expected test scenarios

## How to use

1. Open one of the subdirectories above.
2. Read the `input-*.md` file(s) — that's what you feed the agent.
3. Run the corresponding agent against that input, either via `@agent-name` in any Claude Code chat or via the `Agent` tool with `subagent_type`.
4. Compare the agent's output to `expected-output.md`.
5. **Differences are not necessarily wrong.** LLMs have legitimate run-to-run variation. Look for whether the *shape* matches — are the required sections present, does every AC get a verdict, is the evidence cited with file paths, does the verdict follow from the evidence — rather than word-for-word identity.

If an agent edit changes the shape of the answer in a way that matters, you either introduced a regression or you intentionally changed the agent's behavior. Either way, update `expected-output.md` in the same commit.

## Adding new reference examples

When adding a reference example for a new agent or a new scenario:

1. **Keep examples small.** A 10-line diff is enough to exercise `functional-reviewer`. A 5-AC ticket is enough to exercise `test-scenario-designer`. The goal is a teaching fixture, not a production benchmark.
2. **Prefer stack-agnostic examples.** Use generic names like `App`, `UserForm`, `ToggleButton` rather than framework-specific magic so the fixture works for any reader of the repo.
3. **The expected output is not a target to match byte-for-byte.** Think of it as "what a good response looks like for this input" — a calibration anchor, not a ground truth.
4. **One directory per agent.** `tests/<agent-name>/input-*.md` and `tests/<agent-name>/expected-output.md`. Add a short `tests/<agent-name>/README.md` only if the example needs extra context to understand.
