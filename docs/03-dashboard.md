# AI Mentor — Learning Dashboard (Feature 003)

## Status

| Area | Status |
| --- | --- |
| Feature spec | **Implemented** (`specs/003-learning-dashboard/spec.md`, status: Draft) |
| Implementation plan | **Implemented** (`plan.md`, authoritative for the task list; earlier `research.md`/`data-model.md`/`contracts/learning-workspace-service.md` are **superseded** by plan revision and must not be implemented) |
| Dashboard route + server page + segment layout + loading skeleton | **Implemented** |
| App shell (`DashboardShell` + `DashboardWorkspaceNav`) | **Implemented** |
| Sections (Welcome, Continue Learning, Today's Focus, AI Mentor Insight, Progress, Recent Activity) + `SectionState` | **Implemented** — presentational, props-driven, use the `dashboard` i18n namespace |
| `DashboardPage` composition root (read-only over Redux/localStorage) | **Implemented** |
| Navbar/Footer gating on `/dashboard` | **Implemented** |
| i18n (en + ar mirrored `dashboard` namespace) | **Implemented** |
| Data the product does not model (current lesson, focus tasks, AI insight, recent activity, completion metrics) | **Backend-dependent** — rendered as honest localized `unavailable`/empty states; nothing fabricated; no backend contract exists yet for these sections (docs/05 API gaps) |
| Backend data sources for those sections | **Unknown / not authored** — deliberately deferred (spec VR-001..VR-008) |
| Manual QA (quickstart scenarios) | **NOT RUN** — task `T031` remains unchecked; needs a human browser pass (see docs/07) |

## Sources

- `specs/003-learning-dashboard/{spec.md,plan.md,tasks.md,quickstart.md,checklists/requirements.md}`
- `src/app/[locale]/(main)/dashboard/{layout.tsx,loading.tsx,page.tsx}`
- `src/features/dashboard/components/{app-shell,sections,states,pages,dashboard-page.tsx}`
- `src/shared/components/layout/{navbar/Navbar.tsx,Footer.tsx}`
- `messages/{en,ar}.json` (`dashboard` namespace)

## Product Purpose

The Dashboard is the primary authenticated learning workspace: the first screen after sign-in when onboarding is complete, and the place the learner returns to between sessions. Its UX job is to answer three questions within a few seconds:

1. **What should I do next?** — a single, visually dominant "Continue Learning" action toward the current lesson.
2. **Why should I do it?** — a concise AI Mentor Insight (observation + one recommended next step) plus goal/stage context.
3. **How am I progressing?** — task-based progress that supports the next-step decision, never distracts from it.

The section is spec'd as **learning-first, not analytics-first**: calm, professional, low-card-count, no gamification, no gimmicky AI visuals.

Today the product holds only learner name (`auth.user.name`), learning goal (`onboarding.domain`), and a structural roadmap (an array of milestone title keys, `onboarding.roadmap`) **when present**. Everything else renders as an explicit `unavailable`/empty state. See "Known inconsistencies" below: under the current six-step onboarding implementation, no code path populates `onboarding.roadmap`, so the roadmap-present branch described here is not currently reachable through the real onboarding flow.

## Page Structure (as implemented)

```text
/[locale]/dashboard
├── dashboard/layout.tsx            # SERVER — <DashboardShell>{children}</DashboardShell>
├── dashboard/loading.tsx           # SERVER — route-level skeleton (no client JS)
└── dashboard/page.tsx              # SERVER — setRequestLocale + <DashboardPage/>
```

```text
DashboardPage (CLIENT, composition root — src/features/dashboard/components/pages/dashboard-page.tsx)
├── no roadmap  → existing inline onboarding empty state ("Create My Roadmap" → /onboarding)
└── roadmap     → workspace grid
    ├── WelcomeSection            (eyebrow + h1 greeting + goal)
    ├── ContinueLearningSection   (hero card; "no current lesson" state; CTA → #roadmap)
    ├── grid md:grid-cols-5
    │   ├── primary (md:col-span-3): TodayFocusSection → MentorInsightSection
    │   └── secondary (md:col-span-2): ProgressSection (#roadmap) → RecentActivitySection
```

### Shell

- `DashboardShell` (Server Component): renders the workspace nav region + a desktop header strip (with `hidden md:flex` ThemeToggle) + main content in a `Container py-8`, offset `lg:ps-64` for the rail.
- `DashboardWorkspaceNav` (client):
  - ≥ `lg`: fixed rail (`start-0 w-64`), brand header with `Logo`, grouped icon+label links to existing destinations (Home, Overview), active link highlighted from `usePathname`, footer housing `LanguageSwitcher` (and learner name when available).
  - `< lg`: sticky header with logo + `LanguageSwitcher`/`ThemeToggle` (hidden on mobile) + menu toggle (`aria-expanded`, localized label). Drawer opens with opacity/pointer-events and a `-translate-x-full rtl:translate-x-full` slide; Escape closes; selecting a nav link closes; closes on outside; no focus trap (documented decision).
  - Marketing `Navbar`/`Footer` are gated off `/dashboard` (`usePathname().startsWith("/dashboard")`), mirroring the existing `/auth` gating in `Footer`.

### Sections (all props-driven, `useT("dashboard")`)

| Section | Props | Behavior |
| --- | --- | --- |
| `WelcomeSection` | `learnerName`, `learningGoal` | Eyebrow `welcomeEyebrow`, `h1` `welcomeHeading` (`Welcome back, {name}`), goal line. |
| `ContinueLearningSection` | `status` | Primary hero card. No current-lesson entity exists today → spec's "no current lesson" state with the **real** primary CTA `reviewRoadmap` anchored to the roadmap block. Never a dead link, never an invented lesson. |
| `TodayFocusSection` | `status` | Empty state (`noFocusTasksTitle`/`noFocusTasksDescription`). Roadmap titles are **not** repackaged as fake tasks. |
| `MentorInsightSection` | `status` | Start-edge accent bar card; respectful unavailable copy (`insightUnavailableTitle`/`...Description`). No praise, no telemetry, no invented analysis. |
| `ProgressSection` | `stageTitles`, `stageCount`, `currentStageIndex`, `learningGoal` | `h2` + `progressStageLabel` (`Stage {current} of {total}`) + status pill (`inProgress` on current). Renders the structural stage list (`milestones.{item}` localized keys), current = index 0 (existing behavior). **No** percentages, streaks, accuracy, or velocity numbers. |
| `RecentActivitySection` | `status` | Secondary, quiet empty state (`noRecentActivityTitle`/`...Description`). No fake events. |
| `SectionState` | `icon`, copy, etc. | Single reusable empty/unavailable renderer used by the four degraded sections. |

Composition order (from the adopted HTML mock): greeting → full-width Continue Learning hero → ~60/40 two-column grid → stacks to a single column on small screens.

## Data Flow

- `DashboardPage` is the **single client data boundary**: it reads `state.auth` and `state.onboarding` with `useSelector`, derives `learnerName`, `learningGoal`, `stageTitles`, `stageCount`, `currentStageIndex`, and the roadmap-presence branch, then passes plain props to sections.
- No service layer, selectors file, or contract types were added (plan revision removed them as over-abstraction). When a real backend lands, the data reads in `DashboardPage` are replaced wholesale behind the same component.
- The feature is read-only: visiting the dashboard mutates nothing; no new routes, state slices, dependencies, or backend calls (spec FR-010, OS-001).

## States

- **Loading**: route-level server `loading.tsx` skeleton.
- **Empty (no roadmap)**: existing onboarding empty state (welcomeTitle/noRoadmapDescription/startOnboarding → `/onboarding`); never a partial dashboard.
- **Unavailable**: `SectionState` for Continue Learning / Today's Focus / AI Mentor Insight / Recent Activity.
- **Error**: not applicable this phase — reads are synchronous and non-throwing; no fake retry/error surfaces were added.

## Honest-data guarantees (spec SR-003, FR-005/006/007)

- No fabricated recommendations, insights, activity rows, streaks, notifications, or diagnostic percentages ever show.
- Progress is structural only (stage list + current stage) — there is no persisted per-task completion to compute a percentage from.
- When backend/AI sources land, their output must pass the project's validation pipeline before display (docs/06).

## Responsive & Navigation

- Desktop ≥1024: fixed rail + header + spacious content column.
- Tablet 768–1023: no fixed rail; content uses full width; nav in header.
- Mobile <768: single-column; header drawer; "Continue Learning" reachable without a deep scroll.
- No horizontal overflow by design at 320–1440 in both `en`/`ar`; logical properties (`ms-`/`me-`, `start`, `inset-inline-start`) keep RTL correct; `Container`/`section-container` cap content widths.

## Accessibility

- Single `main#main-content` landmark (from the `(main)` layout) with one `h1` per page and `h2` per section.
- Drawer toggle has `aria-expanded` + localized `aria-label`; inner `<nav>` carries the localized `navLabel`; nav list landmark-complementary.
- Keyboard operable; focus-visible rings come from the global design-system baseline (docs/02).
- No JS animation was added; existing CSS transitions respect the global `prefers-reduced-motion` rule.
- All strings localized in `messages/en.json` + `messages/ar.json` (`dashboard` namespace, including the `suggested` pill added for Today's Focus).

## i18n keys (dashboard namespace)

Shell/nav: `navHome`, `navOverview`, `navLabel`, `navMenuLabel`, `navMenuOpenAria`, `navMenuCloseAria`. Sections: `welcomeEyebrow`, `welcomeHeading`, `welcomeTitle`, `continueLearningTitle`, `reviewRoadmap`, `todayFocusTitle`, `suggested`, `mentorInsightTitle`, `insightUnavailableTitle`, `insightUnavailableDescription`, `progressTitle`, `progressStageLabel`, `yourRoadmap`, `currentMilestone`, `upcomingMilestone`, `inProgress`, `recentActivityTitle`, `noRecentActivityTitle`, `noRecentActivityDescription`, `noCurrentLessonTitle`, `noCurrentLessonDescription`, `noFocusTasksTitle`, `noFocusTasksDescription`, `noRoadmapDescription`, `startOnboarding`, `milestones.*` (`introSetup`, `coreFundamentals`, `firstProject`, `advancedConcepts`, `realWorldApplications`, `reviewNextSteps`).

## Known inconsistencies (verify)

1. **`onboarding.roadmap` is currently unreachable.** The Dashboard's core branch (`DashboardPage`: `if (!onboarding.roadmap) { …empty state… }`) depends on `onboarding.roadmap` being a populated `string[]`. Under the current six-step onboarding implementation (`specs/005-onboarding-ux-redesign`, `src/features/onboarding/components/pages/onboarding-page.tsx`), no code path dispatches the `setRoadmap` action — `onboardingService.submitOnboarding()` always returns `{ status: "not-connected" }`, and even the (currently unreachable) success branch only dispatches `setSubmitStatus("succeeded")` and `completeOnboarding()`, never `setRoadmap`. The workspace-grid path this document describes (`WelcomeSection` → `ContinueLearningSection` → …) is therefore not reachable through the real onboarding flow today; only the "no roadmap" empty state renders in practice. This is a cross-feature gap between 003 (Dashboard, built assuming a populated mock roadmap) and 005 (the later onboarding redesign, which removed the code that wrote to `onboarding.roadmap`) — not something this documentation pass resolves; see the Engineering Notes reported alongside this reconciliation.
2. **`RoadmapGeneration.tsx` is orphaned.** `src/features/onboarding/components/RoadmapGeneration.tsx` (an animated "Creating Your Learning Roadmap" screen) is not imported or rendered anywhere in the codebase — a leftover from a prior onboarding implementation that simulated a 3-second generation step. The current onboarding flow shows an honest failure state instead (per spec 005 FR-019).

## Task Status (003)

32 of 33 tasks in `specs/003-learning-dashboard/tasks.md` are `[x]`. Remaining: **T031 — manual browser validation of `quickstart.md`**, `NOT RUN` (no browser in this environment). `pnpm lint` and `pnpm build` both pass on the final implementation.