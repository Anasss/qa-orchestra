# Ticket #42 — Add dark mode toggle

## Description

As a user, I want a dark mode toggle in the navigation header so that I can switch the app's color scheme without affecting other users.

## Acceptance Criteria

- **AC-1**: A toggle button is visible in the navigation header on every page
- **AC-2**: Clicking the toggle switches between light and dark mode immediately (no page reload)
- **AC-3**: The user's choice persists across browser sessions (localStorage)
- **AC-4**: The toggle button has `data-testid="dark-mode-toggle"` for test automation
- **AC-5**: The default mode matches the user's system preference (`prefers-color-scheme`) on first visit
