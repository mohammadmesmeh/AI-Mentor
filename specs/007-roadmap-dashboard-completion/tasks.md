---

description: "Task list for Roadmap-Driven Dashboard Completion"
---

# Tasks: Roadmap-Driven Dashboard Completion

**Input**: Design documents from `/specs/007-roadmap-dashboard-completion/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. plan.md research R-9 requires Vitest unit tests for the pure modules, which provide the evidence for SC-003 and SC-007, plus component tests. Test tasks come before the implementation they cover.

**Gates**:
- **⛔ G-1:** the latest-generation-request retrieval must be documented in `API_CONTRACT.md` (see [contracts/api-dependencies.md](contracts/api-dependencies.md)). Tasks marked `⛔ G-1` MUST NOT start until it is, and nothing about that endpoint may be assumed.
- **⛔ BACKEND:** the task-action endpoints do not exist. Tasks marked `⛔ BACKEND` MUST NOT be implemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1–US6 from spec.md
- Paths are relative to the repository root.

---

## Phase 1: Setup

- [X] T001 Verify the baseline before any change. Run `pnpm tsc --noEmit`, `pnpm lint` and `pnpm test`; all must pass. Then record the existing `dashboard.*` keys that this feature reuses in `messages/en.json` and `messages/ar.json`:
  - `continueLearningTitle`, `todayFocusTitle`, `progressTitle`
  - `noCurrentLessonTitle`/`noCurrentLessonDescription`, `noFocusTasksTitle`/`noFocusTasksDescription`
  - `reviewRoadmap`, `roadmapGenerationTitle`, `generateRoadmap`, `retryGeneration`, `checkAgain`, `roadmapNotFound`, `roadmapReady`
  - `stageCompleted`/`stageActive`/`stageUpcoming`, `taskComplete`/`taskSkip`/`taskResources`, `taskType.*`
  - `progressStageLabel`

  Do not change any files.
- [X] T002 [P] Create `tests/unit/dashboard/fixtures.ts`. It exports typed builders over `@/lib/api/types`:
  - `makeResource(overrides)`, `makeTask(overrides)`, `makeStage(overrides)` and `makeRoadmap(overrides)`, returning a `Roadmap` with status `active` and one current version;
  - a `makeRequest(overrides)` helper returning a `RoadmapGenerationRequest`.

  Builders take explicit `position` values, so tests can supply out-of-order data.

---

## Phase 2: Foundational (blocks all user stories)

- [X] T003 [P] Write failing tests in `tests/unit/dashboard/roadmapProgress.test.ts`, one `it` per data-model rule:
  - **`orderedStages`:** sorts stages, tasks and resources by `position` without mutating its input.
  - **`findCurrentTask`, rule 1:** returns "the first task, in roadmap order, with status `current`". With two `current` tasks, the first in order wins.
  - **`findCurrentTask`, rule 2:** otherwise, "the first task with status `available`, searching the `active` stage first and then the stages after it in order".
  - **`findCurrentTask`, rule 3:** otherwise `null`.
  - **`findCurrentTask`, never selected:** `skip_pending`, `skipped`, `replaced`, `completed` and `upcoming` tasks are never selected.
  - **`focusTasks`:** returns at most 3 items, the current task first, with no duplicates, and `[]` when nothing is actionable.
  - **`roadmapProgress`, counting:** `countedTasks` excludes `replaced`; `completedTasks` counts only `completed`; `percent` is `floor(completed/counted*100)` and is `0` when counted is `0`.
  - **`roadmapProgress`, completion:** `allCompleted` is true when every counted task is `completed` or `skipped`.
  - **`roadmapProgress`, stage number:** `stageNumber` is the index of the active stage; if none is active, the first stage that isn't completed; if all are completed, `stageCount`.
  - **Empty or null version:** handled without throwing.
- [X] T004 Implement `src/features/dashboard/lib/roadmapProgress.ts` so that T003 passes:
  - Export `CurrentTaskRef = { task: RoadmapTask; stage: RoadmapStage }` and `RoadmapProgress = { stageNumber, stageCount, completedTasks, countedTasks, percent, allCompleted, stageStatuses: { id, title, status }[] }`.
  - Export the functions `orderedStages(version: RoadmapVersion | null): RoadmapStage[]`, `findCurrentTask(stages): CurrentTaskRef | null`, `focusTasks(stages, limit = 3): CurrentTaskRef[]` and `roadmapProgress(stages): RoadmapProgress`.
  - Pure functions only: no React or i18n imports.
- [X] T005 [P] Write failing tests in `tests/unit/dashboard/safeExternalUrl.test.ts`:
  - `https://…` and `http://…` return the URL unchanged.
  - `javascript:alert(1)`, `JAVASCRIPT:…`, `data:text/html,…`, `vbscript:…`, `/relative`, `//protocol-relative`, `""` and malformed input return `null`.
