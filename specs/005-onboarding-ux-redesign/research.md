# Research: Onboarding UX Redesign (005)

**Branch**: `005-onboarding-ux-redesign` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

These are the design decisions made during the planning phase. Each records the Decision, the Rationale, and the Alternatives considered and rejected. They bridge the requirements in `spec.md` and the existing 5-step implementation.

---

## R1 — Six-step structure and component mapping

**Decision.** Replace the current 5-step wiring with the spec's 6-step sequence and reuse existing components where the content is unchanged:

| Spec step | Old step | Component (after change) | Changes |
|-----------|----------|--------------------------|---------|
| **Step 1 — مجالات‏ Learning Domain** | Step 1 `StepOneLearningGoal` | `StepOneDomain` | Free-text input for the **domain** (any subject); single-line; placeholder/labels updated; slice field `learningGoal` → `domain`. |
| **Step 2 — المستوى Level** | Step 2 `StepTwoSkillLevel` | `StepTwoSkillLevel` | Slice field `skillLevel` → `level`; UI and values unchanged. |
| **Step 3 — الوقت Time** | Step 4 `StepFourTimeCommitment` | `StepThreeTimeCommitment` | Renumbered; UI, options, and custom-description behavior unchanged. |
| **Step 4 — هدف النجاح Success Goal** | Step 5 `StepFiveSuccessGoal` | `StepFourSuccessGoal` | Renumbered; free-text input kept; **review-summary Card removed** (moves to Step 5). |
| **Step 5 — التأكيد Review + Preferences** | — | `StepFiveReview` (new) | 4-value summary Card + per-value Edit actions + preferences multi-select (≥1). |
| **Step 6 — الإرسال Submit** | — | `StepSixSubmit` (new) | Idle / submitting / failed / succeeded states wired to the submission boundary. |

**Rationale.** Steps 2–4 already exist with correct options and validation; renumbering preserves that work. Step 5 composes two existing patterns (the summary Card from old `StepFiveSuccessGoal` + the multi-select grid from old `StepThreeLearningPreferences`) — no new abstraction. Step 6 is a thin boundary-driven screen. `OnboardingLayout`/`ProgressIndicator` already parameterize `totalSteps`, so the 5→6 change is a single prop.

**Alternatives considered.**
- *A1 — Keep 5 steps and bolt preferences somewhere.* Rejected: the user explicitly confirmed the flow stays exactly six steps (Clarification J2).
- *A2 — Make Step 6 a separate success screen after submission.* Rejected: FR-017 requires the success confirmation to live inside the submit step and proceed straight to roadmap generation (Clarification J3).
- *A3 — Rework time to a numeric slider.* Rejected: existing 5 time options match the product language and keep the number→minutes mapping a backend concern (deferred).

---

## R2 — Onboarding Redux slice field mapping and persistence

**Decision.** Rework `onboardingSlice.ts`:

- Rename `learningGoal: string` → `domain: string` (Step 1).
- Rename `skillLevel: string | null` → `level: string | null` (Step 2).
- Keep `learningPreferences`, `timeCommitment`, `timeCustomDescription`, `successGoal`, `currentStep`, `isComplete`, `roadmap`.
- **Remove** `isGenerating` and `saveOnboardingData`/`onboardingData` (see R8).
- **Add** `submitStatus: "idle" | "submitting" | "succeeded" | "failed"` and `submitError: string | null`.
- `setOnboardingData` payload type updated to the new field names; `setIsGenerating` removed; `setRoadmap` kept (exported, unused — see R8 note); new `setSubmitStatus`/`setSubmitError` actions; `resetOnboarding` resets the new fields too.
- Persistence unchanged: only `isComplete` is written to `localStorage["ai-mentor-onboarding-complete"]`; per-answer values remain ephemeral Redux state during an active session (existing behavior preserved).

