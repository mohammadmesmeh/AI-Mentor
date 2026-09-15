# Data Model: Onboarding UX Redesign (005)

**Branch**: `005-onboarding-ux-redesign` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md) | **Contract**: [contracts/onboarding-service.md](./contracts/onboarding-service.md)

## 1. Scope of this model

This feature is frontend-only and introduces **no new persisted entities and no new backend contracts**. It reworks the existing `onboardingSlice` client state to match the **single-confirmation 6-step UX** (1 Domain → 2 Level → 3 Time → 4 Success Goal → 5 Learning Preferences → 6 Review/Confirmation; supersedes the seven-step arrangement from Session 2026-09-14, which had duplicated the confirmation around the preferences step), and it defines the result model exposed by the frontend submission boundary (`contracts/onboarding-service.md`) — the only genuinely new data surface in this feature.

## 2. Existing domain entities (reused)

| Entity | Current shape | Change in this feature |
|--------|---------------|------------------------|
| `OnboardingState` (redux) | `currentStep, learningGoal, skillLevel, learningPreferences, timeCommitment, timeCustomDescription, successGoal, isComplete, isGenerating, roadmap, onboardingData` | **Reworked** (see §3). |
| `OnboardingData` blob | `{ learningGoal, skillLevel, learningPreferences, timeCommitment, timeCustomDescription, successGoal }` snapshot persisted right before `completeOnboarding` | **Removed** — answers already live in top-level slice fields. |
| `localStorage["ai-mentor-onboarding-complete"]` | `"true"` written by `completeOnboarding()` | Unchanged — still written only on real submission success. |
| `AuthUser`/`AuthState` | auth slice, untouched | Not touched. |
| `Roadmap` (`roadmap: string[] \| null`) | Always `null` today (`setRoadmap` never dispatched) | Unchanged; stays `null` — generation flow is out of scope. |

## 3. New/reworked client state model

### 3.1 `OnboardingState` (target shape)

```ts
interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  domain: string                              // Step 1 — free text, any learning subject (FR-006/FR-007)
  level: string | null                        // Step 2 — "beginner" | "some-experience" | "intermediate"
  timeCommitment: string                      // Step 3 — "15-30" | "30-60" | "1-2" | "weekends" | "custom"
  timeCustomDescription: string               // Step 3 — required when timeCommitment === "custom"
  successGoal: string                         // Step 4 — free text
  learningPreferences: string[]               // Step 5 — subset of hands-on | video | reading | quizzes; ≥1 (FR-015)
  isComplete: boolean                         // true only after real submission success + completeOnboarding()
  roadmap: string[] | null                    // unchanged; null in this feature
  submitStatus: "idle" | "submitting" | "succeeded" | "failed"   // Step 6 lifecycle (FR-016..FR-019)
  submitError: string | null                  // i18n key of the last failure, or null
}
```

### 3.2 Validation rules (per step, applied at Continue/submit time)

| Step | Required condition |
|------|--------------------|
| 1 | `domain.trim() !== ""` |
| 2 | `level !== null` |
| 3 | `timeCommitment !== ""` AND (`timeCommitment !== "custom"` OR `timeCustomDescription.trim() !== ""`) |
| 4 | `successGoal.trim() !== ""` |
| 5 (Learning Preferences) | `learningPreferences.length > 0` |
| 6 (Review/Confirmation) | no new validation — submit enabled while `submitStatus === "idle"`, disabled while `"submitting"` |

All answers remain in Redux regardless of step; Edit from the single Step 6 summary (`goToStep(1..5)`) preserves prior input (FR-014).

### 3.3 Submission state transitions (only those reachable in this feature)

```
idle ──(submitOnboarding)──────────────────────→ submitting
submitting ──(adapter resolves not-connected)─→ failed   (submitError = "stepSixErrorNotConnected")
failed ──(Retry)──────────────────────────────→ submitting
submitting ──(future success, real backend)───→ succeeded → completeOnboarding() → isComplete = true
```

- `succeeded` is **not reachable today**: the boundary adapter returns `not-connected` only (see contract §4). This is deliberate — no fabricated success (FR-019).
- On `failed`, every field value is untouched (answers preserved for Retry, FR-018).
- `isComplete = true` triggers the onboarding page's `useEffect` handling — post-success transition is defined in the spec (J3); in the codebase today the success path must route into the roadmap creation/generation experience rather than `/dashboard` (see §6 note).