- [X] T006 [P] Implement `src/features/dashboard/lib/safeExternalUrl.ts`. It exports `safeExternalUrl(url: string): string | null`: parse with `new URL(url)` inside try/catch, and accept only `protocol === "http:" || protocol === "https:"`. T005 must pass.
- [X] T007 [P] Write failing tests in `tests/unit/dashboard/dashboardView.test.ts`, one test per rule of the data-model "Resolution order", using the fixture builders:
  - An **FR-002 invariant** test: a latest-request error with no in-session request resolves to `load-error`, never `start`.
  - An **FR-004** test: a roadmap query error resolves to `load-error`.
  - Roadmap status `draft`/`generating`/`validating` → `roadmap-not-ready`.
  - Roadmap status `reset`/`archived`/`failed` → `roadmap-inactive`.
  - A `null` `currentVersion` → `roadmap-not-ready`.
  - A `cancelled` request → `start`.
  - An in-session request takes precedence over the latest request.
- [X] T008 Implement `src/features/dashboard/lib/dashboardView.ts` so that T007 passes:
  - Export the `DashboardView` discriminated union exactly as in data-model.md: `loading`, `onboarding-incomplete { missingFields }`, `start`, `start-error`, `generating`, `timed-out`, `failed { failureCode }`, `roadmap-not-ready`, `roadmap-inactive`, `ready { roadmap }`, `load-error`.
  - Export a pure `resolveDashboardView(input)` whose input is plain data:
    - `onboarding: { isLoading, data }`
    - `startError: ApiError | null`
    - `sessionRequestId: string | null`
    - `polling: { phase, request }`
    - `latest: { isLoading, isError, data: RoadmapGenerationRequest | null }`
    - `roadmap: { isLoading, isError, data: Roadmap | undefined }`
  - Follow the ten numbered rules in order. The retry callback is **not** part of the pure function; the hook attaches it.
- [X] T009 Add the new keys to the `dashboard` namespace of `messages/en.json`. Do not rename or remove existing keys.

  | Key | English copy |
  |---|---|
  | `loadingWorkspace` | "Loading your workspace…" |
  | `currentTaskStage` | "Stage: {stage}" |
  | `goToTask` | "Go to task" |
  | `allTasksCompletedTitle` | "You've completed your roadmap" |
  | `allTasksCompletedDescription` | "Every task in your roadmap is done. Review it any time below." |
  | `nothingToStartTitle` | "Nothing to start right now" |
  | `nothingToStartDescription` | "Your next task will unlock soon. Review your roadmap to see what's coming." |
  | `stageOfTotal` | "Stage {current} of {total}" |
  | `tasksCompletedOfTotal` | "{done} of {total} tasks completed" |
  | `progressBarLabel` | "Roadmap completion" |
  | `taskMinutes` | "{count, plural, one {# min} other {# min}}" |
  | `taskActionUnavailable` | "Available soon" |
  | `resourceOpensNewTab` | "(opens in a new tab)" |
  | `resourceLinkUnavailable` | "Link unavailable" |
  | `roadmapNotReadyTitle` | "Your roadmap is being prepared" |
  | `roadmapNotReadyDescription` | "It isn't ready to show yet. Check again in a moment." |
  | `roadmapInactiveTitle` | "Your previous roadmap is no longer active" |
  | `roadmapInactiveDescription` | "Create a new roadmap to keep learning." |
  | `dashboardLoadErrorTitle` | "We couldn't load your dashboard" |
  | `dashboardLoadErrorDescription` | "This is usually temporary. Please try again." |
  | `retryLoad` | "Try again" |
