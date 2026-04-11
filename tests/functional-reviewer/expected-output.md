Ticket: #42 — Add dark mode toggle

# Functional Review Report

**Ticket**: #42
**Risk Score**: 6/10

## Files changed

- NEW `src/components/DarkModeToggle.tsx` (24 lines)
- MOD `src/components/Header.tsx` (+2 / -0)

## AC Compliance

| # | Acceptance Criterion | Status | Code location | Notes |
|---|---|---|---|---|
| AC-1 | Toggle visible in nav header on every page | COVERED | `Header.tsx:10` | `<DarkModeToggle />` rendered inside `<header>`; every page that renders `Header` gets it. |
| AC-2 | Clicking switches mode immediately, no reload | COVERED | `DarkModeToggle.tsx:7-11` | `onClick` toggles `isDark` state and applies `.dark` class on `document.documentElement`. No navigation. |
| AC-3 | Choice persists across browser sessions (localStorage) | **MISSING** | — | No `localStorage.setItem` / `localStorage.getItem` anywhere in the diff. The state lives only in React memory; closing the browser tab loses it. |
| AC-4 | `data-testid="dark-mode-toggle"` | COVERED | `DarkModeToggle.tsx:16` | Exact attribute present on the button. |
| AC-5 | Default matches `prefers-color-scheme` on first visit | **MISSING** | — | `useState(false)` hardcodes the initial value to light mode. No `window.matchMedia('(prefers-color-scheme: dark)')` check, no effect that sets initial state from the system preference. |

## Change Impact

**[warning]** `DarkModeToggle.tsx:8-11` — `toggle` mutates `document.documentElement.classList` directly from inside a React event handler.
- Risk: MEDIUM — DOM side effects outside React's render cycle. Works for the happy path, but if any parent component also controls the `.dark` class (e.g., a future theme provider), the two sources of truth will fight.

**[safe]** `Header.tsx:8-10` — adds the toggle as a sibling of `<Logo />` and `<Nav />`. Mechanical insertion, no regression risk.

## Regression Risk

**Level**: Low — the new component is self-contained and only touches `<header>` composition. No existing code paths are modified.

## Edge Cases Not Covered

- **SSR / hydration mismatch**: the `'use client'` directive is present, but `useState(false)` on first render will always be `false`. If the server renders with a different class (e.g. because AC-5 eventually gets implemented via a cookie or a headers-based hint), there will be a hydration flash. Combined with AC-5, this becomes a real problem that needs a coordinated fix.
- **Accessibility**: `aria-label` is present (good), but `aria-pressed` is not. A toggle button should expose its pressed state for screen readers.
- **Re-mount state drift**: if `DarkModeToggle` unmounts and remounts, the internal `isDark` state resets to `false` but the `document.documentElement.classList` may still have `.dark` applied — the two go out of sync until the next click.
- **No cleanup**: the component doesn't undo its `classList` mutation on unmount. Not usually visible because the toggle lives in the persistent header, but it's a lurking bug if the component is ever moved to a route-level subtree.

## Summary

**Verdict: GAPS — two of five ACs are missing.**

Two blockers before sign-off:

1. **AC-3 (persistence)** — add `localStorage.setItem('theme', next ? 'dark' : 'light')` in the toggle handler, and initialize state from `localStorage.getItem('theme')` on mount (via a `useEffect` to avoid hydration issues).
2. **AC-5 (system preference)** — on mount, check `window.matchMedia('(prefers-color-scheme: dark)').matches` and use it as the initial value **when no stored preference exists**. Do not let the system preference override a user who has explicitly chosen a mode.

AC-1, AC-2, and AC-4 are correctly implemented. The two missing ACs share the same fix surface (initialization logic), so both can be closed in a single follow-up change. Once closed, the component is ready for QA.