**Rationale.** Field renames make the slice self-documenting against the new spec vocabulary (domain, level). `onboardingData` was a redundant snapshot created right before `completeOnboarding()`; with the simulation gone it serves no purpose. Honest-states require explicit `submitStatus`/`submitError` fields that the UI renders (FR-016/FR-018) instead of a fake 3s timer.

**Impact (must be applied in Phase 2).** `dashboard-page.tsx:47` reads `onboarding.onboardingData?.learningGoal || onboarding.learningGoal` → change to `onboarding.domain`. `auth-page.tsx:20` reads `onboarding.isComplete` → unchanged.

**Alternatives considered.**
- *A1 — Keep old field names, change only UI labels.* Rejected: creates lasting confusion between "goal" (old) and "domain" (new) — the spec deliberately separates these concepts (FR-007).
- *A2 — Keep `onboardingData` and repopulate it.* Rejected: unnecessary duplication; answers already live in top-level slice fields.
- *A3 — Persist each answer to localStorage on change.* Rejected: not required by spec; changes existing session-scoped behavior.

---

## R3 — Navigation model (Continue/Back + Step-5 Edit actions)

**Decision.** Keep the existing `goToStep(n)`-based model. Every step component receives `value`/`onChange`/`onNext`/`onBack` and keeps its local `useState<string>` validation error (existing pattern). Step 5 receives an additional `onEdit(step: number)` that calls `goToStep(targetStep)`.

- Step 1 (Domain): no Back (existing first-step convention); Continue → 2 (valid: `domain.trim() !== ""`).
- Step 2 (Level): Back → 1; Continue → 3 (valid: `level` selected).
- Step 3 (Time): Back → 2; Continue → 4 (valid: option chosen; `custom` requires non-empty description).
- Step 4 (Success Goal): Back → 3; Continue → 5 (valid: `successGoal.trim() !== ""`).
- Step 5 (Review): Back → 4; Continue → 6 (valid: `learningPreferences.length > 0`). Edit buttons dispatch `goToStep(1..4)` by label; answers persist in the slice so returning to Step 5 shows updated values.
- Step 6 (Submit): Back → 5; no Continue — the submit CTA replaces it.

**Rationale.** Reuses the existing dispatch primitive, so no answer is lost on any Edit navigation — the slice is the single source of truth (FR-014). No new state machine or modal needed; matches spec's "navigates back to the correct step preserving all answers".

**Alternatives considered.**
- *A1 — Auto-navigate back to Step 5 after edit.* Rejected: fragile return-stack; explicit `onEdit(step)` + manual Back is simpler and predictable.
- *A2 — In-place edit modal over the summary.* Rejected: breaks the step-by-step mental model the spec describes (FR-014 wording).

---

## R4 — Submission boundary (`onboardingService`)

**Decision.** Introduce the single frontend boundary for submission: `src/features/onboarding/services/onboardingService.ts`, modeled on `specs/002-auth-page-redesign/contracts/auth-service.md`.

```ts
type OnboardingSubmitStatus = "not-connected"   // today
// Future statuses (success/error/…) defined entirely in the Backend Integration phase.

interface OnboardingSubmitResult {
  status: OnboardingSubmitStatus
}

interface OnboardingService {
  submitOnboarding(answers: OnboardingData): Promise<OnboardingSubmitResult>
}
```

Today's adapter for `submitOnboarding` is `async () => ({ status: "not-connected" })`. Step 6 translates `not-connected` into the localized *“submission is not available yet”* error state (see FR-018 + R7) — it must **never** fabricate a success. When the real backend integration lands (features/004), the adapter body is swapped behind the same interface and Step 6 renders the real returned status.

**Rationale.** Mirrors the established auth-feature pattern exactly (SR-003/FR-019: no fabricated success). The UI gets a fully specified loading/error lifecycle that is testable against a mock, while the success path is only realizable once a genuine adapter exists — never via a simulated delay.

**Alternatives considered.**
- *A1 — Fake 3s delay + fake success.* Rejected: directly violates FR-019 and the Constitution data-integrity principle.
- *A2 — Call a real API now.* Rejected: no API client exists yet; integration is a separate feature (004).

