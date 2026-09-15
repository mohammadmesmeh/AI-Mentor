# Data Model: Learning Dashboard (003)

**Branch**: `003-learning-dashboard` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md) | **Contract**: [contracts/learning-workspace-service.md](./contracts/learning-workspace-service.md)

## 1. Purpose

Describes the entities the Learning Dashboard consumes, their **current** representation in this frontend-only product, and their **future** backend representation. Per the spec's verify-during-planning items (VR-002..VR-007) and the boundary contract, the dashboard never creates its own entities — it reads a boundary that maps existing authoritative state today and backend state later.

## 2. Entities — current state mapping

| Entity | Product definition (spec) | Current representation | Status |
|--------|---------------------------|------------------------|--------|
| **Learner** | Authenticated user (name, email) | `authSlice.user: { email, name }` persisted to `localStorage["ai-mentor-auth"]` | ✅ present |
| **Learning Goal** | Learner's stated goal (from onboarding, AI content) | `onboardingSlice.onboardingData.learningGoal: string` persisted via `loadOnboardingComplete` (localStorage `ai-mentor-onboarding-complete`) | ✅ present |
| **Roadmap** | AI-generated personalized path (stages that progress toward the goal) | `onboardingSlice.roadmap: string[] \| null` — milestone **title strings only**; no UUIDs, order, tasks, or timestamps | ⚠️ partial (titles + order) |
| **Stage** | A roadmap stage (batch of tasks) | `roadmap[i]` string; structural count = `roadmap.length`; no completion, no description | ⚠️ partial |
| **Current Stage** | The stage the learner is working in | existing dashboard derives first milestone as "in progress"; boundary exposes `currentStageIndex = 0` | ⚠️ derived, structural only |
| **Current Lesson** | The specific lesson/activity to continue | **not modeled** | ❌ absent → boundary `unavailable` |
| **Focus Tasks** | Small ≤3 task set for today | **not modeled** (no `Task` entity anywhere) | ❌ absent → boundary `unavailable` |
| **AI Mentor Insight** | Observation + recommended next step | **not modeled** (no AI insight source in product) | ❌ absent → boundary `unavailable` |
| **Learning Progress** | Task-based completion / velocity | **not modeled** — completion is a `boolean` only inside the onboarding mock's roadmap generation flow; no persisted per-task state | ❌ absent → boundary returns structural context only (`completionPercent: null`) |
| **Recent Activity** | Recent events/timeline | **not modeled** (no event log) | ❌ absent → boundary `unavailable` |

## 3. Status taxonomy (this feature)

Every dashboard read resolves to exactly one of (via `contracts/learning-workspace-service.md`):

- `available` — authoritative data is rendered. Today: welcome context, roadmap stage list + structural current stage.
- `unavailable` + reason — surfaced as the section's defined empty/degraded state. Today: current lesson, focus tasks, insight, activity, completion percentage.
- `loading` / `error` (+ retry) — defined in the UI contract for the future async adapter; the synchronous current adapter never emits them.

## 4. Validation rules that apply at display time

- Roadmap strings are rendered as localized milestone titles only; never parsed, split, or "upgraded" into fabricated tasks/lessons (SR-001; research D3).
- Stage index is clamped to `0..stageCount-1`; empty/missing roadmap short-circuits to the existing no-roadmap empty state instead of a workspace render (spec US1 acceptance 1; §4 empty rule).
- Any future backend-provided display value (insight text, task titles, activity) is treated as untrusted input and must pass the AI/validation pipeline before display (constitution; spec FR-005).
- No percentage is derived from stage count alone (`completionPercent` stays `null`); velocity numbers return with the Backend Integration phase (spec FR-006/SC-007).

## 5. Future backend entities (verify-during-planning → backend phase; NOT built here)

Defined here only as contract targets so the boundary is backend-ready; schemas/endpoints are explicitly deferred (spec OS-001).

| Entity | Modeled fields (target) | Notes |
|--------|--------------------------|-------|
| `Roadmap` | id, learner`, version, stages `[], status (draft/active/archived) | persisted roadmap is the source of truth; never regenerated per request (constitution, AGENTS Data Integrity) |
| `Stage` | id, roadmap`, title/en + ar, order, status | order is authoritative |
| `Task` | id, stage`, type (`read \| watch \| quiz \| project \| assignment \| coding_challenge`), title, status (`pending \| complete \| skipped \| replaced \| removed`), required/effective flag, due?, effort | task states per Product Requirements §§4–7; effective-task completion drives progress |
| `CurrentLesson` | learner`, task`, resumed location/session | "Continue Learning" target; replaces the current-stage index shortcut |
| `FocusTask` | goal-date-scoped task set (cap 3, spec §4) | factory/selection logic is backend-owned |
| `ProgressRecord` | completedEffective/requiredEffective (+ snapshot strategy) | velocity = derived, task-based |
| `MentorInsight` | observation, recommendedNextStep, generatedAt, validation status | AI output → schema + semantic validation before display |
| `ActivityEvent` | kind (lesson_completed, task_completed, stage_completed, insight), at | Recent Activity feed |

## 6. State transitions (only those reachable in this feature)

- Roadmap exists → workspace renders; `roadmap` never regenerated in this feature.
- No roadmap → `DashboardPage` shows the existing onboarding empty state (CTA `/onboarding`); no other transition occurs on the dashboard.
- Read-only feature: no dashboard action mutates `auth`, `onboarding`, or `app` state. Task completion reflection (`pending → complete`) is not initiated here; its idempotency/concurrency design belongs to the Backend Integration phase.

## 7. Open / verify items

- Backend schemas for all §5 entities — Backend Integration phase (VR-002..VR-007 resolved as "deferred").
- Unit-testing dev flow — deferred (no runner configured; research §4).