## 4. Step ⇄ field mapping

| Step | Component | Reads (slice) | Writes (setOnboardingData) |
|------|-----------|---------------|----------------------------|
| 1 | `StepOneDomain` | `domain` | `domain` |
| 2 | `StepTwoSkillLevel` | `level` | `level` |
| 3 | `StepThreeTimeCommitment` | `timeCommitment`, `timeCustomDescription` | both |
| 4 | `StepFourSuccessGoal` | `successGoal` | `successGoal` |
| 5 | `StepSixLearningPreferences` | `learningPreferences` | `learningPreferences` (toggle) |
| 6 | `StepSevenReview` | all answers + `submitStatus`/`submitError` | none (submits the boundary with a frozen `OnboardingData` snapshot) |

The deleted `StepFiveComplete.tsx` (the former step-5 core-answer confirmation) is no longer part of the model — the flow has exactly **one** confirmation (step 6).

## 5. State-transition mapping (success criteria)

| SC (spec) | Flow | Redux/local transitions involved |
|-----------|------|----------------------------------|
| SC-001 | 4 core values + preferences answered through 6 steps | `goToStep(1..6)`; per-step local validation errors; no premature advance |
| SC-002 | Back/Edit preserves answers | `goToStep(backTarget)`; fields unchanged in slice |
| SC-003 | Preferences ≥1 required for Step 5→6 | Continue gated on `learningPreferences.length > 0` |
| SC-004 | Submit idle → loading → error | `setSubmitStatus("submitting")` → `submitOnboarding` → `not-connected` → `failed` + `setSubmitError` |
| SC-005 | Submit disabled/prevented during flight | Continue disabled while `submitStatus === "submitting"`; duplicate submit not possible |
| SC-006 | Errors preserve answers + Retry works | `failed` leaves answers intact; Retry re-dispatches `submitting` |
| SC-007 | i18n en/ar | all new copy in `onboarding` namespace (R9); no hardcoded strings |
| SC-008 | RTL/LTR, responsive, a11y, reduced motion | layout-only; uses existing tokens/components (no model impact) |

## 6. Cross-feature read impact

| Consumer | Current read | New read |
|----------|--------------|----------|
| `onboarding-page.tsx` | `learningGoal`, `skillLevel`, `isGenerating`… | `domain`, `level`, `submitStatus`…; generated snapshot removed |
| `dashboard-page.tsx:47` | `onboarding.onboardingData?.learningGoal \|\| onboarding.learningGoal` | `onboarding.domain` |
| `auth-page.tsx:20` | `onboarding.isComplete` | unchanged |
| `OnboardingLayout` | `totalSteps={5}` | `totalSteps={6}` |

## 7. Future backend entities (verify-during-planning → backend phase; NOT built here)

Defined only as contract targets; schemas/endpoints explicitly deferred to the Backend Integration phase.

| Entity | Modeled fields (target) | Notes |
|--------|--------------------------|-------|
| `LearningProfile` | as `API_CONTRACT.md` §12–13: `goal`, `self_assessed_level`, `desired_outcome`, `available_minutes_per_week`, `preferred_learning_methods` | This feature deliberately keeps UI values (domain, time label, level label) decoupled from contract encodings; the numeric/payload mapping is a backend-phase concern. `preferred_learning_methods` stays required by the contract and is covered by Step 5's ≥1 rule. |
| `OnboardingStatus` | `GET /me/onboarding-status` → `complete`, `missing_fields[]` | Not consumed by this feature; `isComplete` remains client-redux-driven until real integration. |
| `Roadmap` | persisted, staged path with lifecycle | Generation flow out of scope (spec); dashboard empty state persists. |

## 8. Open / verify items

- Exact local step return-target table (R3) is fixed in research.md; verify against smoke matrix.
- Removal of `generatingTitle`/`generatingDescription` keys pending whether `RoadmapGeneration` is retained — currently kept to avoid breaking the exported component.
- Whether to also rename `roadmap`/`setRoadmap` — no; they stay as-is for minimal diff until the generation flow is built.