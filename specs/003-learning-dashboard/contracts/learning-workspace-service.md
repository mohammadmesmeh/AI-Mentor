# Contract: Frontend Learning Workspace Service Boundary

**Branch**: `003-learning-dashboard` | **Date**: 2026-09-12 | **Spec**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md) | **Research**: [research.md](../research.md)

## 1. Purpose

Defines the single frontend boundary through which the Learning Dashboard reads all learner/roadmap data. It is the mechanism behind the spec's backend-out-of-scope decision (OS-001) and the forward-looking integration points the spec marks as verify-during-planning (VR-002..VR-007): current lesson, focus tasks, AI mentor insight, progress/velocity, and recent activity.

This contract is **frontend-only**. It documents what the UI may call, what each result's statuses are, and what the UI must render. It deliberately does **not** define or assume any backend endpoints, payloads, entities, response schemas, or persistence — those are established during the later Backend Integration phase. Today's adapter reads the authoritative client-held state (redux `auth` + `onboarding` slices, `localStorage`) and reports `unavailable` for surfaces the current product does not model.

## 2. Principles (from Constitution + spec)

1. **No fabricated data.** Surfaces with no authoritative source resolve to `unavailable` — never invented lessons, tasks, insights, completion percentages, or activity (SR-001..004, FR-005/006/007, SC-007; AGENTS constitution: authoritative state).
2. **No coupling in UI.** Components depend on this boundary module and its result types, never on redux selectors, `localStorage`, or future provider SDKs (DR-001, FR-009/FR-010).
3. **Existing behavior preserved.** The roadmap milestone list and onboarding empty state continue to function exactly as today; nothing here changes reducer semantics or the roadmap regeneration lifecycle.
4. **Resume-safe reads.** This boundary is read-only. No dashboard operation mutates persisted learner state. Task completion reflection is deferred to the Backend Integration phase (spec §4; research D2/D3).
5. **Unavailable is an explicit, observable state.** The UI renders the localized unavailable/empty state per section and must not synthesize a success-like substitute.
6. **Backend-ready without backend assumptions.** The interface and result unions define statuses the future backend will fulfill; today's adapter simply cannot produce the data-bearing statuses, so it returns `unavailable` — keeping the UI correct now and ready for the swap.

## 3. Interface

Implemented in `src/features/dashboard/services/learningWorkspaceService.ts`. Result types live in `src/features/dashboard/types/learning-workspace.types.ts`; selectors for the available fields live in `src/features/dashboard/selectors/dashboardSelectors.ts`.

```ts
type DataStatus = "available" | "unavailable" | "loading" | "error"

interface StatusBase {
  status: DataStatus
}

interface WelcomeContextResult extends StatusBase {
  status: "available"
  learnerName: string | null
  learningGoal: string | null
}

interface ContinueLearningResult extends StatusBase {
  status: "unavailable"        // today: no current-lesson entity is modeled
  reason: "no-current-lesson"
  // Available shape (with current lesson) is defined during the Backend Integration phase
}

interface TodayFocusResult extends StatusBase {
  status: "unavailable"        // today: no task entities exist; report from backend later
  reason: "no-focus-tasks"
  // Available shape: FocusTask { id, title, type, effort }[] (≤ FOCUS_TASK_LIMIT = 3) — defined later
}

interface MentorInsightResult extends StatusBase {
  status: "unavailable"        // today: no AI recommendation source
  reason: "no-insight"
  // Available shape: { observation, recommendedNextStep } — defined later; must pass AI validation pipeline
}

interface ProgressResult extends StatusBase {
  status: "available"          // structural stage context is authoritative from onboarding.roadmap
  stageCount: number
  currentStageIndex: number    // 0-based index of the current/in-progress stage
  stageTitles: string[]
  completionPercent: null      // null — no persisted task completion exists today
}

interface RecentActivityResult extends StatusBase {
  status: "unavailable"        // today: no activity events are recorded
  reason: "no-activity"
  // Available shape: ActivityEvent[] — defined during the Backend Integration phase
}

interface LearningWorkspaceService {
  getWelcomeContext(): WelcomeContextResult
  getContinueLearning(): ContinueLearningResult
  getTodayFocus(): TodayFocusResult
  getMentorInsight(): MentorInsightResult
  getProgress(): ProgressResult
  getRecentActivity(): RecentActivityResult
}
```

