# Quickstart: Learning Dashboard (003)

**Branch**: `003-learning-dashboard` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

Manual validation guide. No test runner is configured in the project; validation is `pnpm build` + `pnpm lint` plus the scenarios below (research §4; spec SC-010).

## Prerequisites

- `pnpm install` up to date; `pnpm dev` running.
- A fresh or seeded browser profile (localStorage `ai-mentor-auth` and `ai-mentor-onboarding-complete` drive both paths below).

## 1. Build & lint gates

```bash
pnpm lint
pnpm build
```

Both must pass before feature sign-off.

## 2. No-roadmap empty state

1. Ensure **no** `ai-mentor-onboarding-complete` record (fresh profile), then visit `/en/dashboard` (and `/ar/dashboard`).
2. Expect the existing onboarding empty state: welcome copy + "Start onboarding" primary CTA to `/onboarding`. No workspace sections render, no error, no broken shell.

## 3. Workspace (authenticated + onboarded)

Prepare state: register/sign in (localStorage `ai-mentor-auth`), complete onboarding (5 steps → generate → milestone titles stored in `onboarding.roadmap`, count ≥ 2).

1. Visit `/en/dashboard`.
2. **Shell**: learning sidebar (Overview active, Home link) + header (brand, mobile menu toggle, language, theme). Marketing Navbar and Footer must be **absent** (gated off `/dashboard`).
3. **Welcome**: greeting with the learner name and the learning goal.
4. **Continue Learning**: rendered as the primary section in the "no current lesson" state; primary CTA is present and leads to the roadmap overview inside the workspace (not a dead link, not an invented lesson).
5. **Progress**: shows the stage list with the first stage labeled current/in-progress and the total stage count. No completion percentage or velocity number is shown.
6. **Today's Focus** and **Recent Activity**: render their neutral empty/unavailable states — no fabricated tasks or events.
7. **Mentor Insight**: hidden or neutral placeholder — no fabricated recommendation text.

## 4. States & edge coverage

- **Loading/error**: not reachable today (synchronous adapter, research D8) — verify the `SectionState` contract compiles for all four states (skeleton/empty/unavailable/error+retry) via code review, not by faking failures.
- **Stage clamping**: roadmap with 1 milestone → current stage = that milestone; roadmap with many → list scrolls, no overflow.
- **No false data**: open DevTools → no console errors; localStorage keys unchanged after visiting the dashboard (feature is read-only).

## 5. i18n & RTL

- Switch locale to Arabic on `/dashboard`; repeat §3. Layout must mirror (sidebar on the reading start), logical properties respected, no horizontal misalignment. All new strings exist for both `en` and `ar`.

## 6. Responsive (both locales)

- **Desktop ≥1024**: sidebar + main column.
- **Tablet 768–1023**: compact sidebar/nav; content not overlapped.
- **Mobile <768**: header with drawer toggle (`aria-expanded`, Escape closes, focus trapped while open); primary "Continue Learning" action visible without a deep scroll.
- No horizontal overflow at 320/375/768/1024/1440.

## 7. Accessibility

- Keyboard: Tab reaches the primary CTA and nav in logical order; focus visible (existing focus-visible rings); skip-main-content behavior preserved.
- Screen-reader checks: sections use `h2` headings, complementary landmarks for sidebar; drawer announced as a menu region.
- Reduced motion: enable OS "reduce motion"; entrance animations must not animate (verified via `<MotionConfig reducedMotion="user">`, research D5) even though framer-motion drives them in JS.

## 8. Themes

- Verify the dashboard is fully readable in the **default dark theme** and the light theme; no token changes were made (DR-002) and both themes use existing `sys-color-*` tokens.

## Exit criteria

All §1 commands pass; §2–§8 scenarios pass in both locales; no new dependencies, routes, backend calls, or persisted state introduced (spec FR-010/OS-001).