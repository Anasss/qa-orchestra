# scripts/hooks/

How to wire QA Orchestra's deterministic validators into Claude Code as automatic gates.

## What's here

Nothing executable yet — just guidance. Hook integration is opt-in per workspace because the syntax of `.claude/settings.json` evolves and shipping a config that may not match your runtime is worse than no config.

## What a hook adds

The validators in `scripts/` already run in CI. Hooks let them run **at agent-output time, locally**, before the next agent in the pipeline can read a malformed or incoherent report. The two checks worth gating:

| Check | Command | Catches |
|---|---|---|
| Schema | `node scripts/validate-qa-output.mjs --strict <file>` | malformed envelope, wrong type/enum on extension fields |
| Coherence | `node scripts/validate-qa-output.mjs --coherence <file>` | JSON-vs-prose verdict drift, unknown agents in next_actions, gap AC ids not mentioned in prose |

You can run both at once: `--strict --coherence`.

## Recommended hook (postToolUse on Write/Edit)

Goal: any time an agent writes or edits a file under `qa-output/`, run both checks immediately. If either fails, surface the error so Claude fixes the output before the next step.

Sketch (verify against your Claude Code version's hook schema before committing to `.claude/settings.json`):

```jsonc
{
  "hooks": {
    "postToolUse": [
      {
        "matcher": { "tool": "Write|Edit", "paths": ["qa-output/**/*.md"] },
        "command": "node scripts/validate-qa-output.mjs --strict --coherence \"$CLAUDE_FILE\""
      }
    ]
  }
}
```

Variable name (`$CLAUDE_FILE`), schema shape, and matcher syntax differ between Claude Code releases. Check `claude --help` or your IDE extension's hook docs and adjust before pasting.

## Why not ship this in the repo?

1. The exact hook schema is not yet stable across Claude Code distributions.
2. A misconfigured hook silently no-ops or, worse, blocks every Write call. That's worse than no hook.
3. Different teams want different gating policies (warn vs block, run on save vs on agent-write only).

CI already enforces these checks on golden fixtures. Local hooks are an upgrade for the maintainer's workflow, not a release-blocking requirement.

## Manual fallback

If you don't want to wire a hook, just run the validators by hand after invoking an agent:

```bash
# After @functional-reviewer writes its output:
node scripts/validate-qa-output.mjs --strict --coherence qa-output/functional-review.md
```

Same enforcement, less automation.