### Notes on the interface

- **Synchronous, non-throwing today.** The adapter reads the in-memory redux store; it cannot fail, so `loading`/`error` statuses exist only in `DataStatus` for the future async adapter. The UI's shared `SectionState` already supports loading/error/retry (D8) so the swap is renderer-free.
- **`ProgressResult.completionPercent` is `null`, never a synthesized number.** Only truthful, structurally derivable progress is surfaced (stage count + current stage), satisfying FR-006/SC-007.
- **No state crosses this boundary.** The boundary returns derived read models only; redux `AuthUser`/`OnboardingData` remain owned by their slices. No mutation methods are exposed.
- **Discriminated statuses** force callers (sections) to handle `unavailable` explicitly — no surprise fallbacks.

## 4. Adapter behavior today (2026-09-12)

| Operation | Implementation | Return | UI rendering |
|-----------|----------------|--------|--------------|
| `getWelcomeContext` | read `auth.user.name`, `onboardingData.learningGoal` | `available` (name/goal may be null-safe strings) | Welcome section: greeting + goal |
| `getContinueLearning` | `() => ({ status: "unavailable", reason: "no-current-lesson" })` | `unavailable` | Continue Learning is the primary CTA row, rendered in the defined "no current lesson" state; primary action points to the roadmap overview inside the workspace (preserves existing value); no learner-state mutation |
| `getTodayFocus` | `() => ({ status: "unavailable", reason: "no-focus-tasks" })` | `unavailable` | "Today's Focus" shows the no-focus-tasks empty state |
| `getMentorInsight` | `() => ({ status: "unavailable", reason: "no-insight" })` | `unavailable` | Insight section hidden or neutral placeholder — no fabricated recommendation text |
| `getProgress` | derive `stageCount`, `currentStageIndex = 0`, `stageTitles` from `onboarding.roadmap`; `completionPercent = null` | `available` (structural) | Stage list + current-stage label; **no** percentage/velocity number |
| `getRecentActivity` | `() => ({ status: "unavailable", reason: "no-activity" })` | `unavailable` | Recent Activity hidden or neutral empty state |

Empty-state rule: when `onboarding.roadmap` is `null`/empty, `DashboardPage` renders the existing no-roadmap onboarding empty state (with CTA to `/onboarding`) in place of the workspace sections — unchanged behavior.

## 5. Future backend swap (documented, NOT implemented here)

When the external backend is integrated:

1. Replace the five stub/adapter bodies behind the same six-method interface; `getWelcomeContext`/`getProgress` continue to source from the backend's learner/roadmap data.
2. Extend the result unions with the `available` payloads (current lesson, `FocusTask[]`, insight text, `ActivityEvent[]`, task-derived `completionPercent`/velocity) as defined by the Backend Integration phase — nothing is assumed here.
3. Turn the boundary async (or keep sync if the backend preloads) and begin populating `loading`/`error`/retry, which the UI already renders.
4. UI section components change only to render newly returned statuses; structure, contract file, and boundary remain.

**Out of scope in this feature — deliberately undefined here**: backend endpoints, roadmap-generation APIs, task/progress persistence, AI-insight endpoints, activity/timeline sources, `Roadmap`/`Task`/`Stage` schemas, completion semantics, concurrency/idempotency of task completion. These contracts are explicitly deferred to the Backend Integration phase (spec OS-001, VR-002..VR-007; research §12).

## 6. Consumers

- `src/features/dashboard/components/sections/WelcomeSection.tsx` → `getWelcomeContext()`
- `src/features/dashboard/components/sections/ContinueLearningSection.tsx` → `getContinueLearning()`
- `src/features/dashboard/components/sections/TodayFocusSection.tsx` → `getTodayFocus()`
- `src/features/dashboard/components/sections/MentorInsightSection.tsx` → `getMentorInsight()`
- `src/features/dashboard/components/sections/ProgressSection.tsx` → `getProgress()`
- `src/features/dashboard/components/sections/RecentActivitySection.tsx` → `getRecentActivity()`
- `src/features/dashboard/components/pages/dashboard-page.tsx` → shell composition + roadmap-empty fallback