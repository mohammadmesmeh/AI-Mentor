# Implementation Plan: Learning Dashboard

**Branch**: `003-learning-dashboard` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-learning-dashboard/spec.md`

## Summary

The Learning Dashboard is the primary authenticated learning workspace of AI Mentor. It must answer within seconds — "What should I do next?", "Why should I do it?", "How am I progressing?" — via an authenticated workspace (sidebar + header + main), a Welcome/context section, a dominant **Continue Learning** primary action, a small **Today's Focus** set, a concise **AI Mentor Insight**, task-based **Progress**, and secondary **Recent Activity**, with a learning-workspace feel (not an analytics dashboard) and **no fabricated data**. The attached HTML mockup is adopted as the Dashboard's **visual source of truth** (see **Visual Reference**); the design decisions below preserve all existing architecture and data decisions.

**Technical approach:** A small frontend vertical slice that follows existing feature conventions. The product is currently frontend-only: learner state lives in redux + localStorage (`authSlice.user`, `onboarding.roadmap` = milestone title keys). The dashboard reads this state **directly from redux in the existing client composition root** (`DashboardPage` — the established onboarding/auth pattern of direct slice access) and derives only what is authoritative: learner name, learning goal, roadmap stage titles/order, and a structural current stage. Everything the current product does not model — current lesson, focus tasks, AI insight, recent activity, completion metrics — is rendered as an explicit `unavailable`/empty state; nothing is invented.

The workspace gets a lightweight shell via a Dashboard segment layout (Server Component) that composes the nav (one client nav component) and swap-in `main`; the marketing `Navbar`/`Footer` are hidden on `/dashboard` using the exact pathname-gating convention `Footer` already uses for `/auth`. No new dependencies, no new routes, no new state, no service layer, no motion architecture, no backend contracts.

## Visual Reference

The attached HTML mockup is the **visual source of truth** for the Dashboard's intended look, composition, and hierarchy. It is a design reference only — the project architecture, specification, and plan define how that outcome is implemented.

> **Implementation note:** The HTML reference defines the intended visual outcome, while the existing project architecture, specification, and plan define how that outcome must be implemented.

### Authoritative visual characteristics (recreate with existing architecture)
- **App shell**: fixed-width sidebar rail (~256px, `w-64`) with grouped icon+label navigation and an active item marked by a soft light track plus an inset **start-edge accent bar**; a slim brand header across the top of the rail; a locale + learner footer card at the rail's bottom. A header strip (~`h-16`) with a translucent backdrop blur spans the content region. Main content sits in a centered, reasonably wide bucket (`max-w-6xl` class intent) with generous gutters (`px-6`/`py-8` style rhythm).
- **Main composition**: greeting header (eyebrow + large heading + supporting line) → full-width **Continue Learning hero card** → a two-column grid (~60/40) that stacks to a single column on small screens. Primary column: **Today's Focus**, then **AI Mentor Insight**. Secondary column: **Progress (Velocity)**, then **Recent Activity**.
- **Section furniture**: rounded cards (`rounded-xl`), soft one-tone layered surfaces, hairline dividers between card header and body and between list rows, icon-in-tile section headers, small pill badges for status (track / task-type / pace), restrained micro progress bars, soft default shadows that deepen gently on hover/state.
- **Typography hierarchy**: a display/headline scale for the greeting and section titles, a compact title/label scale for card and row headers, and small muted body type for supporting text. The mock's Nunito Sans + Space Grotesk pairing maps to the project's existing display/heading vs. body/label type tokens — no new fonts, no new imports.
- **Color tone**: calm, airy, light Material-3-like surface blues layered from lowest to highest with a near-navy primary and semantic success/amber/attention accents. Maps to the project's existing navy primary + `--color-light-blue-*` surface accents, rendered in **both** themes (the project is dark-default; the light-first mock expresses intent, not a theme mandate). No new tokens.
- **Density/whitespace**: readable information density with comfortable section spacing (`space-y-6`/`gap-6` rhythm) and restrained visual noise — the Dashboard looks calm and focused, not like an analytics console.

### What must NOT be copied from the HTML
- CDN/Google-Fonts/Material-Symbols loads, the inline `tailwind.config` script, and the CDN Tailwind runtime.
- Inline `onclick` JS, the View-Mode prototype switcher (Active/New Learner), the diagnostics/calibration modal, and `alert()` flows.
- Hardcoded demo data: track/lesson metadata, "Lesson 8 of 12", durations, "3 tasks queued", task rows, recommendations, "14 Day Streak", notification dot, telemetry chips, every percentage (67/68/88/61/94), weekly chart bar heights, "3.5 hrs logged", "200/240 target mins", activity log rows, "Computed 2h ago".
- LTR-only positioning: fixed `left-*`/`pl-*`/`pr-*` offsets, `inset_3px_0_0_0` start-edge bars, and `text-left` alignment — all converted to logical properties for RTL.
- Prototype-only surfaces: the header search box, streak pill, notification bell, "Adaptive v2.4" subtitle, "Pro Learner" role, avatar overflow menu, and any shadow/color values that duplicate (rather than use) existing project tokens.

### How the reference maps to the existing architecture

| HTML element | Current plan mapping |
|--------------|----------------------|
| Sidebar rail with groups + active inset accent | `DashboardWorkspaceNav` (client): links to existing destinations only, grouped, active highlight via `usePathname`, logical-direction inset accent; reuses `Logo`/`LanguageSwitcher`/`ThemeToggle` |
| Brand header + content offset from rail | `DashboardShell` (server): sidebar region + header + main regions; `start`-side offsets via logical properties |
| Greeting header (eyebrow + heading + line) | `WelcomeSection` (presentational): eyebrow, heading, goal line; no Recalibrate/Curriculum prototype actions |
| Continue Learning hero + action area | `ContinueLearningSection`: hero-card furniture kept; honest no-lesson content + real roadmap-anchor CTA |
| Today's Focus card with task rows | `TodayFocusSection`: card furniture kept; honest empty/unavailable rows, never fabricated tasks |
| Insight card with accent bar + callout | `MentorInsightSection`: accent-bar card furniture kept; respectful unavailable copy, no prescriptions/telemetry |
| Velocity & Mastery card (metric tiles + chart) | `ProgressSection`: card + title row + status-pill furniture kept; structural roadmap/stage indicators only; metric tiles/charts rendered only as honest unavailable tiles |
| Recent Activity card | `RecentActivitySection`: card furniture kept; neutral empty state, no invented event rows |
| Sidebar locale + learner footer | Reused `LanguageSwitcher`; learner `name` from `auth` when available |

### Honest data representation
Wherever the HTML shows richer data than the current frontend can authoritatively provide (lessons, tasks, recommendations, metrics, activity, telemetry, streaks, notifications), the **visual structure/state is reproduced without the data**: sections render their defined `unavailable`/empty states inside the HTML's card furniture. No percentage, bar, chart, number, or row text is invented (spec FR-005/006/007; see "Which data will be represented as unavailable").

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.4, Next.js 16.2.10 (Turbopack)

**Primary Dependencies (all existing)**: next-intl 4.13.2 (`useT`, `setRequestLocale`, `Link`/`usePathname` from `@/i18n/navigation`), @reduxjs/toolkit 2.12 + react-redux 9.3 (`useSelector`/`RootState`), lucide-react (icons), tailwindcss 4 (design tokens, `dark`/`light` variants, existing `progress-track`/`progress-fill` utilities), shadcn/ui `Card` (`@/components/ui/card`), shared `Button`/`Container`/`Logo`/`LanguageSwitcher`/`ThemeToggle`. framer-motion remains a dependency but is **not used by new dashboard code** (see Motion). **No new dependencies.**

**Storage**: Client-only in this phase — redux (`auth`, `onboarding`, `app` slices) with `localStorage` backing keys `ai-mentor-auth` and `ai-mentor-onboarding-complete`. No Database/backend in this feature; `onboarding.roadmap` is `string[] | null` of milestone title keys (localized via the existing `dashboard.milestones.*` namespace).

**Testing**: No test runner is configured in the project (`package.json` has no vitest/jest/playwright). Validation = `pnpm build` (typecheck+build) + `pnpm lint` + the manual runnable scenarios in `quickstart.md`. No test framework is added (no new deps).

**Target Platform**: Web — Next.js App Router; desktop (≥1024px), tablet (768–1023px), mobile (<768px); `en` (LTR) and `ar` (RTL); both the default dark theme and light theme must remain readable (no theme changes).

**Project Type**: Web application (frontend). The Laravel/REST backend is a later, separate phase — out of scope (spec OS-001).

**Performance Goals**: Primary "Continue Learning" action visible without a deep scroll on mobile; no horizontal overflow at 320/375/768/1024/1440 in both directions; **minimum necessary client JS** — exactly one client data component (`DashboardPage`) and one client nav component; no polling, no duplicate requests.

**Constraints**: No new dependencies; no global token/theme changes; no invented routes, API endpoints, backend contracts, Redux state shape, or data (spec FR-010); data is never fabricated to fill states (SR-001..004, FR-005/006/007); reuse existing patterns only where genuinely appropriate (onboarding direct-slice access; `Footer`'/`auth` pathname gating); Server Components for all static chrome; the workspace stays a learning workspace, not an analytics dashboard (spec §Section Definitions priority); `DashboardPage` remains the single client composition boundary (existing). UI is never a security boundary.

**Scale/Scope**: One route (`/dashboard` × locale); shell + 6 sections; modify the existing `DashboardPage` composition root; extend the `dashboard` i18n namespace in both files; two small shared-layout edits (pathname gating). No new state slice, no new entities, no service/contract files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **G1 Security, Privacy, Data Ownership** — PASS: renders only the authenticated learner's own derived data; no new outbound requests; no secrets; UI is never an authorization boundary.
- **G2 Separation of Responsibilities / Boundaries** — PASS: presentation separated from data reading (sections are presentational, fed by `DashboardPage`); no new layers introduced; follows the established onboarding direct-access pattern.
- **G3 Data Integrity / Authoritative State** — PASS: only persisted/derived state rendered; unavailable replaces fabrication; roadmap never regenerated per request.
- **G4 Responsible & Controlled AI** — PASS: no AI surface is implemented or faked; any future insight source must pass validation before display.
- **G5 Appropriate Abstraction / Provider Replaceability** — PASS: no abstraction added; the client-only data path is replaced wholesale when the backend lands (single composition component), so no indirection is required now.
- **G6 Reliability / Failure Handling** — PASS: unavailable/empty states are first-class; error/retry surfaces are unnecessary in this phase (synchronous, non-throwing reads) and are not fabricated.
- **G7 Safe State Changes / Concurrency / Idempotency** — PASS: read/display only; no state-changing operations introduced.
- **G8 Internationalization / Responsiveness / Inclusive UX** — PASS: en/ar + RTL via logical properties; 3-tier responsive; a11y requirements (AR-001..007) included; reduced motion satisfied by avoiding unnecessary motion (existing global `motion-reduce` CSS rule governs the CSS transitions that remain).
- **G9 Maintainability / Observability / Auditability** — PASS: small focused files; reuses existing components (`Button`, `Container`, `Card`, `Logo`, `LanguageSwitcher`, `ThemeToggle`); no learner-data logging.
- **G10 Explicit Scope / Controlled Product Changes** — PASS: least modification; spec OS-001..005 respected; no invented backend, routes, or gamification.

**Result**: No constitution violations. `Complexity Tracking` = N/A.

## Project Structure

### Documentation (this feature)

```text
specs/003-learning-dashboard/
├── plan.md              # This file (authoritative for /speckit.tasks — see Plan Review Decisions)
├── spec.md              # Product specification
└── ...                  # Earlier research/data-model/contract artifacts are SUPERSEDED (see Plan Review Decisions; not implemented)
```

> Note: `research.md`, `data-model.md`, and `contracts/learning-workspace-service.md` created earlier in this feature describe the heavier service/contract abstraction. This revision retracts that abstraction; only this `plan.md` governs implementation. No new contract/API/backend documents are produced. The attached HTML mockup (provided with the feature input) is the visual reference and is **not** committed as code or assets — see **Visual Reference**.

### Source Code (repository root)

```text
src/app/[locale]/(main)/
├── layout.tsx                                # existing — UNCHANGED (ShellBackground/Navbar/main/Footer envelope)
├── dashboard/
│   ├── page.tsx                              # existing server page — UNCHANGED (setRequestLocale + <DashboardPage/>)
│   ├── loading.tsx                           # NEW server: route-level skeleton (spinner/shimmer via existing utilities); no client JS
│   └── layout.tsx                            # NEW server: <DashboardShell>{children}</DashboardShell> (requestLocale-aware)

