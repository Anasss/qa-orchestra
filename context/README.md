# Context — Setup & Usage

## What's in this folder

```
context/
├── CONTEXT.md           ← Fill this in. Every agent reads it.
└── annotations/         ← Learnings agents accumulate over time
    ├── services.md
    ├── environments.md
    ├── test-patterns.md
    └── domain.md
```

## Step 1 — Fill in CONTEXT.md

Open `context/CONTEXT.md` and fill in your project details.
See `examples/CONTEXT.example.md` for a completed reference.

This is the **only required setup step**. Everything else is optional.

## Step 2 — Agents maintain annotations automatically

Every agent is instructed to annotate learnings after completing its task.
Over time, `context/annotations/*.md` grows with project-specific knowledge.

When an annotation is stable and team-wide, commit it to the annotations file.
When it changes the stack, update `context/CONTEXT.md` directly.