- [X] T010 Mirror **exactly** the same keys into the `dashboard` namespace of `messages/ar.json`, with Arabic copy:
  - `taskMinutes` uses Arabic plural categories: `"{count, plural, zero {# دقيقة} one {دقيقة واحدة} two {دقيقتان} few {# دقائق} many {# دقيقة} other {# دقيقة}}"`.
  - Afterwards, verify that key parity with en.json is identical (same nested paths, none added or dropped).

**Checkpoint**: the pure modules are tested and passing, and i18n is ready. The user stories can begin.

---

## Phase 3: User Story 1 — Returning learner lands on their existing roadmap (P1) 🎯 MVP (part)

**Goal**: One resolver decides the dashboard screen. The start screen is shown only when the server says there is no request, or the request was cancelled. A load failure gives a retryable error.

**Independent Test**: quickstart scenario A. Before G-1, run the in-session variant: generate, observe, stop the backend and click Retry. The result is `load-error`, never the start screen.

- [X] T011 [US1] Create `src/features/dashboard/hooks/useDashboardRoadmap.ts`:
  - **Composition:** `useGetOnboardingStatusQuery`, `useGenerateRoadmap`, `useRoadmapGenerationPolling` and `useGetRoadmapQuery`.
  - **The request to poll:** the in-session `requestId`, or the latest request's `id` when the latest request is active (`queued`/`running`/`validating`).
  - **The roadmap to load:** the `roadmapId` of the succeeded in-session or latest request, otherwise `skipToken`.
  - **Return value:** `{ view: resolveDashboardView(...), generate, retryGeneration, checkAgain, reset, retryLoad }`, where `retryLoad` refetches whichever query errored.
  - **Until G-1:** pass `latest = { isLoading: false, isError: false, data: null }` from a single clearly named constant, `LATEST_REQUEST_UNAVAILABLE`, with a comment linking to `contracts/api-dependencies.md` G-1. This is today's behavior.
  - **Cancelled requests:** keep the existing reset on the `cancelled` phase.
- [X] T012 [US1] Refactor `src/features/dashboard/components/pages/dashboard-page.tsx` to call `useDashboardRoadmap()` and `switch (view.view)`:
  - `loading` → `t("loadingWorkspace")` with `aria-live="polite"`. This replaces the hard-coded `"Loading…"`.
  - `onboarding-incomplete` → the existing `OnboardingIncomplete`.
  - `start` → the existing `RoadmapGenerationStart`.
  - `start-error` / `failed` → the existing `RoadmapGenerationFailure`.
  - `generating` / `timed-out` → the existing `RoadmapGenerating`.
  - `roadmap-not-ready` → `roadmapNotReady*` copy plus a `checkAgain` button.
  - `roadmap-inactive` → `roadmapInactive*` copy plus the `generateRoadmap` button.
  - `load-error` → `dashboardLoadError*` copy plus a `retryLoad` button.
  - `ready` → the existing `RoadmapView` and `DashboardSections`, unchanged for now; layout is Phase 8.

  Remove the now-unused inline branching.
- [ ] T013 [US1] ⛔ G-1: confirm `API_CONTRACT.md` documents the latest-request retrieval, covering the 5 items in `contracts/api-dependencies.md`: method/path/query, ordering, the "no request" response, the item shape and error codes. If it doesn't, STOP this phase here. T014–T016 stay blocked; continue with Phase 4.
- [ ] T014 [US1] ⛔ G-1: in `src/lib/api/apiSlice.ts`:
  - Add a `"GenerationRequest"` entry to `tagTypes`.
  - Add a `getLatestGenerationRequest: build.query<RoadmapGenerationRequest | null, void>` using the `queryFn` pattern of `getPreferences`. It maps **exactly the documented "no request" response** to `{ data: null }` and returns every other failure as its error.
  - Add `invalidatesTags: ["GenerationRequest"]` to `requestRoadmapGeneration`.
  - Export `useGetLatestGenerationRequestQuery`.
  - Adapt `RoadmapGenerationRequest` in `src/lib/api/types.ts` only if the documented item shape differs.