---

## R5 — Step 1 free-text domain input

**Decision.** `StepOneDomain` reuses `InputField` in **single-line** mode and validates non-empty trimmed value. Placeholder/local copy updated for "domain" (any learning subject) rather than "goal". No dropdown/autocomplete and no suggested-list UI.

**Rationale.** `InputField` already renders a plain `<input>` when `multiline` is false — no new component. A domain is typically a short phrase; single-line keeps the field light. FR-006/FR-007 demand free text with no fixed list; anything list-based would contradict J1.

**Alternatives considered.**
- *A1 — Keep multiline.* Rejected: unnecessary for short domain phrases; can be revisited if real users type long domains.
- *A2 — Combobox with suggestions.* Rejected: contradicts "no fixed list, AI interprets the entry" (FR-007) and adds a UI dependency.

---

## R6 — Step 5 review + preferences composition

**Decision.** `StepFiveReview` layout:

```
h1/p (stepFiveReviewTitle / stepFiveReviewDescription)
Card (primary tint, border-primary/20)      ← summary of the 4 core values
   Domain  <value>        [Edit → step 1]
   Level   <value>        [Edit → step 2]
   Time    <value>        [Edit → step 3]
   Goal    <value>        [Edit → step 4]
h2/p (stepFivePreferencesTitle / stepFivePreferencesDescription)
2-col grid of 4 OptionCards (hands-on | video | reading | quizzes)   ← multi-select, toggle
error text when length === 0
StepNavigation  Back → step 4 · Continue → step 6 (canContinue = preferences.length > 0)
```

Label maps (`skillLevelLabels`, `timeLabels`, `preferenceLabels`) move here from old `StepFiveSuccessGoal`. Missing values render `t("notSpecified")` (existing defense).

**Rationale.** This is the direct implementation of FR-013/FR-014/FR-015 and J2: one step contains the confirmation ritual and the preference collection, with per-value Edit affordances. Both building blocks already exist in the codebase; composition is the only new work.

**Alternatives considered.**
- *A1 — Put preferences in Step 3 (their old slot) and a pure summary in Step 5.* Rejected: Clarification J2 requires preferences inside Step 5.
- *A2 — One big editable row list with inline selects.* Rejected: more complexity than needed; step-navigation Edit is simpler and clearer.

---

## R7 — Step 6 submit screen states

**Decision.** `StepSixSubmit` renders exactly four states driven by `submitStatus` + `submitError`:

| `submitStatus` | Screen |
|----------------|--------|
| `idle` | Title/description + primary CTA `t("submitOnboarding")`; Back → 5; no spinner. |
| `submitting` | CTA disabled + loading label/`animate-pulse`; Back hidden/disabled during flight (prevents duplicate submission — FR-016). |
| `failed` | Error Card (danger tint, localized message from `submitError`), "Retry" secondary button re-calls the boundary, answers untouched, Back → 5 (FR-018). |
| `succeeded` | Success Card (CheckCircle2 icon, localized title/description), then a short confirmation display and a `useEffect` transition into the roadmap creation/generation experience (J3); CTA no longer shown (FR-017). |

Submit flow: `dispatch(setSubmitStatus("submitting"))` → `observe(await onboardingService.submitOnboarding(answers))` →
- `not-connected` → `setSubmitStatus("failed")` + `setSubmitError("stepSixErrorNotConnected")`.
- future success → `setSubmitStatus("succeeded")` + `saveOnboardingData(answers)` + `completeOnboarding()` (real success only).

**Rationale.** Covers FR-016 (disabled/loading/no duplicate), FR-017 (success → brief confirmation → generation flow), FR-018 (error + retry + preserved answers), FR-019 (truthful states). The four states are explicit and testable; today only the first three are reachable, honestly.