src/features/dashboard/
├── components/
│   ├── app-shell/
│   │   ├── DashboardShell.tsx                # NEW SERVER: presentational shell grid — sidebar region + header + main. No hooks/browser APIs.
│   │   └── DashboardWorkspaceNav.tsx         # NEW CLIENT: workspace nav (grouped icon+label links to EXISTING destinations only; active item gets a logical start-edge accent, per visual reference) + mobile header w/ drawer toggle. REQ: current-route highlight (usePathname) + drawer interactivity. Reuses Logo, LanguageSwitcher, ThemeToggle, Button.
│   ├── sections/                             # NEW CLIENT presentational sections — no state, no browser APIs; theme/route-free
│   │   ├── WelcomeSection.tsx                # props: learnerName, learningGoal
│   │   ├── ContinueLearningSection.tsx       # props: status ("unavailable" today) — primary CTA row, no-lesson state
│   │   ├── TodayFocusSection.tsx             # props: status ("unavailable") — empty state, NO fabricated tasks
│   │   ├── MentorInsightSection.tsx          # props: status ("unavailable") — respectful unavailable copy, NO fake AI
│   │   ├── ProgressSection.tsx               # props: stageTitles, stageCount, currentStageIndex, learningGoal — structural progress (roadmap list) only
│   │   └── RecentActivitySection.tsx         # props: status ("unavailable") — secondary, neutral empty state
│   ├── states/
│   │   └── SectionState.tsx                  # NEW CLIENT presentational: shared empty/unavailable state renderer (copy + optional icon). Single reuse point.
│   └── pages/dashboard-page.tsx              # EXISTING client composition root — MODIFIED: reads state via useSelector (established pattern), derives available data, renders sections w/ props + existing inline empty state
│
├── constants.ts                              # NOT ADDED (no value in this phase)