- [ ] T015 [P] [US1] ⛔ G-1: add an MSW handler in `tests/msw/handlers.ts` that uses the documented path and shape. Add `tests/unit/api/generation.latest.test.ts` covering: the latest request returned, the "no request" response → `null`, and a `5xx` error surfaced as an `ApiError` after the bounded read retry.
- [ ] T016 [US1] ⛔ G-1: in `src/features/dashboard/hooks/useDashboardRoadmap.ts`, replace `LATEST_REQUEST_UNAVAILABLE` with `useGetLatestGenerationRequestQuery()`, mapped to `{ isLoading, isError, data }`, and wire its `refetch` into `retryLoad`. Then run quickstart scenario A in full.

**Checkpoint**: before G-1, dashboard behavior equals today's plus the new states. After G-1, reloading and signing in again show the existing roadmap.

---

## Phase 4: User Story 2 — Continue Learning shows the real next task (P1) 🎯 MVP

**Goal**: The dominant section names the actual next task, and one action takes the learner to it.

**Independent Test**: quickstart scenario B. With a generated roadmap, the section shows the `current` task (type, minutes, stage) and "Go to task" focuses and highlights it.

- [X] T017 [P] [US2] Rewrite `src/features/dashboard/components/sections/ContinueLearningSection.tsx`:
  - **Props:** replace `status` with `current: CurrentTaskRef | null` and `allCompleted: boolean`.
  - **When `current` is set**, render:
    - the task title as plain text;
    - `t(\`taskType.${type}\`)`;
    - `t("taskMinutes", undefined, { count: estimatedMinutes })`, only when `estimatedMinutes > 0`;
    - `t("currentTaskStage", undefined, { stage: stage.title })`;
    - a primary `Button href={\`#task-${task.id}\`}` labelled `goToTask`, which calls `focusTaskAnchor(task.id)` on click.
  - **Else when `allCompleted`:** `SectionState` with the `allTasksCompleted*` copy and no task link.
  - **Else:** `SectionState` with the `nothingToStart*` copy, plus the existing `reviewRoadmap` button to `#roadmap`.
  - Keep the existing card furniture and `aria-labelledby`.
- [X] T018 [P] [US2] Create `src/features/dashboard/lib/focusTask.ts`, exporting `focusTaskAnchor(taskId: string)`. After the hash navigation, it runs `document.getElementById(\`task-${taskId}\`)?.focus({ preventScroll: true })` in a `requestAnimationFrame`. It is a no-op when the element is missing.
- [X] T019 [US2] In `src/features/dashboard/components/RoadmapView.tsx`, make each `TaskRow` root:
  - `id={\`task-${task.id}\`}`
  - `tabIndex={-1}`
  - `className` additions: `scroll-mt-24 rounded-lg outline-none target:bg-primary/5 target:ring-2 target:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring/50`

  Use logical properties only.
- [X] T020 [US2] In `src/features/dashboard/components/pages/dashboard-page.tsx` `DashboardSections`, compute `const stages = useMemo(() => orderedStages(roadmap.currentVersion), [roadmap])`, then `findCurrentTask(stages)` and `roadmapProgress(stages)`. Pass `current` and `progress.allCompleted` to `ContinueLearningSection`.

**Checkpoint**: US2 works on any roadmap loaded in-session.

---

## Phase 5: User Story 3 — Progress reflects real roadmap state (P2)

**Goal**: Real stage and task counts from the roadmap's statuses, and no invented metrics.

**Independent Test**: quickstart scenario C. The figures equal a manual count, and replaced tasks are excluded.

- [X] T021 [P] [US3] Rewrite `src/features/dashboard/components/sections/ProgressSection.tsx`:
  - **Props:** `progress: RoadmapProgress`.
  - **Render:**
    - `t("stageOfTotal", undefined, { current: stageNumber, total: stageCount })`;
    - `t("tasksCompletedOfTotal", undefined, { done: completedTasks, total: countedTasks })`;
    - a progress bar using the existing `.progress-track`/`.progress-fill` utilities, with `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow={percent}`, `aria-label={t("progressBarLabel")}` and fill width `${percent}%`;
    - the percent formatted with `new Intl.NumberFormat(locale, { style: "percent" }).format(percent / 100)`, where `locale` comes from `useLocale()`;
    - a segmented stage indicator: one flex segment per `stageStatuses` entry, coloured `bg-primary` for completed, `bg-accent-700` for active and `bg-muted` for upcoming, `aria-hidden`, plus a visually hidden `<ul class="sr-only">` listing `title — t(stageCompleted|stageActive|stageUpcoming)`.
  - **Remove:**
    - the visible stage-title card list, which is what duplicated the stage titles;
    - `id="roadmap"`, which moves to RoadmapView in T027.
  - Render **no** streak, accuracy or time figures (FR-010).
