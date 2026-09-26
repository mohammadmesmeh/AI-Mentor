# Quickstart: Validating the Roadmap-Driven Dashboard

## Prerequisites

- The backend API is running at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000/api/v1`, see `API_CONTRACT.md` §1).
- **Gate G-1 is closed.** `API_CONTRACT.md` documents the latest-generation-request retrieval (see [contracts/api-dependencies.md](contracts/api-dependencies.md)). Without it, only the in-session scenarios (B–E) can be validated.
- You have a test account with completed onboarding.

## Automated checks

```bash
pnpm tsc --noEmit
pnpm lint
pnpm test                                    # includes tests/unit/dashboard/* and tests/component/roadmap/*
pnpm vitest run tests/unit/dashboard         # derivations, view resolver, safe URLs only
pnpm build
```

**Expected:** all pass. The unit tests cover every edge case in [data-model.md](data-model.md).

## Manual scenarios

Run each scenario in `/en/dashboard` **and** `/ar/dashboard`.

### A. Returning learner (Story 1; needs G-1)

1. Generate a roadmap, and wait until the dashboard shows it.
2. Reload the page. **Expected:** the same roadmap and sections. No "Generate" screen, and no `POST /roadmap-generation-requests` in the network panel.
3. Sign out and sign back in. **Expected:** the same result as step 2.
4. Start a generation, then reload while it is still in progress. **Expected:** the in-progress screen for that same request, and no second POST.
5. Stop the backend and reload. **Expected:** the "couldn't load your dashboard" state with a Retry button. It must **never** be the Generate screen.

### B. Continue Learning (Story 2)

**Expected:**
- The dashboard shows the task the roadmap marks `current`, with its type, localized minutes and stage name.
- "Go to task" scrolls to it, highlights it and moves focus to that row.

### C. Progress (Story 3)

**Expected:**
- "Stage X of Y" and "N of M tasks" match a manual count of the roadmap response. `replaced` tasks are excluded from M.
- There are no streak, accuracy or time figures.

### D. Today's Focus (Story 4)

**Expected:** at most 3 rows, the current task first, in roadmap order. Each row jumps to its task.

### E. Workspace and resources (Story 6)

**Expected:**
- **Page:** the order is greeting, Continue Learning, grid, full roadmap. There is exactly one `h1`, and stage titles are listed once.
- **Resources:** each opens in a new tab. A resource with a non-http(s) URL (use an MSW fixture) is shown as text with "link unavailable".
- **Complete and Skip:** disabled, with "Available soon" text. Clicking them does nothing and sends no request.

### F. Layout, RTL and accessibility

- **Widths:** at 320, 768 and 1280px, in both locales, there is no horizontal scroll. Long Arabic task titles wrap cleanly.
- **Keyboard:** Tab reaches every action with a visible focus ring. The progress bar announces its value.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the jump to a task happens without a smooth-scroll animation.
