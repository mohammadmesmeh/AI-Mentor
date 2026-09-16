---

description: "Task list for the Learning Dashboard feature implementation"
---

# Tasks: Learning Dashboard

**Input**: Design documents from `/specs/003-learning-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md (validation scenarios)

**Superseded docs (do NOT implement)**: `research.md`, `data-model.md`, and `contracts/learning-workspace-service.md` describe a retracted service/contract abstraction (see plan.md "Plan Review Decisions"). No service, contract, types, selectors, or constants files are created. Data is read directly in `DashboardPage` via `useSelector` (existing onboarding pattern).

**Tests**: No automated test tasks. The project has no test runner (package.json has no vitest/jest/playwright) and the spec does not request tests (SC-010 mandates no new dependencies). Each user story is validated by its **Independent Test** (manual) plus `pnpm lint` + `pnpm build`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. All new copy is centralized in the Foundational i18n tasks (T004/T005) to avoid cross-story file conflicts on `messages/en.json`/`messages/ar.json`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

## Path Conventions

Single frontend project at repository root (`src/`, `messages/`). All Dashboard work lives under `src/features/dashboard/`; route-shell files under `src/app/[locale]/(main)/dashboard/`; shared-layout edits under `src/shared/components/layout/`; i18n under `messages/`.

---

## Phase 1: Setup (Project Verification)

**Purpose**: Verify the design-system tokens, utilities, i18n namespace, and route/gating conventions the plan depends on — no assumptions about existing files.

- [x] T001 Verify design tokens/utilities exist in `src/app/globals.css` before any component work: `.progress-track`/`.progress-fill` utilities, `.badge-base` utility, `--color-light-blue-bg` / `--color-light-blue-text` tokens, and the global `prefers-reduced-motion` rule (globals.css ~line 99). If any are missing, STOP and report — do not invent replacements.
- [x] T002 [P] Verify the current `dashboard` i18n namespace in `messages/en.json` (~line 70) including the `milestones.*` keys, and confirm `src/features/dashboard/components/pages/dashboard-page.tsx` uses `t("milestones.{item}", item)` to localize roadmap strings; record the exact key set to extend in T004/T005.
- [x] T003 [P] Verify route entry points and gating points: `src/app/[locale]/(main)/dashboard/page.tsx` (server, `setRequestLocale`), `src/app/[locale]/(main)/layout.tsx` (ShellBackground + Navbar + main#main-content + Footer), the `usePathname().startsWith("/auth")` gate in `src/shared/components/layout/Footer.tsx`, and the equivalent `isAuth` handling in `src/shared/components/layout/navbar/Navbar.tsx`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that MUST be complete before any user story can be implemented — i18n copy, workspace shell + navigation, shared state renderer, and the shared-layout gates.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Extend the `dashboard` namespace in `messages/en.json` with all copy defined by plan.md: shell/nav labels, section headings (Welcome, Continue Learning, Today's Focus, AI Mentor Insight, Progress, Recent Activity), unavailable/empty state copy ("no current lesson", "no focus tasks", "not available yet" insight, "no recent activity"), CTA labels ("Review your roadmap", "Create My Roadmap"), and aria-labels for the drawer/nav. Translation rules: every key MUST derive from the approved plan.md/spec.md requirements and the existing `dashboard` namespace — do NOT invent unrelated keys, and do NOT rename or remove existing unrelated `dashboard` keys (e.g. `milestones.*`, `welcomeTitle`, `yourRoadmap`, `noRoadmapDescription`, `startOnboarding`). No user-facing string is hardcoded in components (spec IR-001).
- [x] T005 [P] Mirror the exact same key set added in T004 into the `dashboard` namespace of `messages/ar.json` with correct Arabic copy (RTL-safe; spec IR-001/IR-002). Copy the key list from T004's keys — the key structure MUST stay exactly synchronized with `messages/en.json`: same nested paths, none added, none dropped, none renamed; only the localized values differ.
- [x] T006 [P] In `src/shared/components/layout/Footer.tsx`, extend the existing `/auth` null-gate to also return `null` when `usePathname().startsWith("/dashboard")` — smallest possible change to the established pathname-gating convention (plan: shell vs shared layout). Do NOT refactor Footer or redesign its existing behavior; the existing `/auth` gate handling is untouched.
- [x] T007 [P] In `src/shared/components/layout/navbar/Navbar.tsx`, early-return `null` when `usePathname().startsWith("/dashboard")` so the marketing Navbar never renders over the workspace header (mirrors Footer gating; do NOT touch the existing `isAuth` adaptation). Keep the change strictly minimal — no Navbar refactor, no redesign of existing behavior, no change to `/auth`/`isAuth` handling.
- [x] T008 [P] Create `src/features/dashboard/components/states/SectionState.tsx` — shared presentational empty/unavailable renderer that receives ALREADY-LOCALIZED copy via props (`title`/`description` strings resolved by the caller at the client composition boundary) plus an optional lucide icon; used by ContinueLearning/TodayFocus/MentorInsight/RecentActivity sections. It does NOT call `useT()` itself and adds no `"use client"`, no hooks, no state, no browser APIs — the localized strings are passed in as props.
- [x] T009 [P] Create `src/features/dashboard/components/app-shell/DashboardWorkspaceNav.tsx` — the client component that genuinely requires client capabilities (`usePathname` for the active-route highlight + interactive drawer behavior): grouped icon+label nav links to EXISTING destinations only (Overview→`/dashboard` active, Home→`/`), active-item start-edge accent bar via `usePathname` using logical properties. Mobile drawer must provide: `aria-expanded`, localized `aria-label`, Escape-to-close, full keyboard operability with visible `focus-visible` states, correct open/close behavior, and closing after navigation where appropriate. Do NOT build a custom focus trap or complex focus-management architecture (rely on native focus behavior unless an existing project primitive already provides one). Reuses `Logo`, `LanguageSwitcher`, `ThemeToggle`, `Button`. No links to non-existent routes (spec FR-010).
- [x] T010 Create `src/features/dashboard/components/app-shell/DashboardShell.tsx` — SERVER presentational shell: sidebar region (`w-64` rail) + header strip (`h-16`, translucent blur) + main region, using existing token surfaces/radii/shadows, logical properties only (`start`/`ps-`/`ms-`), and composing `DashboardWorkspaceNav`. Depends on T009. No hooks/browser APIs (plan: server-rendered chrome). `DashboardShell` MUST remain a Server Component — it may compose/render the client `DashboardWorkspaceNav` as a normal client island, and must NOT add `"use client"` merely because it renders a client component. Keep the shell visually aligned with the supplied HTML reference and use logical RTL/LTR properties (spec RR-001/RR-004, IR-002).
- [x] T011 Create `src/app/[locale]/(main)/dashboard/layout.tsx` — SERVER segment layout rendering `<DashboardShell>{children}</DashboardShell>` with `setRequestLocale(locale)`. Depends on T010.
- [x] T012 [P] Create `src/app/[locale]/(main)/dashboard/loading.tsx` — SERVER route-level loading skeleton built from existing spacing/colors (no client JS, no new dependencies), matching the shell's centered content bucket.

**Checkpoint**: Foundation ready — shell, navigation, i18n, SectionState, and shared-layout gates complete; user story implementation can begin.

---

## Phase 3: User Story 1 - Resume current lesson from the primary action (Priority: P1) \*\* MVP \*\*

**Goal**: Landing workspace where the learner immediately recognizes the dominant **Continue Learning** primary section and a real, working primary action. With no current-lesson entity in the product today, the hero card renders the spec's honest "no current lesson" state and its primary CTA ("Review your roadmap") anchors to the structural roadmap list on the same page — never a dead link or fabricated lesson (US1 acceptance 4, FR-003, plan "Continue Learning, Today's Focus, AI Insight" & "Visual composition").

**Independent Test**: With a roadmap present, `/dashboard` (en + ar) shows the greeting header and the Continue Learning hero as the most visually prominent element; activating the primary CTA scrolls to the structural roadmap list on the page (no 404/dead action, at most two clicks/taps from landing); the roadmap list shows the current stage (index 0) and upcoming stages; Navbar/Footer are absent.

### Implementation for User Story 1

- [x] T013 [P] [US1] Create `src/features/dashboard/components/sections/WelcomeSection.tsx` — presentational greeting (eyebrow + `h1` heading + learner goal line) fed props `learnerName` and `learningGoal`; uses existing heading/typography tokens and `useT("dashboard")`; no action buttons (HTML reference's Recalibrate/Curriculum prototype actions are excluded).
- [x] T014 [P] [US1] Create `src/features/dashboard/components/sections/ContinueLearningSection.tsx` — presentational hero card (per the visual reference: full-width, visually dominant, action area); accepts `status` prop with value `"unavailable"` today and renders the "no current lesson" state via `SectionState` with the localized copy from T004; primary CTA `Button href="#roadmap"` labeled "Review your roadmap"; MUST NOT fabricate a lesson title, duration, or progress (spec FR-003/FR-011).
- [x] T015 [P] [US1] Create `src/features/dashboard/components/sections/ProgressSection.tsx` — presentational, fed `stageTitles`, `stageCount`, `currentStageIndex`, `learningGoal`. Moves the EXISTING localized milestone card list from `dashboard-page.tsx` into this section as **structural progress** (`dashboard.milestones.*` titles, current stage = index 0 "In Progress", upcoming = "Up Next"; `Card` + existing CSS transitions; `id="roadmap"` anchor target for the primary CTA). Drop the existing per-card framer-motion entrance stagger (minimal motion); NO completion percentage/streaks/accuracy numbers (spec FR-006/SC-007).
- [x] T016 [US1] Modify `src/features/dashboard/components/pages/dashboard-page.tsx` — keep the existing inline no-roadmap empty state (US2); when `onboarding.roadmap` is present, read `state.auth`/`state.onboarding` via `useSelector` (no new selectors/services), derive `learnerName`/`learningGoal`/`stageTitles`/`stageCount`/`currentStageIndex`, and render `WelcomeSection` + `ContinueLearningSection` + `ProgressSection` in the visual-reference order (greeting → hero → content grid). Depends on T013–T015.

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Learner without an active learning path (Priority: P1)

**Goal**: A new learner with no roadmap sees a truthful **Empty Dashboard** state with a single action to create their roadmap; mid-onboarding learners never see invented roadmap or progress (US2, FR-009 empty state).

**Independent Test**: Load `/dashboard` (en + ar) with no roadmap present — empty state text and single "Create My Roadmap" CTA render, no partial/broken sections; activating the CTA routes to `/onboarding` in the same locale; after onboarding completes, the empty state disappears and the workspace renders.

### Implementation for User Story 2

- [x] T017 [US2] In `src/features/dashboard/components/pages/dashboard-page.tsx`, preserve the existing null-`roadmap` branch: localized `welcomeTitle`(+ greeting) + `noRoadmapDescription` + primary `Button` "Create My Roadmap" (`startOnboarding` key) with `href="/onboarding"`; confirm it renders instead of any partial workspace and stays anchored to the shell (`DashboardShell`) with no breakage. Depends on Phase 2 shell.
- [x] T018 [P] [US2] Verify (code walk, no new files) the empty state in both `messages/en.json` and `messages/ar.json` (keys from T004) and that it renders correctly in RTL and LTR with the "learner mid-onboarding" path (roadmap null = same empty state; no invented roadmap/progress). Record any missing keys and add them to `messages/en.json` and `messages/ar.json` if discovered (keep both files in sync).

**Checkpoint**: Sign-in → onboard → learn funnel delivers; US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Learner reviews Today's Focus and completes a task (Priority: P2)

**Goal**: Today's Focus presents a small, prioritized session set and reflects task completion without a full page reload — **as far as authoritative data exists today**. The current product models no Task entities, so the section renders the honest "no focus tasks" state with constructive localized copy pointing to the roadmap/current lesson. No tasks are fabricated from roadmap titles and no task-completion mutation is invented (US3 acceptance 3, spec FR-004 bound by FR-010; plan "Continue Learning, Today's Focus, AI Insight").

**Independent Test**: With a roadmap present, the Today's Focus card on `/dashboard` (en + ar) shows the icon-in-tile header + "no focus tasks" state — never placeholder tasks that look real, never roadmap titles repackaged as recommendations. No task-completion controls are rendered (no authoritative source).

### Implementation for User Story 3

- [x] T019 [P] [US3] Create `src/features/dashboard/components/sections/TodayFocusSection.tsx` — presentational; accepts `status` prop with value `"unavailable"`; card furniture per visual reference (icon-in-tile header, pill badge, hairline dividers) with localized "no focus tasks" copy via `SectionState`; MUST NOT render task rows, durations, or recommendations (spec FR-005 note "no hardcoded learner recommendations"; plan: no fabricated tasks).
- [x] T020 [US3] Wire `TodayFocusSection` into `src/features/dashboard/components/pages/dashboard-page.tsx` in the primary content column (after Continue Learning, per visual-reference order). Depends on T019. Do NOT add a focus-task cap constant file (`constants.ts` is not added — cap of 3 is enforced only when a real task source arrives, out of scope per FR-010/OS-001).

**Checkpoint**: Today's Focus honest unavailable state integrated; US1–US3 independent.

---

## Phase 6: User Story 4 - Learner acts on the AI Mentor Insight (Priority: P2)

**Goal**: The AI Mentor Insight surface renders a concise observation + recommended next step when a validated source exists — and degrades gracefully TODAY (no recommendation source exists), never synthesizing content (US4, FR-005, spec SR-003).

**Independent Test**: On `/dashboard` (en + ar), the Insight card (start-edge accent bar furniture) shows the respectful, localized "not available yet" state with no generic praise ("You're doing great"), no invented telemetry/percentages/behavioral analysis, and no fabricated recommendation.

### Implementation for User Story 4

- [x] T021 [P] [US4] Create `src/features/dashboard/components/sections/MentorInsightSection.tsx` — presentational; accepts `status` prop with value `"unavailable"`; card furniture per visual reference including the start-edge accent bar and icon-in-tile header; renders respectful unavailable copy via `SectionState` (no "Computed Xh ago", no prescription callouts, no precision chips — all excluded prototype data).
- [x] T022 [US4] Wire `MentorInsightSection` into `src/features/dashboard/components/pages/dashboard-page.tsx` in the primary column (after Today's Focus). Depends on T021.

**Checkpoint**: Insight section degrades honestly; US1–US4 independent.

---

## Phase 7: User Story 5 - Learner reads their progress/learning velocity (Priority: P2)

**Goal**: Progress shows a truthful, task-based summary supporting the next-step decision — represented TODAY by the structural stage context already rendered in `ProgressSection` (US5 isn't complete in its analytics sense; FR-006/SC-007 forbid invented percentages).

**Independent Test**: With a roadmap, `ProgressSection` on `/dashboard` (en + ar) shows only structural indicators — current stage (index 0) + stage count + milestone list — within the "Velocity & Mastery" card framing (title row + status pill); no completion percentage, streak, accuracy, weekly chart, or telemetry number is rendered in either theme.

### Implementation for User Story 5

- [x] T023 [US5] Enhance `src/features/dashboard/components/sections/ProgressSection.tsx` with the visual-reference "Velocity & Mastery" card framing: title row (`h2`) + a status pill reflecting the structural current stage; keep the structural roadmap/stage list (from T015) as the section body. Explicitly render NO completion percentages, streaks, accuracy, weekly-activity bars, or diagnostic numbers (spec FR-006/SC-007; plan: metrics stay structurally honest).
- [x] T024 [US5] Verify (code walk, both locales + both themes) that no fabricated metric renders anywhere in the enhanced `ProgressSection` and that the current-stage indicator reflects `currentStageIndex` derived from `onboarding.roadmap` (index 0 = "In Progress"); update `messages/en.json`/`messages/ar.json` only if a status-pill label is missing (keep files in sync).

**Checkpoint**: Structural progress truthful and framed; US1–US5 independent.

---

## Phase 8: User Story 7 - Dashboard on tablet and mobile (Priority: P2)

**Goal**: Intentional responsive adaptation — not a compressed desktop layout — with navigation moving to a header drawer/compact rail, the primary action discoverable without deep scroll, and no horizontal overflow in both locales (RR-001..RR-005, US7).

**Independent Test**: Render `/dashboard` at 375/768/1024/1440px in en (LTR) and ar (RTL): no horizontal overflow; the Continue Learning hero is reachable without a long scroll; navigation adapts (rail ≥1024, compact/header 768–1023, drawer <768 with `aria-expanded`/keyboard operability); the two-column grid stacks to one column; touch targets meet design-system minimum.

### Implementation for User Story 7

- [x] T025 [US7] Harden responsive behavior in `src/features/dashboard/components/app-shell/DashboardShell.tsx` and `DashboardWorkspaceNav.tsx`: rail ≥1024px, compact/header nav 768–1023px, mobile drawer <768px (Escape, `aria-expanded`, keyboard operability); content single-column on mobile; section order preserved; primary CTA discoverable without deep scroll. Fix any horizontal overflow at 320px in both locales via logical properties. Follow the responsive intent of the supplied HTML visual reference using EXISTING project/Tailwind breakpoints and conventions — do NOT introduce new breakpoint tokens or arbitrary responsive architecture; preserve the intentional mobile/tablet/desktop adaptation (spec RR-001..RR-005).
- [x] T026 [US7] RTL/LTR pass: confirm all offsets/accents use logical properties (`ms-`/`me-`, `start`/`end`, `ps-`/`pe-`), the active nav accent bar and rail mirror correctly in Arabic, and section ordering/alignment is correct in `ar` at all four widths (spec RR-004/IR-002).
- [x] T027 [US7] Touch-target + a11y hardening across the dashboard: all interactive elements meet the design-system minimum touch size; full keyboard operability incl. drawer toggle `aria-expanded`/`aria-label` and visible focus-visible rings; confirm the global `prefers-reduced-motion` rule neutralizes remaining CSS transitions (AR-002..006).

**Checkpoint**: Adaptive, keyboard-accessible, RTL-correct dashboard; US1–US5 + US7 independent.

---

## Phase 9: User Story 6 - Recent Activity secondary section (Priority: P3)

**Goal**: A compact secondary list of recent learning events that degrades gracefully TODAY — no activity event source exists, so the section shows a neutral localized unavailable state and never fabricates events (US6, FR-007).

**Independent Test**: On `/dashboard` (en + ar), the Recent Activity card renders its neutral unavailable/empty state (quiet, secondary); no placeholder or fake event rows, no timestamps, no score badges.

### Implementation for User Story 6

- [x] T028 [P] [US6] Create `src/features/dashboard/components/sections/RecentActivitySection.tsx` — presentational; accepts `status` prop with value `"unavailable"`; card furniture per visual reference (title row + quiet body) with neutral unavailable copy via `SectionState`; MUST NOT render invented events, timestamps, or accuracy/score badges (spec FR-007/SR-003).
- [x] T029 [US6] Wire `RecentActivitySection` into `src/features/dashboard/components/pages/dashboard-page.tsx` in the secondary content column (after Progress, per visual-reference order). Depends on T028.

**Checkpoint**: All user stories independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Feature-complete verification and cross-cutting quality (spec FR-012/OS-003 exclusions, SC-001..SC-010). T030–T033 are intentionally SEQUENTIAL (no `[P]`): each validation/audit task can surface fixes that touch the same implementation files, so run them in order and apply any fixes before starting the next.

- [x] T030 Run `pnpm lint` and `pnpm build` from the repository root; fix all errors. Confirm no new dependencies were added to `package.json`, the theme default is unchanged, and auth/onboarding/home have no regressions (spec SC-010).
- [ ] T031 Execute the manual validation scenarios in `specs/003-learning-dashboard/quickstart.md` (both locales, both themes, desktop/tablet/mobile): no-roadmap empty state, workspace sections, unavailable states, RTL/LTR, responsive widths, keyboard, reduced motion. Fix any failures found.
- [x] T032 Accessibility audit against spec AR-001..AR-007: single logical `main` landmark (existing `main#main-content`), one `h1` + `h2` per section, descriptive localized aria-labels, visible focus, sufficient contrast in both themes, loading/empty/state changes perceivable (e.g., `aria-busy`/live region for the loading skeleton).
- [x] T033 Fabrication audit: verify no fake percentages, streaks, accuracy, weekly activity, notifications, telemetry, AI recommendations, or recent-activity events render anywhere on `/dashboard` in either locale; confirm every "unavailable" state renders only the localized copy authored in T004/T005, passed into `SectionState` via props (spec SR-003/FR-012).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately; T002/T003 run in parallel.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories. Within it, T009 must finish before T010, and T010 before T011; the other foundational tasks run in parallel once T004's key list is fixed (T005 mirrors it).
- **User Stories (Phase 3+)**: All depend on Foundational completion. Implementable sequentially in priority order (P1 → P2 → P3).
- **Polish (Phase 10)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies.
- **US2 (P1)**: After Foundational — independent (depends only on Phase 2 shell + T004/T005 i18n).
- **US3 / US4 / US5 (P2)**: After Foundational (+ US1 wiring pattern in `dashboard-page.tsx`) — additive section cards in the same file; independently testable.
- **US7 (P2)**: After Foundational — hardens shell/nav + global a11y/RTL; independent.
- **US6 (P3)**: After Foundational (+ US5 wiring) — quiet secondary addition.