- [X] T022 [US3] In `src/features/dashboard/components/pages/dashboard-page.tsx`, pass `progress` to `ProgressSection`, and remove the old `stageTitles`/`stageCount`/`currentStageIndex` derivation.

---

## Phase 6: User Story 4 — Today's Focus lists the actionable tasks (P2)

**Goal**: Up to 3 actionable tasks, in roadmap order, each jumping to its task.

**Independent Test**: quickstart scenario D.

- [X] T023 [P] [US4] Rewrite `src/features/dashboard/components/sections/TodayFocusSection.tsx`:
  - **Props:** `tasks: CurrentTaskRef[]`.
  - **When non-empty:** render an `<ol>` of rows. Each row shows the task-type icon (reuse the icon mapping from `RoadmapView`, extracted to `src/features/dashboard/lib/taskIcon.tsx` if it is needed in both files), the title, the localized type and the ICU minutes. Each row is an `<a href={\`#task-${task.id}\`}>` that calls `focusTaskAnchor` on click.
  - **When empty:** keep the existing `SectionState` with the `noFocusTasks*` copy.
  - Keep the card furniture, and never render more than `tasks.length` rows.
- [X] T024 [US4] In `src/features/dashboard/components/pages/dashboard-page.tsx`, pass `focusTasks(stages)` to `TodayFocusSection`.

---

## Phase 7: User Story 5 — Mark complete / skip (P2, ⛔ BACKEND)

**Goal (now)**: FR-014 only. The controls are clearly unavailable, no request is made and no local status changes.

- [X] T025 [US5] In `src/features/dashboard/components/RoadmapView.tsx`, keep the two `disabled` buttons, rendered only for `current`/`available` tasks, and:
  - add a visible `<span id={\`task-${task.id}-actions-note\`} className="text-xs text-muted-foreground">{t("taskActionUnavailable")}</span>`;
  - set `aria-describedby` on both buttons to that id.

  Add no `onClick`, no mutation and no state.
- [ ] T026 [US5] ⛔ BACKEND: implement mark complete / skip (FR-012, FR-013). **Do not implement.** Blocked until the endpoints exist in `API_CONTRACT.md`; re-plan with `/speckit-plan` then.

---

## Phase 8: User Story 6 — One coherent workspace with safe resource access (P3)

**Goal**: The single page order, one `h1`, stage titles listed once, and safe new-tab resource links.

**Independent Test**: quickstart scenario E.

- [X] T027 [US6] In `src/features/dashboard/components/RoadmapView.tsx`:
  - **Structure:**
    - wrap the output in `<section id="roadmap" aria-labelledby="roadmap-heading" className="scroll-mt-20 space-y-6">`;
    - change the header `h1` to `<h2 id="roadmap-heading">`;
    - render stages from `orderedStages(roadmap.currentVersion)`, so tasks and resources are sorted by `position`.
  - **Task rows:**
    - replace the hard-coded `· {task.estimatedMinutes} min` with `t("taskMinutes", undefined, { count })`;
    - render each resource as follows:
      - when `safeExternalUrl(resource.url)` is non-null: `<a href target="_blank" rel="noopener noreferrer">{resource.title}<span className="sr-only"> {t("resourceOpensNewTab")}</span></a>`;
      - otherwise: the title as text followed by `t("resourceLinkUnavailable")`;
    - key resource rows by `resource.id`.
  - The `!version` / empty-stages fallback stays.
