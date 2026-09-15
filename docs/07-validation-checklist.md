# AI Mentor — Validation Checklist

## Status

| Area | Status |
| --- | --- |
| Frontend lint (`pnpm lint`) | **PASS** — run on the final Dashboard implementation; 0 errors (2 pre-existing warnings in untouched files) |
| Frontend build/typecheck (`pnpm build`) | **PASS** — all routes compile/static-generate, including `/[locale]/dashboard` |
| Manual dashboard quickstart scenarios | **NOT RUN** — task `T031` in `specs/003-learning-dashboard/tasks.md` remains unchecked; no browser available in the implementing environment |
| Backend quality gates (composer validate/audit, artisan test, Pint, PHPStan, route:list) | **NOT RUN in this session** — backend was not modified here; commands documented in `Backend/README.md` |
| Unit / integration / E2E test suite | **NOT CONFIGURED** — the project declares no test runner; validation is build + lint + manual scenarios |

## Sources

- `specs/003-learning-dashboard/{quickstart.md,tasks.md}`, `specs/002-auth-page-redesign/quickstart.md`
- `package.json` (scripts: `dev`, `build`, `start`, `lint`)
- `Backend/README.md` (Quality gates section)
- This docs layer (docs/03, docs/04, docs/05)

## How validation currently works

There is no automated test runner configured. The established validation path is:

1. `pnpm build` (typecheck + production build) and `pnpm lint` — must both pass.
2. Manual browser scenario checks from the feature `quickstart.md` documents.
3. Backend: the composer/artisan gates in `Backend/README.md` (**not configured as part of the frontend workflow**).

## Frontend commands

```bash
pnpm install          # dependency install
pnpm dev              # next dev --turbo
pnpm lint             # eslint
pnpm build            # typecheck + production build
pnpm start            # serve the production build
```

## Dashboard (003) — manual quickstart scenarios

Reproduce full detail in `specs/003-learning-dashboard/quickstart.md`. Preparation: `pnpm dev` running; fresh browser profile drives both paths via `localStorage` (`ai-mentor-auth`, `ai-mentor-onboarding-complete`).

| # | Scenario | Auto | Manual |
| --- | --- | --- | --- |
| 1 | Build & lint gates pass | PASS | — |
| 2 | No-roadmap empty state on `/en/dashboard` and `/ar/dashboard`; CTA → `/onboarding` | — | **NOT RUN** |
| 3 | Workspace state: shell (sidebar, header, menu toggle, no marketing Navbar/Footer), Welcome (name + goal), Continue Learning hero ("no current lesson" + working CTA), Progress stage list + current stage (no percentages), Today's Focus / Recent Activity empty states, Mentor Insight neutral state | — | **NOT RUN** |
| 4 | States/edges: no console errors; localStorage unchanged (read-only); no overflow for 1 vs many milestones | — | **NOT RUN** |
| 5 | i18n & RTL: Arabic mirror (sidebar on reading start, logical properties, all strings present in both locales) | — | **NOT RUN** |
| 6 | Responsive 375/768/1024/1440 (both locales): no horizontal overflow, drawer behavior + `aria-expanded`/Escape, primary CTA reachable | — | **NOT RUN** |
| 7 | Accessibility: keyboard order, visible focus, headings (`h2` sections), complementary landmarks, reduced motion | — | **NOT RUN** |
| 8 | Themes: fully readable in default dark + light | — | **NOT RUN** |

This is exactly the coverage locked to `T031`, which remains **unchecked**. The implementation satisfies scenarios 1 (lint/build) and, by inspection/code review, the structural expectations of 2–8; a human/QA browser pass is required before feature sign-off.

## Other features — quick checks (from their quickstarts)

- **Auth (002)**: sign-in, create-account, recovery, Google unavailable states; redirect rules (auth → onboarding if not complete, → dashboard if complete); show/hide password; form validation messages; light-theme auth surface renders. **Manual: NOT RUN in this session** (implemented + lint/build pass).
- **Onboarding (`specs/005-onboarding-ux-redesign`, six-step single-confirmation flow)**: all six steps, forward/back, per-step validation, the single final Review/Confirmation step where submission fires, honest `not-connected` failure state with retry (never a fabricated success — see docs/03 "Known inconsistencies" for the resulting Dashboard implication). **Manual: NOT RUN in this session**.
- **Home (001)**: hero + features + how-it-works + CTA render in both locales; nav anchors work; footer links. **Manual: NOT RUN in this session**.

## Backend gates (documented, not part of frontend workflow)

```bash
docker compose exec app composer validate --strict
docker compose exec app composer audit
docker compose exec app php artisan migrate:status
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse
docker compose exec app php artisan route:list --path=api/v1
```

## When the backend is integrated (future)

Add automated integration coverage for the contract in docs/05 before wiring the frontend:

- Health + auth (register/login/refresh/logout + 401 refresh-then-sign-out path).
- Onboarding (preferences partial PATCH, learning-profile idempotent PUT, derived onboarding-status).
- Generation (idempotency replay 202/200, `409` in-progress and incomplete, polling until terminal, owner-scoped 404s).
- Roadmap retrieval (ownership 404s, `current_version` null, position ordering, empty `resources` legacy).
- Token rules (no refresh token in localStorage, single serialized refresh, no tokens in logs/URLs).
- AI-rule coverage when AI generation lands: validation pipeline rejects malformed/semantically invalid output; no fabricated roadmap on failure.

## Honest-sign-off checklist

Check everything below and record PASS / FAIL / NOT RUN / BLOCKED per item:

- [ ] `pnpm lint` PASS (last run: PASS)
- [ ] `pnpm build` PASS (last run: PASS)
- [ ] Dashboard quickstart §2–§8 manual pass in both locales (currently **NOT RUN** — T031)
- [ ] No new dependencies, routes, backend calls, or persisted-state changes from the dashboard (verifiable by git diff: dashboard adds components + messages keys + gating only)
- [ ] No secrets/credentials introduced in the diff
- [ ] No fabricated data paths (dashboard sections degrade honestly)
- [ ] RTL + LTR verified on changed layouts
- [ ] Backend gates pass if backend was touched

Do not claim "all checks pass" while T031 (or any listed manual item) is still NOT RUN.