# Contract: Dashboard UI Surface

This is the observable UI behavior that tests and reviewers verify. Component names refer to `src/features/dashboard/components/`.

## Page order when the view is `ready` (FR-015)

| # | Section | Heading | Anchor |
|---|---|---|---|
| 1 | `WelcomeSection` | the only `h1` | none |
| 2 | `ContinueLearningSection` | `h2` | none |
| 3 | Grid: `TodayFocusSection`, `MentorInsightSection`, `ProgressSection`, `RecentActivitySection` | `h2` each | none |
| 4 | `RoadmapView` | `h2` (previously an `h1`) | `id="roadmap"` |

Stage titles are visible **only** in `RoadmapView`. `ProgressSection` exposes them to assistive technology only.

## Section props (the new or changed interface)

| Component | Props | Renders |
|---|---|---|
| `ContinueLearningSection` | `current: CurrentTaskRef \| null`, `allCompleted: boolean` | The task title, localized type, localized minutes and stage title, plus a primary link `#task-<id>`. When everything is completed, the completion copy. Otherwise, the "nothing to start" copy and a link to `#roadmap`. |
| `TodayFocusSection` | `tasks: CurrentTaskRef[]` (at most 3) | One row per task, each with title, type and minutes, linking to `#task-<id>`. The existing empty state when the list is empty. |
| `ProgressSection` | `progress: RoadmapProgress` | Localized "Stage {n} of {total}"; "{done} of {total} tasks" with a progress bar (`role="progressbar"` with `aria-valuenow`); a segmented stage-status indicator. No streak, accuracy or time figures. |
| `MentorInsightSection`, `RecentActivitySection` | unchanged, `status="unavailable"` | Unchanged honest states (FR-011) |
| `RoadmapView` | `roadmap` | Stages, tasks and resources sorted by `position`. Each task row has `id="task-<id>"`, `tabIndex={-1}` and a `:target` highlight. |

## Task row

- The duration comes from the ICU plural key, not a hard-coded `min`.
- **Resources:**
  - With a safe URL: `<a href target="_blank" rel="noopener noreferrer">`, plus a visually hidden "opens in new tab".
  - With an unsafe URL: plain title text with "link unavailable".
  - Keyed by `resource.id`.
- **Complete and Skip:** shown only for `current` and `available` tasks. They are `disabled`, with visible helper text "Available soon" linked through `aria-describedby`. There is no click handler.

## Non-ready views

These reuse the existing components wherever possible.

| View | Renders |
|---|---|
| `loading` | A localized loading message (`aria-live="polite"`) |
| `onboarding-incomplete` | The existing `OnboardingIncomplete` component |
| `start` | The existing `RoadmapGenerationStart` component |
| `generating` / `timed-out` | The existing `RoadmapGenerating` component |
| `failed` / `start-error` | The existing `RoadmapGenerationFailure` component |
| `roadmap-not-ready` | New localized copy: "Your roadmap is being prepared", with a check-again action |
| `roadmap-inactive` | Localized copy explaining the previous roadmap is no longer active, plus the Generate action |
| `load-error` | Localized "couldn't load your dashboard" plus a Retry button that re-runs the failed query. **Never** the start screen. |

## Localization keys (added to `dashboard.*` in both `messages/en.json` and `messages/ar.json`)

- **Loading:** `loadingWorkspace`
- **Continue Learning:** `currentTaskStage`, `allTasksCompletedTitle`, `allTasksCompletedDescription`, `nothingToStartTitle`, `nothingToStartDescription`, `goToTask`
- **Progress:** `stageOfTotal`, `tasksCompletedOfTotal`, `progressBarLabel`
- **Task rows:** `taskMinutes` (ICU plural), `taskActionUnavailable`, `resourceOpensNewTab`, `resourceLinkUnavailable`
- **Non-ready views:** `roadmapNotReadyTitle`, `roadmapNotReadyDescription`, `roadmapInactiveTitle`, `roadmapInactiveDescription`, `dashboardLoadErrorTitle`, `dashboardLoadErrorDescription`, `retryLoad`

Final names are fixed in `tasks.md`. Both locale files keep identical key sets.
