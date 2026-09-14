---

description: "Task list for the Onboarding UX Redesign (single-confirmation six-step flow) feature"

---

# Tasks: Onboarding UX Redesign (005)

**Input**: Design documents from `specs/005-onboarding-ux-redesign/`

**Prerequisites**: plan.md, spec.md (5 user stories), research.md (R1–R10), data-model.md, contracts/onboarding-service.md, quickstart.md

**Tests**: No automated test runner is configured in this project (plan.md Technical Context). The spec does not request a TDD approach and no test tasks are generated. The feature's test plan is the manual smoke matrix A–J in `quickstart.md`, executed in the Polish phase (T027).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Priority order from spec.md: US1 (P1) > US2 (P1) > US3 (P2) > US4 (P3) > US5 (P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1..US5)
- Include exact file paths in descriptions

## Key Conventions (from data-model.md / research.md — quote authoritative constraints)

- `OnboardingState` target shape: `{ currentStep: 1|2|3|4|5|6, domain: string, level: string|null, timeCommitment: string, timeCustomDescription: string, successGoal: string, learningPreferences: string[], isComplete: boolean, roadmap: string[]|null, submitStatus: "idle"|"submitting"|"succeeded"|"failed", submitError: string|null }`
- Validation conditions (data-model.md §3.2):
  - Step 1: `domain.trim() !== ""`
  - Step 2: `level !== null`
  - Step 3: `timeCommitment !== ""` AND (`timeCommitment !== "custom"` OR `timeCustomDescription.trim() !== ""`)
  - Step 4: `successGoal.trim() !== ""`
  - Step 5 (Learning Preferences): `learningPreferences.length > 0`
  - Step 6 (Review/Confirmation): submit enabled only while `submitStatus === "idle"`, disabled while `"submitting"`; this is the flow's **single** confirmation (no confirm/summary step appears before step 6)
- Submission boundary (contracts/onboarding-service.md §3): `submitOnboarding(answers: OnboardingData): Promise<OnboardingSubmitResult>` where today `OnboardingSubmitResult.status = "not-connected"`. No fabricated success (FR-019).
- i18n key set (research.md R9; updated for the single-confirmation fix — no key changes): `stepFiveReviewTitle`, `stepFiveReviewDescription` (**used by Step 6 — Review/Confirmation**), `stepFivePreferencesTitle`, `stepFivePreferencesDescription` (**used by Step 5 — Learning Preferences**), `domain`, `edit`, `submitOnboarding`, `stepSixSubmitting`, `stepSixSuccessTitle`, `stepSixSuccessDescription`, `stepSixErrorNotConnected`, `retry`; `stepSixTitle`/`stepSixDescription` are no longer rendered (their only consumer, the deleted `StepFiveComplete.tsx`, was removed by the duplicate-confirmation fix) and may be removed later; remove `generateRoadmap`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify baseline before any changes: run `npm run lint` and `npm run build` from the repository root and confirm both pass; confirm per plan.md Technical Context that this feature adds **no** new dependencies, test runner, environment variables, or tooling (research R1/R4/R9)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Rework `src/redux/slices/onboardingSlice.ts` to the target `OnboardingState` in data-model.md §3.1: rename `learningGoal` → `domain`, rename `skillLevel` → `level`, keep `currentStep`, `learningPreferences`, `timeCommitment`, `timeCustomDescription`, `successGoal`, `isComplete`, `roadmap`; **remove** `isGenerating` and `saveOnboardingData`/`onboardingData`; **add** `submitStatus: "idle" | "submitting" | "succeeded" | "failed"` and `submitError: string | null`; update `setOnboardingData` payload type to the renamed fields; add `setSubmitStatus` and `setSubmitError` actions; remove `setIsGenerating`; keep `setRoadmap` (exported, unused); update `resetOnboarding` to reset the new fields (`localStorage["ai-mentor-onboarding-complete"]` key unchanged)
- [X] T003 Update the dashboard read in `src/features/dashboard/components/pages/dashboard-page.tsx` (line 47) from `onboarding.onboardingData?.learningGoal || onboarding.learningGoal` to `onboarding.domain` (data-model.md §6; `state.onboarding.isComplete` read in `src/features/auth/components/pages/auth-page.tsx` stays unchanged)
- [X] T004 [P] Create `src/features/onboarding/services/onboardingService.ts` implementing the frontend submission boundary per contracts/onboarding-service.md §3: `interface OnboardingSubmitResult { status: "not-connected" }` and `interface OnboardingService { submitOnboarding(answers: OnboardingData): Promise<OnboardingSubmitResult> }`; today's adapter body is `async () => ({ status: "not-connected" })` — it MUST NOT fabricate success, delay, or failure (FR-019)
- [X] T005 [P] Update `messages/en.json` `onboarding` namespace (line 201+): add the 14 new keys listed in research.md R9 (with the en values given there) and remove the `generateRoadmap` key; keep `generatingTitle`/`generatingDescription` for now (research R9 note)
- [X] T006 [P] Update `messages/ar.json` `onboarding` namespace (line 201+) to mirror **every** en.json key added/removed in T005, using the Arabic translations from research.md R9; en/ar key sets must stay identical