- [X] T028 [US6] In `src/features/dashboard/components/pages/dashboard-page.tsx`, render the `ready` view in this order: `WelcomeSection` (the only `h1`), `ContinueLearningSection`, the grid (`TodayFocusSection` + `MentorInsightSection` | `ProgressSection` + `RecentActivitySection`), then `RoadmapView` **last**. Remove the `RoadmapView` currently placed above the sections. `MentorInsightSection` and `RecentActivitySection` stay `status="unavailable"` (FR-011).
- [X] T029 [P] [US6] Extend `tests/component/roadmap/view.test.tsx`, rendering with `IntlWrapper` in `en` and `ar`, to assert:
  - there is no `h1` and there is an `h2#roadmap-heading`;
  - task rows have `id="task-<id>"`;
  - out-of-order positions render sorted;
  - a `https` resource is a link with `target="_blank"` and `rel="noopener noreferrer"`;
  - a `javascript:` resource is not a link and shows the "link unavailable" copy;
  - complete and skip are disabled, with `aria-describedby` pointing at the "Available soon" text;
  - minutes render through the plural message.
- [X] T030 [P] [US6] Create `tests/component/roadmap/sections.test.tsx` (`IntlWrapper`, both locales):
  - **ContinueLearning:** shows the current task's title, type, minutes and stage, with `href="#task-<id>"`. It shows the completion copy when `allCompleted`, and the nothing-to-start copy when `current` is null.
  - **TodayFocus:** renders at most 3 rows, in order, and the empty state for `[]`.
  - **Progress:** "Stage 2 of 3", "4 of 10 tasks completed", a progressbar with `aria-valuenow=40`, and no visible stage-title list.

---

## Phase 9: Polish & Cross-Cutting

- [X] T031 Run the i18n and fabrication audit:
  - Grep `src/features/dashboard/**` for user-facing string literals in JSX, and for `" min"`. Every user-facing string must go through `t(...)`.
  - Confirm that `messages/en.json` and `messages/ar.json` have identical `dashboard` key sets.
  - Confirm that no streak, accuracy, time-spent or fake-activity figure renders (FR-010, SC-004).
- [X] T032 Run `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` and `pnpm build`, and fix every failure. Confirm no dependency was added to `package.json`.
- [X] T033 Run the manual validation in `specs/007-roadmap-dashboard-completion/quickstart.md`:
  - scenarios B–F in `/en` and `/ar` at 320, 768 and 1280px, with keyboard only and with reduced motion;
  - scenario A only once T014–T016 are done.

  Fix any failure.

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → stories.** T003/T005/T007 (tests) come before T004/T006/T008 (implementations). T009 comes before T010.
- **US1, pre-G-1 part (T011–T012):** depends on T008. **T014–T016** depend on T013 (G-1) and can land at any time after it without touching other stories.
- **US2 (T017–T020):** depends on T004, T009 and T010, and on T012, because `dashboard-page.tsx` is restructured there.
- **US3 (T021–T022) and US4 (T023–T024):** depend on T004 and T018 (`focusTaskAnchor`). Their section rewrites are `[P]`, but the page wiring (T020 → T022 → T024 → T028) is **sequential**, since it is the same file.
- **`RoadmapView.tsx` edits:** T019 → T025 → T027, sequential, same file.
- **US6 tests (T029, T030):** after T027 and T028. They are parallel with each other.
- **Polish:** after all stories.

### Parallel examples

```text
# Foundational tests + guards together:
T003 roadmapProgress.test.ts   T005 safeExternalUrl.test.ts   T007 dashboardView.test.ts   T006 safeExternalUrl.ts

# Section rewrites together (different files), after T004 + T018:
T017 ContinueLearningSection.tsx   T021 ProgressSection.tsx   T023 TodayFocusSection.tsx

# Tests at the end:
T029 view.test.tsx   T030 sections.test.tsx
```

## Implementation Strategy

1. **MVP (buildable now):** Phases 1–2, then T011–T012, then US2 (Phase 4). The dashboard resolves states safely, and Continue Learning names the real next task.
2. **Incremental:** US3, then US4, then US5 (the FR-014 note only), then US6, then Polish. Each story is verified with its quickstart scenario.
3. **G-1 slot:** as soon as the contract documents the latest-request retrieval, do T013–T016, then quickstart A. This completes Story 1 without reworking the other stories.
4. **Never:** T026 until the backend exists. No assumed endpoints. No `localStorage` for roadmap or request IDs.