src/shared/components/layout/
├── navbar/Navbar.tsx                         # MODIFIED: early-return null when pathname startsWith "/dashboard" (mirrors Footer gating)
└── Footer.tsx                                # MODIFIED: extend existing "/auth" null-gate to also cover "/dashboard"

messages/en.json                              # MODIFIED: extend "dashboard" namespace (shell, sections, unavailable/empty copy)
messages/ar.json                              # MODIFIED: mirrored extensions (RTL-safe copy)
```

### Not added (deliberately removed in revision)

- `services/learningWorkspaceService.ts`, `types/learning-workspace.types.ts`, `selectors/dashboardSelectors.ts` — full service/contract boundary was over-abstraction (see Plan Review Decisions).
- `DashboardSidebar.tsx` / `DashboardHeader.tsx` split — merged into one client `DashboardWorkspaceNav`.
- Motion architecture — no `MotionConfig`, `useReducedMotion`, `FadeInView`, or per-card entrance animations.

## Key Implementation Decisions

### Client components — minimum necessary
Client JS is confined to two areas, each genuinely requiring it:
1. **`DashboardPage`** (existing, client) — the single composition root consuming client-held state (redux/localStorage) via the established direct-`useSelector` pattern (same as the onboarding feature). It owns the roadmap-branch logic (empty state vs workspace) and passes plain data props to sections.
2. **`DashboardWorkspaceNav`** (new, client) — requires `usePathname` (current-route highlighting) and interactive drawer behavior (open/close, `aria-expanded`, Escape, focus handling) on mobile.

**Sections are presentational client modules**: they receive all data via props and use only the existing `useT` i18n hook (the project convention). They are client-bound because React forbids Server Components as children of a client composition root — since the roadmap/empty branch and all data are client-resolved inside `DashboardPage`, the sections cannot be lifted to the server page. No section uses redux, localStorage, browser APIs, or interactive behavior; the client cost is the module bundle, not logic.

**Server-rendered chrome**: `dashboard/layout.tsx`, `loading.tsx`, and `DashboardShell.tsx` are Server Components (no hooks, no browser APIs), composed beside the client nav/data islands.

### Data flow — smallest reasonable boundary, no service layer
- Reads happen **directly in `DashboardPage`** with `useSelector` (`state.onboarding`, `state.auth`), mirroring how the onboarding feature interacts with its slice today. Derived values (stage count, current stage index) are computed inline in the component.
- **No `LearningWorkspaceService`, no contract, no types/selectors file.** Reason: the dashboard is read-only over existing client state — there are no future-backend operations to bound today. The auth feature's `authService.ts` exists only because it has genuinely future-backend operations (`signInWithGoogle`, `requestPasswordReset` returning `not-connected`); the dashboard has none. When a real backend arrives, the single `DashboardPage` data reads are replaced wholesale behind the same component — no client-facing abstraction is needed in advance, and the spec's OS-001 defers backend contracts.

### Motion — minimal
- No animation is required to satisfy the spec ("minimal, purposeful"). The revision adds **no** motion: no `MotionConfig`, no `useReducedMotion`, no `FadeInView`, no entrance/stagger animations.
- The reduced-motion requirement is met by avoiding unnecessary motion: Chrome that animates (the mobile drawer, hover/press feedback) uses plain CSS `transition-*`, which the project's existing global `prefers-reduced-motion` rule (globals.css ~line 99) already neutralizes.
- The existing shared `Button` primitive (uses framer-motion internally) is reused as-is when a CTA is required — pre-existing behavior, not a new motion architecture.

### Shell vs shared layout — smallest change fitting existing architecture
- The workspace shell lives at the **segment level** (`dashboard/layout.tsx` → `DashboardShell`), which is the Next.js-native way to give one route its own chrome.
- Because the marketing `Navbar`/`Footer` render in the parent `(main)` layout above any segment layout, they are hidden on `/dashboard` with pathname gating — the **exact established convention** `Footer` already uses for `/auth` (`usePathname().startsWith("/auth")` → `null`). This is two one-line condition extensions; no new route group, no layout architecture change.
  - `Footer.tsx`: extend the existing `/auth` gate to also cover `/dashboard`.
  - `Navbar.tsx`: early-return `null` on `/dashboard` (the workspace provides its own header with brand, language, theme, and nav). Different from `/auth` (where the Navbar stays compact) because the dashboard is a full workspace, not a marketing page fragment — documented here.
- `ShellBackground`, `(main)/layout.tsx`, `page.tsx`: unchanged.
- **Shell proportions & treatment (from the visual reference)**: fixed-width sidebar rail (`w-64` ≈ 256px) with a slim brand header, grouped icon+label nav, and a locale/learner footer; a translucent, blurred header strip (~`h-16`, `backdrop-blur`) spanning the content region; main content in a centered bucket with `Container`-driven gutters and roomy vertical spacing. Offsets use logical properties only (`start`/`inset-inline-start`, `ps-`/`ms-`) so the rail sits on the correct reading side in RTL and the active item's start-edge accent bar mirrors correctly.

### Progress — structural truth, reusing the dashboard's own roadmap list
- The existing `DashboardPage` already renders the roadmap as milestone cards (current = index 0 "In Progress", upcoming = "Up Next", via the `dashboard.milestones.*` localized keys, `Card` + existing CSS transitions). This list is **the Dashboard feature's own content** (it lived in `dashboard-page.tsx`, not in onboarding components), and it is the only authoritative roadmap data in the product — so it genuinely answers "how am I progressing?" at the structural level.
- Revision: move that existing list into the presentational `ProgressSection` (fed `stageTitles`/`stageCount`/`currentStageIndex`/`learningGoal`), preserving its copy, `Card` styling, and CSS transitions. The current per-card framer-motion stagger entrance is dropped (minimal motion); reduced motion is governed by the existing global CSS rule.
- **No completion percentage, streaks, accuracy, weekly activity, or velocity numbers are shown** — no persisted per-task completion exists (spec FR-006, SC-007).
- **Visual intent (HTML "Velocity & Mastery" card)**: title row with a status pill + restrained content area. That furniture is reused, but the metric tiles/charts/numbers are replaced by the structural stage list and honest `unavailable` tiles — the visual framework is kept, the data is never faked.

### Continue Learning, Today's Focus, AI Insight — honest primary column
- **Continue Learning** is the dominant primary row. Today the product has no current-lesson entity, so the section renders the spec's defined "no current lesson" unavailable state with a real, working primary CTA ("Review your roadmap") that anchors to the roadmap/progress block on the page — no invented lesson route, no dead link.
- **Today's Focus**: `unavailable` empty state. Roadmap titles are **not** repackaged as fake tasks/recommendations; no hardcoded learner recommendations (spec FR-005, SS story 3).
- **AI Mentor Insight**: respectful unavailable state ("Personalized insight isn't available yet" class copy). No generic praise ("You're doing great"), no invented telemetry/percentages/behavioral analysis (spec FR-007, AR-001).
- These three form the workspace's primary column; Progress and Recent Activity are secondary — the learner understands the next action without reading the page top-to-bottom.
- Presentation follows the visual reference using existing furniture: Continue Learning is the full-width hero card with an action area; Today's Focus and AI Mentor Insight are cards with icon-in-tile headers (the insight card keeps the start-edge accent bar). The reference governs how it looks; the spec/data rules govern what is shown inside.

### Visual composition — implement the reference, not the prototype
- The HTML's composition is authoritative: greeting row → full-width **Continue Learning hero** → two-column grid (primary ~60%: Today's Focus, then AI Mentor Insight; secondary ~40%: Progress, then Recent Activity), stacking to one column on small screens.
- Recreate its furniture with existing primitives only: shadcn `Card` for `rounded-xl` surfaces, existing `Container`/spacing scale for gutters and `space-y-*`/`gap-*` rhythm, existing typography tokens for the display/heading → title → label/body hierarchy, and existing token colors (near-navy primary, `--color-light-blue-*` surfaces, semantic success/amber accents) in both themes. Icon-in-tile headers and pill badges reuse `lucide-react` icons plus the existing `badge-base` utility already used by `DashboardPage`.
- No HTML-specific components, classes, CDN assets, or Tailwind-config values are imported; any visual not achievable with existing tokens/primitives is mapped to the closest equivalent or dropped (verification item).

### States
- **Loading**: route-level `loading.tsx` skeleton (server-rendered).
- **Empty**: no roadmap → the existing inline onboarding empty state from `DashboardPage` (unchanged behavior/CTA to `/onboarding`).
- **Unavailable**: `SectionState` presentational renderer used by Continue Learning / Today's Focus / Mentor Insight / Recent Activity for their defined empty states.
- **Error**: not applicable in this phase (synchronous, non-throwing reads over in-memory redux). No fake error/retry surfaces are added.

### i18n / RTL / a11y / responsive
- All new copy lands in the existing `dashboard` namespace of `en.json`/`ar.json`; sections use the existing `useT` hook; no new i18n machinery.
- Logical properties (`ms-`/`me-`, `start`/`end`) for RTL; drawer mirrors via `dir`; 3-tier responsive (rail ≥1024, compact/menu 768–1023, header drawer <768); sidebar/header landmarks, `h2` section headings, `aria-expanded`/focus management for the drawer; focus-visible rings unchanged; no horizontal overflow at 320→1440 in both locales.

## Complexity Tracking

> N/A — Constitution Check passed with no violations; the plan introduces no new projects, layers, or abstractions (previous service/contract/motion layers were removed in revision — see Plan Review Decisions).

---

## Plan Review Decisions

This section records the revision against the earlier version of this plan (the rationale requested before `/speckit.tasks`).

### What changed from the previous plan
- **Removed `LearningWorkspaceService` + `contracts/learning-workspace-service.md` + `types/learning-workspace.types.ts` + `selectors/dashboardSelectors.ts` + `constants.ts`.** Data is now read directly in the existing `DashboardPage` via `useSelector` — the exact pattern the onboarding feature uses. (The earlier `research.md`/`data-model.md`/`contracts/` artifacts describing the service are superseded and must not be implemented.)
- **Removed all motion architecture**: `MotionConfig`, `useReducedMotion`, `FadeInView`, and the plan to keep framer-motion entrance animations in Progress. Motion is limited to existing CSS transitions governed by the existing global reduced-motion rule.
- **Merged `DashboardSidebar` + `DashboardHeader` into one client `DashboardWorkspaceNav`;** sections are now props-driven presentational components fed by `DashboardPage`, not self-fetching client sections.
- **Shared layout changes reduced** to two one-line pathname gates on `Navbar`/`Footer` using Footer's existing `/auth` convention.
- **Client components reduced** from ~10 in the previous plan to 2 genuinely-client areas (composition root + nav) plus presentational sections (client-only because of the React client-boundary constraint, not because they use client APIs).
- Kept unchanged: no new dependencies, no fabricated data, spec priority order, structural-only progress, en/ar + RTL.
- **Added the attached HTML mockup as the visual reference** (new **Visual Reference** section) and aligned section composition and furniture with it — visual only; all architecture and data decisions from the previous revision are preserved.

### Why the abstraction was reduced/removed
- The previous service+contract modeled a future async backend across a **read-only, synchronous, client-state-only** feature. With no future-backend operation to bound today, it was speculative indirection. Auth's `authService.ts` (the only precedent) exists precisely because it has real `not-connected` operations; onboarding (the read precedent) uses direct slice access. Least Modification + No Over-Abstraction therefore favor direct redux reads now; the backend swap replaces one composition component, not an architecture.

### Which Client Components are genuinely necessary and why
1. **`DashboardPage`** (existing, modified) — must read redux/localStorage (roadmap presence/branch, learner name/goal) → requires client.
2. **`DashboardWorkspaceNav`** (new) — current-route highlight needs `usePathname`; mobile drawer needs real interactive behavior → requires client.
3. **Sections** (`Welcome`, `ContinueLearning`, `TodayFocus`, `MentorInsight`, `Progress`, `RecentActivity`) + **`SectionState`** — presentational; they are client-bound only because they are children of the client `DashboardPage` composition root and display client-resolved data. They use no browser APIs, state, or redux internally. This is the boundary the requirement anticipated ("keep DashboardPage as the composition boundary and make sections presentational").
- Server components: `dashboard/layout.tsx`, `dashboard/loading.tsx`, `DashboardShell.tsx` (no hooks/browser APIs).

### Which data is actually available in the current product
- Learner `name` + `email` (`authSlice.user`, `localStorage["ai-mentor-auth"]`).
- Learning goal (`onboardingData.learningGoal`, loaded from `localStorage["ai-mentor-onboarding-complete"]`).
- Roadmap milestone **titles/keys + order** (`onboarding.roadmap: string[] | null`), localized via existing `dashboard.milestones.*` keys; structural current stage = index 0 (existing behavior).
→ Rendered as **Welcome** (name, goal) and **Progress** (stage list, stage count, current stage).

### Which data will be represented as unavailable
- **Current lesson** → Continue Learning "no current lesson" unavailable state (primary CTA anchors to the roadmap).
- **Focus tasks** → Today's Focus empty state (roadmap titles never repackaged as fake tasks; no hardcoded recommendations).
- **AI mentor insight** → respectful "not available yet" unavailable state (no generic praise, no invented telemetry/percentages).
- **Recent activity** → secondary neutral empty state.
- **All metrics** (completion %, streaks, accuracy, weekly activity, velocity) → not shown; only structural progress (stage count/current stage) is displayed.

### What still requires verification during implementation
- Confirm `messages/*.json` already keyed for every roadmap value used in `t("milestones.{item}")` (existing behavior uses `t(key, fallback=item)`; verify the no-roadmap and milestone-key edge paths in both locales).
- Confirm the `/dashboard` pathname gate points in `Navbar`/`Footer` never collide with feature pages nested under `/dashboard/...` (none exist today; gate uses `startsWith("/dashboard")`).
- Confirm `next-intl` `Link`/`usePathname` return locale-less pathnames for the nav highlight and gates (existing code already relies on this for `/auth`).
- Confirm the route-level `loading.tsx` skeleton follows Next App Router conventions and is not overridden by client-side navigation (Turbopack dev + `next build`).
- Confirm responsive/drawer behavior in RTL (mirror offsets via logical properties) and reduced-motion OS setting against remaining CSS transitions.
- Confirm `DashboardShell` can render the existing client `Logo`/`LanguageSwitcher`/`ThemeToggle` from a Server Component (standard client-island pattern already used by `Navbar`).
- Re-verify `useT` signature and `dashboard` namespace merge in both `en.json`/`ar.json` before writing copy.

### HTML visual reference — the design source of truth (this revision)
- **Added as visual source of truth**: the HTML mockup now governs the Dashboard's visual outcome — shell proportions, nav/header/main structure, section ordering, card furniture, typography hierarchy, color tone, density, and responsive behavior — per the **Visual Reference** section above.
- **Why visual, not implementation**: the mock is a prototype with CDN assets, inline JS, LTR-only offsets, light-only M3-style colors, and extensive hardcoded demo data. Copying it literally would violate the no-dependency, no-fabrication, RTL/LTR, and Least Modification rules. The plan preserves its *composition and furniture* and re-skins them in the project's existing design system.
- **Preserved visual patterns**: sidebar rail with grouped nav + active start-edge inset accent; translucent blurred header; centered content bucket; greeting row → Continue hero → ~60/40 two-column grid; icon-in-tile card headers; pill badges; hairline dividers; restrained micro progress bar; soft layered surfaces with gentle hover lift; calm whitespace.
- **Intentionally excluded behaviors/data**: View-Mode switcher, diagnostic/calibration modal, header search box, streak pill, notifications bell + dot, "Adaptive v2.4"/"Pro Learner" labels, avatar overflow menu, telemetry chips, all percentages/bars/charts/hours/activity rows, "Computed 2h ago", and all LTR-only classes.
- **RTL/LTR & responsive adaptation**: all offsets and accent bars become logical properties; the rail collapses to a drawer on small screens (existing three-tier pattern); the two-column grid stacks to one column; copy authored in both en and ar.
- **Honest data**: where the mock shows richer data than the frontend holds, the furniture is shown with an honest `unavailable`/empty state; nothing is invented to match the mock.