### Within Each User Story

- Sections are created as presentational components first (parallel where `[P]`), then wired into `dashboard-page.tsx` in a single additive edit; only then is the story independently tested. No model/service/endpoint ordering applies — this is a read-only frontend feature (no service layer per plan).

### Parallel Opportunities

- **Setup**: T002/T003 in parallel.
- **Foundational**: T005, T006, T007, T008, T009, T012 in parallel (T004's key list must be set first so T005 can mirror it); then T010 after T009; then T011 after T010.
- **Within stories**: section creation tasks marked `[P]` (different files) run in parallel; the wiring task into `dashboard-page.tsx` runs after them and is sequential per story (same-file edits).
- **Different stories** can be worked by different implementers only after their i18n needs are covered by T004/T005 (all section copy centralized there) — no story edits `messages/*.json`.

### Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all section creation tasks for User Story 1 together:
Task: "T013 [US1] Create WelcomeSection.tsx"
Task: "T014 [US1] Create ContinueLearningSection.tsx"
Task: "T015 [US1] Create ProgressSection.tsx"

# Then wire once all three exist:
Task: "T016 [US1] Modify dashboard-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 — both P1)

1. Complete Phase 1: Setup (verification).
2. Complete Phase 2: Foundational (shell + nav + i18n + SectionState + Navbar/Footer gates) — CRITICAL, blocks all stories.
3. Complete Phase 3: User Story 1 (greeting + Continue Learning hero + structural roadmap list).
4. Complete Phase 4: User Story 2 (empty dashboard — revalidates the existing funnel).
5. **STOP and VALIDATE**: Independent Tests for US1 + US2; `pnpm lint` + `pnpm build`.
6. Deploy/demo if ready — this is the MVP workspace.

### Incremental Delivery

1. Setup + Foundational → Foundation ready.
2. User Story 1 → Test independently → Deploy/Demo (workspace core).
3. User Story 2 → Test independently → Deploy/Demo (funnel complete).
4. User Story 3 (Today's Focus empty state) → Test → Demo.
5. User Story 4 (AI Insight unavailable state) → Test → Demo.
6. User Story 5 (structural Progress framing) → Test → Demo.
7. User Story 7 (responsive/RTL/a11y hardening).
8. User Story 6 (Recent Activity unavailable state) → Demo (full spec surface).
9. Phase 10 Polish: lint + build + quickstart + a11y + fabrication audit.

Each story adds value without breaking previous stories; unavailable states are the honest representation of missing data until the backend phase supplies it (spec OS-001, VR-001..VR-008).

### Parallel Team Strategy

With multiple implementers: Team completes Setup + Foundational together (one owns T004/T005 i18n sync). Once foundational is done, implementers pick independent stories that touch material:

- Implementer A: US1 + US2 (must land first — dashboard-page wiring).
- Implementer B: US3 + US4 sections.
- Implementer C: US5 + US6 sections (+ US7 hardening).
- Wiring tasks into `dashboard-page.tsx` are serialized in story order to avoid same-file conflicts.

---

## Notes

- **[P] tasks** = different files, no dependencies. Same-file edits (`dashboard-page.tsx`, `messages/*.json`) are NOT marked `[P]` and are serialized to avoid conflicts.
- **[Story] label** maps each task to its user story for traceability.
- Do NOT create `services/`, `contracts/`, `types/`, `selectors/`, or `constants.ts` files — the service/contract abstraction is retracted (plan.md "Plan Review Decisions").
- Do NOT add dependencies, fonts, CDN assets, design tokens, or theme changes (spec DR-001/OS-005).
- Do NOT fabricate any data: lessons, tasks, recommendations, percentages, streaks, telemetry, notifications, or activity events (spec SR-003/FR-012).
- The HTML visual reference is visual-only: implement its composition/furniture with existing project primitives; do not copy its CDN assets, inline JS, LTR-only offsets, or demo data (plan.md "Visual Reference").
- Motion: reuse existing CSS transitions only where they already exist and are visually appropriate, and only transitions the existing global `prefers-reduced-motion` rule (globals.css ~line 99) already governs — no new animation architecture, no new animation dependency, no framer-motion usage, and no new animation patterns added merely to decorate the dashboard (plan.md "Motion").
- Client boundaries: `DashboardPage` (redux/localStorage) and `DashboardWorkspaceNav` (usePathname + drawer interaction) are the only components that genuinely require client capabilities. Presentational sections take all data and localized copy via props — no client state, browser APIs, Redux usage, or client-side data fetching; `SectionState` receives already-localized strings from the composition boundary and does NOT call `useT` itself, so it must not be marked `"use client"` merely for copy.
- The `#roadmap` anchor (T015) is the working target of the Continue Learning CTA; keep it present before wiring any CTA-to-lesson behavior.
- Commit after each task or logical group; stop at each story checkpoint to validate independently.