**Checkpoint**: Foundation ready — slice shape, dashboard parity, submission boundary, and both locales' copy exist. User story implementation can now begin.

---

## Phase 3: User Story 1 - Complete the core onboarding journey (Priority: P1) - MVP

**Goal**: An Arabic or English user completes all six steps in order (domain → level → time → success goal → learning preferences → review and submit), with per-step validation, backward/forward navigation, and a truthful submission outcome (spec.md US1).

**Independent Test**: Start onboarding with a fresh session, complete all six steps without ever going back, and reach a submission result (quickstart.md scenarios A–E and G-19/G-20).

### Implementation for User Story 1

- [X] T007 [P] [US1] Change `totalSteps` from 5 to **6** in `src/features/onboarding/components/OnboardingLayout.tsx` (location referenced from `src/features/onboarding/components/components/ProgressIndicator.tsx`, which already parameterizes step count) so the progress indicator renders "Step X of 6" with six segments (FR-002; set to 7 by the superseded Seven-Step Flow correction, then back to 6 by the duplicate-confirmation fix)
- [X] T008 [P] [US1] Rework `src/features/onboarding/components/StepOneLearningGoal.tsx` into `src/features/onboarding/components/StepOneDomain.tsx` (research R5): free-text **single-line** learning-domain input using the existing `InputField` (`multiline` off), heading/description/placeholder localized via the existing `stepOneTitle`/`stepOneDescription`/`stepOnePlaceholder` keys, validation condition `domain.trim() !== ""` with the localized `stepOneError`, Continue disabled until valid (FR-006/FR-007); no dropdown or fixed list — the domain must not be restricted (FR-007)
- [X] T009 [P] [US1] Update `src/features/onboarding/components/StepTwoSkillLevel.tsx`: keep the three `OptionCard` options and descriptions exactly as-is (values `beginner`, `some-experience`, `intermediate` — FR-008/FR-009) but align the `value: string | null` prop and `onChange` with the renamed `level` slice field; validation `level !== null` with `stepTwoError`; Continue disabled until selected
- [X] T010 [P] [US1] Renumber `src/features/onboarding/components/StepFourTimeCommitment.tsx` to `StepThreeTimeCommitment.tsx` (research R1): content, five options (`15-30`, `30-60`, `1-2`, `weekends`, `custom`), and the custom-description `InputField` unchanged; validation `timeCommitment !== ""` AND (`timeCommitment !== "custom"` OR `timeCustomDescription.trim() !== ""`) with `stepFourError`/`stepFourCustomError` (FR-010/FR-011)
- [X] T011 [P] [US1] Renumber `src/features/onboarding/components/StepFiveSuccessGoal.tsx` to `StepFourSuccessGoal.tsx` (research R1): keep the free-text multiline success-goal `InputField` and `successGoal.trim() !== ""` validation with `stepFiveError`/`stepFivePlaceholder`; **remove** its review-summary `Card` (the flow now has exactly one summary, on the final review step 6); the component must no longer accept `allData`/`onGenerate` (FR-012)
- [X] T012 [P] [US1] Create `src/features/onboarding/components/StepFiveComplete.tsx` (Step 5 — Submit/Complete, per the superseded Seven-Step Flow correction) *(superseded/removed)*: this component — a core-answer confirm summary with no submit — was the **duplicate confirmation** and is **deleted** by the single-confirmation fix in Phase 10; the flow must contain exactly one confirmation (step 6). No code from it remains in the render map (FR-001/FR-019)
- [X] T013 [P] [US1] Create `src/features/onboarding/components/StepSixLearningPreferences.tsx` (dedicated Learning Preferences; rendered as **step 5** in the single-confirmation flow): heading/description localized via `stepFivePreferencesTitle`/`stepFivePreferencesDescription`; renders the four `OptionCard` options `hands-on`/`video`/`reading`/`quizzes` in a `grid grid-cols-1 gap-3 sm:grid-cols-2` (pattern from old `StepThreeLearningPreferences`); Continue gated on `learningPreferences.length > 0` with the localized `stepThreeError` (FR-015); Back → step 4, Continue → step 6
- [X] T013b [P] [US1] Create `src/features/onboarding/components/StepSevenReview.tsx` (Review/Confirmation; rendered as **step 6**, the flow's **single** confirmation, this absorbs the final-review + submit behavior of the originally-planned `StepSixSubmit.tsx`): title/description localized via `stepFiveReviewTitle`/`stepFiveReviewDescription`; full summary of every collected value (4 core + Learning Preferences via `ReviewSummary`/`buildCoreRows`+`buildPreferencesRow`) with per-value Edit; final primary CTA `t("submitOnboarding")` that dispatches `setSubmitStatus("submitting")` then awaits `onboardingService.submitOnboarding(answers)`; map the result: `not-connected` → `setSubmitStatus("failed")` + `setSubmitError("stepSixErrorNotConnected")`, future success → `setSubmitStatus("succeeded")` + save answers + `completeOnboarding()`; **render** idle / submitting (CTA disabled + `t("stepSixSubmitting")`, FR-016) / failed / succeeded (localized `stepSixSuccessTitle`/`stepSixSuccessDescription` confirmation, then a `useEffect` transition **into the roadmap creation/generation experience** — never redirect to `/dashboard`, never a success-only stop, FR-017/J3); Back → step 5 (idle/failed only)
- [X] T013c [P] [US1] Create `src/features/onboarding/components/components/ReviewSummary.tsx` — shared presentational `dl` summary (rows: label/value/step, optional localized Edit button) plus `buildCoreRows(t, {domain, level, timeCommitment, timeCustomDescription, successGoal})` and `buildPreferencesRow(t, preferences)` used by step 6 (the single confirmation); value maps (`levelKeyMap`, `timeKeyMap`, `preferenceKeyMap`, custom-time fallback) live here
- [X] T014 [US1] Rework `src/features/onboarding/components/pages/onboarding-page.tsx`: replace the render map with the **6-step** map (`StepOneDomain` 1 → `StepTwoSkillLevel` 2 → `StepThreeTimeCommitment` 3 → `StepFourSuccessGoal` 4 → `StepSixLearningPreferences` 5 → `StepSevenReview` 6); **remove** the simulated path — `handleGenerate`, the `setIsGenerating(true)` dispatch, the 3s `setTimeout`, the `saveOnboardingData` snapshot, and the `isGenerating` render branch (FR-019, research R8); build the `OnboardingData` snapshot from slice fields for step 6; navigation per research R3 (step 1 no Back; steps 2–6 Back to previous) preserving answers (FR-003/FR-005); cap `handleNext < 6`; keep the framer-motion step transition with the existing locale-aware direction

**Checkpoint**: US1 complete — a fresh user can traverse all six steps, validation blocks invalid advance, answers persist on back/forward, and submission honestly reports the `not-connected` outcome (no fabricated success). Validate quickstart A–E and G-19/G-20.

---

## Phase 4: User Story 2 - Review and correct answers before submitting (Priority: P1)

**Goal**: On step 6 (Review/Confirmation — the flow's single confirmation) the user sees every collected value (four core values + Learning Preferences) and can Edit any value via a navigation that preserves all answers, with the final summary reflecting corrections before the final submit (spec.md US2).

**Independent Test**: Enter answers, reach the final review step, edit each value via its Edit action, and confirm each edit is reflected in the summary (quickstart.md scenario F).

### Implementation for User Story 2

- [X] T015 [US2] Add a per-value **Edit** action to the summary rows in `src/features/onboarding/components/components/ReviewSummary.tsx` (FR-014): the core-value rows (Domain → 1, Level → 2, Time → 3, Success Goal → 4) and the preferences row (Preferences → 5), all shown on the single Step 6 summary, each expose a localized `t("edit")` button that calls `onEdit(step: number)` (research R3 edit table)
- [X] T016 [US2] Wire the Edit actions in `src/features/onboarding/components/pages/onboarding-page.tsx`: pass `onEdit={(step) => dispatch(goToStep(step))}` to `StepSevenReview` (Step 6); confirm that navigating back to a step shows the previous answer still selected/entered (always true because the slice holds the answers) and that returning forward shows the corrected value with no other value changed (FR-005/FR-014)

**Checkpoint**: US1 + US2 both work — UI, and quickstart scenario F (edit navigation preserves answers, summary reflects corrections) passes.

---

## Phase 5: User Story 3 - Complete onboarding on mobile, tablet, and desktop in RTL and LTR (Priority: P2)

**Goal**: The six-step flow is fully usable from 360px up, on mobile/tablet/desktop, in Arabic (RTL) and English (LTR), with no horizontal overflow and touch targets meeting the minimum size (spec.md US3, FR-020/FR-021, SC-006).

**Independent Test**: Complete the flow at 360/768/1280px in both locales; assert no overflow, usable touch targets, and correct RTL/LTR mirroring (quickstart.md A-1/A-2, I-27, J-30).

### Implementation for User Story 3

- [X] T017 [P] [US3] Responsive/touch pass over the new components (`StepSixLearningPreferences.tsx`, `StepSevenReview.tsx`, `StepOneDomain.tsx`): confirm single scrollable column below ~1024px, `sm:` breakpoint grids, no horizontal scrolling at 360px+, and controls ≥ project minimum touch-target size; follow the patterns already used by `StepTwoSkillLevel`/`StepThreeTimeCommitment` (FR-020)
- [X] T018 [P] [US3] RTL/LTR pass on new components: all spacing/alignment uses logical properties (existing `start`/`end` utilities), the `StepSevenReview` success/error states and the summary rows on step 6 mirror correctly in `/ar/onboarding`, long Arabic text wraps without clipping (reuse the global Arabic font adjustments), and no physical-direction leaks appear in either locale (FR-021)

**Checkpoint**: US3 verified at all three widths in both locales (quickstart D-smoke: I-27 runs both locales; A-1/A-2 responsiveness).

---

## Phase 6: User Story 4 - Complete onboarding with keyboard and assistive technology only (Priority: P3)

**Goal**: Keyboard-only users can reach and operate every control with a visible focus indicator; screen-reader users get step context, selection state, and validation errors; reduced motion neutralizes non-essential animation (spec.md US4, FR-022–FR-027, SC-005/SC-007).

**Independent Test**: Complete all six steps with keyboard only (no pointer) plus a screen reader and reduced-motion enabled (quickstart.md B-3/C-7, I-28/I-29).

### Implementation for User Story 4

- [X] T019 [US4] Add accessible selection semantics to `src/features/onboarding/components/components/OptionCard.tsx` and the preferences grid in `StepSixLearningPreferences.tsx`: use `aria-pressed` (or equivalent checkbox semantics) so the toggle selection state is announced, keep full keyboard operation (focusable, Enter/Space activates), and preserve re-usable markup for the single-select step options (FR-022/FR-024/FR-026)
- [X] T020 [US4] Focus and error announcement: manage focus on step change in `pages/onboarding-page.tsx` (focus the step heading after the framer-motion transition) and ensure validation errors render near the related control with an `aria-live`/linked-announcement so step context, selection state, and errors are announced to assistive technology (FR-023/FR-024/FR-025)
- [X] T021 [P] [US4] Reduced-motion verification: confirm all new components reuse the existing global `prefers-reduced-motion` suppression and existing easing utilities; no non-essential animation introduced in `StepSixLearningPreferences`/`StepSevenReview` (FR-027, SC-007)

**Checkpoint**: US4 verified — full keyboard journey with visible focus, AT announcements, and reduced-motion neutrality (quickstart B-3/C-7 keyboard, I-28/I-29).

---

## Phase 7: User Story 5 - Recover from a failed submission (Priority: P3)

**Goal**: On submission failure the user sees a clear, localized, non-technical error with all answers preserved and a retry; duplicate submission is impossible (spec.md US5, FR-016/FR-018/FR-019, SC-008).

**Independent Test**: Simulate the failed (`not-connected`) submission, confirm the error state and preserved answers, then retry and confirm a fresh submission attempt (quickstart.md G-21/G-22).

### Implementation for User Story 5

- [X] T022 [US5] Implement the failed-state presentation in `src/features/onboarding/components/StepSevenReview.tsx` (step 6; FR-018): a localized, non-technical error Card (danger tint, success iconography for success only — here an error/warning icon) using `t("stepSixErrorNotConnected")` as the **primary** message (no diagnostic identifiers as the primary message), with a secondary **Retry** button (`t("retry")`) that returns the step to `submitting` and re-calls `submitOnboarding` without the user re-entering anything; all answers remain untouched
- [X] T023 [US5] Add the in-flight guards in `src/features/onboarding/components/StepSevenReview.tsx` and its page wiring (FR-016/US5 a3): while `submitStatus === "submitting"` the CTA and the Back action are disabled so rapid taps/double-click and Back+Submit cannot produce a second submission; exactly one attempt per user action

**Checkpoint**: US5 verified — failed submission shows the localized error with preserved answers and a working retry; no duplicate submission possible (quickstart G-21/G-22).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improve/settle issues across multiple user stories

- [X] T024 Dead code and message cleanup: remove the stale import/usage of the deleted `StepThreeLearningPreferences`; confirm `src/features/onboarding/components/RoadmapGeneration.tsx` and the `generatingTitle`/`generatingDescription` keys are either retained (exported but unreferenced by the flow) or removed per research R8/R9, deciding explicitly and keeping en/ar identical; confirm no other file references `learningGoal`, `skillLevel`, `isGenerating`, or `saveOnboardingData`
- [X] T025 Run `npm run lint` from the repository root and fix all reported issues
- [X] T026 Run `npm run build` from the repository root and fix all typecheck/build errors
- [X] T027 Execute the manual smoke matrix A–J in `quickstart.md` and the regression checklist; record results honestly, including the two documented gaps (success E2E path not runnable until a real adapter exists; dashboard roadmap content stays in its existing empty state)

---

## Phase 9: Seven-Step Flow Correction (Session 2026-09-14) *(superseded)*

**Purpose**: Correction applied after the 6-step plan was implemented. Learning Preferences moved out of Step 5 into a **dedicated Step 6**; Step 5 became a **Submit/Complete** interstitial that confirms the core answers (no submission fires); and Review/Confirmation became the **final Step 7** where the real submission fires (spec.md Session 2026-09-14; supersedes Clarification J2). **This whole phase is superseded** by the duplicate-confirmation fix in Phase 10: the step-5 interstitial duplicated the final confirmation and was removed, restoring a six-step, single-confirmation flow. Items below document what the (now-superseded) phase did. API contract, slice shape, and i18n key sets are unchanged.

- [X] T028 [P] Create `src/features/onboarding/components/StepSixLearningPreferences.tsx` — the dedicated Step 6 preferences multi-select (details in T013)
- [X] T029 [P] Create `src/features/onboarding/components/StepSevenReview.tsx` (final review + the submit behavior previously planned for `StepSixSubmit.tsx`) and `StepFiveComplete.tsx` (Step 5 confirm-core interstitial with **no** submission-boundary call) — details in T012/T013b
- [X] T030 [P] Extract the shared `src/features/onboarding/components/components/ReviewSummary.tsx` with `buildCoreRows`/`buildPreferencesRow` used by Steps 5 and 7 (details in T013c)
- [X] T031 Delete the superseded `StepFiveReview.tsx` and `StepSixSubmit.tsx`; rewire `onboarding-page.tsx` to the 7-step map with `totalSteps={7}` and `handleNext < 7` (details in T014/T015/T016)
- [X] T032 Update spec.md / plan.md / tasks.md / data-model.md / quickstart.md to the final 7-step flow and re-validate: `npm run lint`, `npm run build`, and HTTP smoke across `/en/onboarding` and `/ar/onboarding` (markers: "Step 1 of 7" / "الخطوة 1 من 7", "Choose Your Learning Preferences" / Arabic equivalent, "Review Your Choices" / Arabic equivalent, auth background). *(Marker values superseded by Phase 10 — "Step 1 of 6", single confirmation.)*

---

## Phase 10: Duplicate-Confirmation Fix (single-confirmation six-step flow)

**Purpose**: Regression fix and final step composition. Step 5 in the seven-step arrangement (`StepFiveComplete`) presented a core-answer confirmation, and step 7 (`StepSevenReview`) presented the full review — **two confirmations** on either side of Learning Preferences. This phase removes the pre-preferences confirmation so the flow is exactly six steps with **one** confirmation: 1 Domain → 2 Level → 3 Time → 4 Success Goal → 5 Learning Preferences → 6 Review/Confirmation (final, real submit). No duplicate state or render loop ever existed; the duplication was step ordering only. API contract, slice shape, i18n, validation, and preferences are untouched (spec.md Session 2026-09-14 duplicate-confirmation fix).

- [X] T101 [P] [US1] In `src/features/onboarding/components/pages/onboarding-page.tsx`: remove the `steps[5]` `StepFiveComplete` render block; renumber the render map to `5: StepSixLearningPreferences` and `6: reviewStep(onboarding.submitStatus)`; change the `OnboardingLayout` prop `totalSteps={7}` → `{6}`; keep `handleNext < 6`. The UI must render exactly one confirmation (step 6). Remove the now-unused `import { StepFiveComplete }` (FR-001/FR-019)
- [X] T102 [P] [US1] Delete `src/features/onboarding/components/StepFiveComplete.tsx` (dead after T101; the only remaining reference). Confirm no imports reference it. `stepSixTitle`/`stepSixDescription` keys become unreferenced — leave the keys in place for now
- [X] T103 [US2] In `src/features/onboarding/components/components/ReviewSummary.tsx`, `buildPreferencesRow` must target **step 5** (the preferences step) for its Edit action (was step 6); core rows stay Domain → 1, Level → 2, Time → 3, Goal → 4. Verify Edit from the step-6 summary lands on the correct owning step for every value (FR-014)
- [ ] T104 Update spec.md / plan.md / tasks.md / data-model.md / quickstart.md / contracts/onboarding-service.md / checklists/requirements.md to the single-confirmation six-step flow *(docs done)*, then re-validate: `npm run lint`, `npm run build`, and HTTP smoke across `/en/onboarding` and `/ar/onboarding` (markers: "Step 1 of 6" / "الخطوة 1 من 6", preferences title, single "Review Your Choices" / Arabic equivalent on step 6, and **no** "Ready to Start" / `stepSixTitle` anywhere in the flow) *(validation pending)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — baseline gate
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user stories (slice shape, dashboard parity, submission boundary, both locales)
- **User Stories (Phase 3+)**: All depend on Foundational
  - US1 (P1) is the MVP — implement and validate first
  - US2 (P1) depends on US1 (extends `ReviewSummary`/`StepSevenReview` + page wiring)
  - US3 (P2) depends on US1 (additive responsive/RTL assurance over new components)
  - US4 (P3) depends on US1 (a11y across all steps)
  - US5 (P3) depends on US1 (extends `StepSevenReview`)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — required first
- **US2 (P1)**: Extends T012/T013b/T014 — must run after US1
- **US3 (P2)**: Can proceed after US1; additive, no conflicts with US2–US5
- **US4 (P3)**: Can proceed after US1; additive
- **US5 (P3)**: Extends T013b — must run after US1 (before Polish)
- US3, US4, US5 are independent of each other and can run in parallel after US1

### Within Each User Story

- Components before page wiring (US1: T007–T013 before T014; US2: T015 before T016)
- Core implementation before integration
- Story complete before starting the next priority (except US3–US5 which are additive)

---

## Parallel Opportunities

- All Foundational tasks T004/T005/T006 (`[P]`) can run in parallel with each other, but T002 (slice) must complete first since it is read by every story
- T003 (dashboard read) can run in parallel with T002–T006
- All US1 component tasks T007–T013 marked `[P]` are different files and can run in parallel after Foundational
- T014 (page rewire) depends on T007–T013
- US3 (T017/T018) and US4 (T019/T020/T021) tasks are `[P]` where marked and can run in parallel once US1 is complete
- No two `[P]` tasks touch the same file

---

## Parallel Example: User Story 1

```bash
# Launch all US1 component tasks together (after Foundational):
Task: "T007 totalSteps=6 in OnboardingLayout.tsx"
Task: "T008 StepOneDomain.tsx rework"
Task: "T009 StepTwoSkillLevel.tsx level field"
Task: "T010 StepThreeTimeCommitment.tsx renumber"
Task: "T011 StepFourSuccessGoal.tsx renumber + drop summary"
Task: "T013 StepSixLearningPreferences.tsx base (dedicated preferences, renders step 5)"
Task: "T013b StepSevenReview.tsx base (final review + submit, renders step 6 — the single confirmation)"
Task: "T013c ReviewSummary.tsx shared summary + row builders"

# Then wire the flow:
Task: "T014 onboarding-page.tsx 6-step rework (depends on all of the above)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001 baseline)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (the six-step journey with a single, honest confirmation and a truthful submission state)
4. **STOP and VALIDATE**: run lint + build + quickstart scenarios A–E and G-19/G-20
5. Deploy/demo if ready — the MVP is a complete, truthful onboarding funnel

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. **US1** (P1) → journey completable, truthfully → Deploy/Demo (this is the MVP)
3. **US2** (P1) → review-step Edit navigation → Deploy/Demo
4. **US3** (P2) → responsive + RTL/LTR assurance → Deploy/Demo
5. **US4** (P3) → keyboard/AT/reduced-motion assurance → Deploy/Demo
6. **US5** (P3) → failure recovery + duplicate guard → Deploy/Demo
7. Polish → cleanup, lint, build, full quickstart validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T002 first, then T003–T006)
2. Once Foundational is done:
   - Developer A: US1 components (T007–T013)
   - Developer B: US1 page wiring (T014, after A's components land)
   - Developer C: after US1 lands, US3 (T017/T018)
   - Developer D: after US1 lands, US4 (T019/T020/T021)
3. US2 and US5 land after US1; Polish last

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to the user story for traceability
- Each user story is independently completable and testable (acceptance scenarios in spec.md, smoke matrix A–J in quickstart.md)
- No test tasks are generated because the project has no test runner and the spec does not request TDD (quickstart.md §"Validation order" is the verification plan)
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Commit after each task or logical group when the user requests a commit
- Constraint values (validation conditions, `OnboardingState` shape, submission result union) are quoted verbatim from data-model.md / contracts/onboarding-service.md — do not leave them to implementation-time discretion