**Alternatives considered.**
- *A1 — Merge sumit into Step 5's Continue.* Rejected: spec defines six distinct steps; a dedicated submit step gives the confirmation ritual a home and a single CTA point.
- *A2 — Auto-redirect to /dashboard on success.* Rejected: violates J3 (proceed to roadmap generation, not dashboard).

---

## R8 — Removing the simulated generation

**Decision.** Delete the simulated path from `onboarding-page.tsx`: drop `handleGenerate`, the `setIsGenerating(true)` dispatch, the 3s `setTimeout`, the generated `OnboardingData` snapshot, and the `isGenerating` render branch. `RoadmapGeneration.tsx` stays in the repo (still exported) but is not rendered by the onboarding flow anymore. `setRoadmap` remains exported and unused; no roadmap titles are produced by this feature. Consequence: `onboarding.roadmap` stays `null`, so the dashboard keeps showing its existing no-roadmap empty state until the real generation flow is built (deferred, out of scope).

**Rationale.** FR-019: never fabricated success, simulated delay, or fake data. The 3s timer is exactly that. Removing it aligns the flow with the honesty principle; the dashboard already handles the null-roadmap state so nothing regresses.

**Alternatives considered.**
- *A1 — Keep the animated screen as a success celebration.* Rejected: its copy (“Creating Your Learning Roadmap”) is fabricated until a real flow exists.
- *A2 — Build the real generation flow in this feature.* Rejected: explicitly out of scope (spec); anti-scope-discipline.

---

## R9 — i18n key plan

**Decision.** Extend/trim the `onboarding` namespace in BOTH `messages/en.json` and `messages/ar.json`.

New keys (en → ar): `stepFiveReviewTitle` (“Review Your Choices” / “مراجعة اختياراتك”), `stepFiveReviewDescription`, `stepFivePreferencesTitle` (“Choose Your Learning Preferences” / “اختر تفضيلاتك التعليمية”), `stepFivePreferencesDescription`, `domain` (“Domain” / “المجال”), `edit` (“Edit” / “تعديل”), `stepSixTitle`, `stepSixDescription`, `submitOnboarding` (“Start My Journey” / “ابدأ رحلتي”), `stepSixSubmitting`, `stepSixSuccessTitle`, `stepSixSuccessDescription`, `stepSixErrorNotConnected`, `retry` (“Retry” / “إعادة المحاولة”).

Modified: `stepOneTitle`/`stepOnePlaceholder` wording stays compatible with “domain”; `stepOneDescription` gains the word domain.

Removed: `generateRoadmap` (Step 6 submit replaces it); `generatingTitle`/`generatingDescription` become unused by the flow (kept only if `RoadmapGeneration` needs them — mark removable).

**Rationale.** Follows the existing `step[X]Title/Description/Error` naming convention. Arabic mirrors English key-for-key (project requires both languages; UI strings must never be hardcoded).

**Alternatives considered.** — none; the naming convention is established and unambiguous.

---

## R10 — Progress indicator with six steps

**Decision.** Change `OnboardingLayout`'s `totalSteps={5}` → `totalSteps={6}`. No change to `ProgressIndicator` (it already maps `Array.from({ length: totalSteps })` to dots and the “Step {current} of {total}” label).

**Rationale.** The parameterization already exists; this is a one-token change verified by the smoke matrix (six active dots, correct “1 of 6 … 6 of 6”).

**Alternatives considered.** — none.

---

## Summary of deferred items (verified during planning)

| Item | Where it lands |
|------|----------------|
| Real API client + submission endpoint | features/004 Frontend API Integration (backend contract unchanged by this feature). |
| Time/level → `available_minutes_per_week` / contract value mapping | Backend Integration phase (`data-model.md` §7). |
| Roadmap creation/generation flow | Out of scope per spec; dashboard empty state remains. |
| Reload/resume of partial onboarding | Out of scope; existing session-scoped Redux behavior preserved. |
| Test runner | Remains unconfigured; quickstart.md defines the manual matrix (matches 002/003). |