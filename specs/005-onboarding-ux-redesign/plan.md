# Plan: Onboarding UX Redesign (005)

**Branch**: `005-onboarding-ux-redesign` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## Objective

Redesign the AI Mentor onboarding to the **single-confirmation 6-step flow** — 1-المجال Learning Domain → 2-المستوى Current Level → 3-الوقت Available Learning Time → 4-هدف النجاح Success Goal → 5- Learning Preferences (dedicated step, ≥1 required) → 6-التأكيد Review/Confirmation (the single, final confirmation; the real submission fires here) — satisfying every success criterion (SC-001..SC-008) and functional requirement (FR-001..FR-029) in `spec.md`. The flow contains exactly **one** confirmation (step 6, after Learning Preferences); the earlier seven-step arrangement with a pre-preferences confirm interstitial is superseded (spec.md Session 2026-09-14 duplicate-confirmation fix).

Frontend-only. **No** new persisted entities, **no** backend contract changes, **no** new dependencies. This feature reworks existing onboarding components, the onboarding Redux slice, and the i18n `onboarding` namespace; it defines a new frontend submission boundary (`onboardingService`) modeled on the auth feature's pattern.

## Design Context (from spec.md + Clarifications)

- **Step 1** collects a **free-text learning domain** (any subject; Reqs §2 categories are reference examples only, not a fixed list). The AI interprets the entered domain. No separate free-text "learning goal" field (J1).
- **Step 2** reuses current skill-level options (`beginner`, `some-experience`, `intermediate`) (J2-accepted spec defaults).
- **Step 3** reuses current time options (`15-30`, `30-60`, `1-2`, `weekends`, `custom` + description) (J2-accepted spec defaults).
- **Step 4** collects the success goal as free text.
- **Step 5 (Learning Preferences)** is a **dedicated** step: the **learning-preferences multi-select** (hands-on / video / reading / quizzes, ≥1 required) (FR-015).
- **Step 6 (Review/Confirmation)** is the final step and the flow's **single** confirmation: a **summary of every collected value** (the 4 core values + Learning Preferences) with per-value **Edit** actions, and the **single entry point for submission** (FR-014, FR-016..FR-019). It shows idle/loading/error/success states truthfully. On real success: brief confirmation → proceed to the roadmap creation/generation experience; **no** dashboard redirect, **no** success-only screen (J3). No confirmation or submit screen exists before step 6 (FR-001/FR-019).
- **Honesty principle (FR-019)**: no fabricated success, simulated delay, or fake data anywhere in this feature.

## Technical Context

### Stack and constraints
- Next.js App Router (create-next-app), React, TypeScript ^5.
- Redux Toolkit (`src/redux/store.ts`, `slices`).
- next-intl i18n (`messages/en.json`, `ar.json`; `useTranslations`/`useT`).
- Tailwind CSS v4 (CSS-first; `@theme` tokens in `src/app/globals.css`: `.input`, `.focus-ring`, `.progress-track`/`.progress-fill`, danger/primary tokens, reduced-motion global rule).
- framer-motion + lucide-react (existing dependencies).
- shadcn/ui — only `src/components/ui/card.tsx` is present; reuse it, never introduce a new UI library.
- **No test runner is configured**; validation = `npm run lint` + `npm run build` + manual smoke matrix.
- No environment variables are required by this feature.

### Existing onboarding implementation (current state, to be reworked)
| File | Current role |
|------|--------------|
| `src/features/onboarding/components/pages/onboarding-page.tsx` | Client page wiring: 5-step render map, `handleNext`/`handleBack` via `goToStep`, `handleGenerate` with a **3s simulated setTimeout** → `saveOnboardingData` + `completeOnboarding`, `isComplete` redirect to `/dashboard`, framer-motion step transitions. |
| `StepOneLearningGoal.tsx` | Free-text multiline input ("what to learn") with local error. |
| `StepTwoSkillLevel.tsx` | `OptionCard` list, 3 values, local error. |
| `StepThreeLearningPreferences.tsx` | `OptionCard` 2-col grid multi-select, ≥1 validation. |
| `StepFourTimeCommitment.tsx` | `OptionCard` list of 5 values + optional custom `InputField`. |
| `StepFiveSuccessGoal.tsx` | Free-text multiline input + **review summary Card** (`goal`/`level`/`time`/`style` label maps) + Continue labelled "Generate My Roadmap". |
| `RoadmapGeneration.tsx` | Animated "creating roadmap" screen (Brain icon + progress bar), rendered while `isGenerating`. |
| `components/ProgressIndicator.tsx` | `currentStep`/`totalSteps` props; step dots (parameterizable). |
| `components/StepNavigation.tsx` | `onBack`/`onContinue` + `continueLabel`/`canContinue`/`isLoading`. |
| `components/OptionCard.tsx` | Selectable card (title, description, selected check, motion). |
| `components/InputField.tsx` | Text input **and** multiline `<textarea>` modes. |
| `OnboardingLayout.tsx` | Wraps children with `ProgressIndicator`. |

### Onboarding Redux slice (current shape)
Fields: `currentStep`, `learningGoal`, `skillLevel`, `learningPreferences`, `timeCommitment`, `timeCustomDescription`, `successGoal`, `isComplete`, `isGenerating`, `roadmap`, `onboardingData`.

Actions: `goToStep`, `setOnboardingData`, `setIsGenerating`, `completeOnboarding` (persists `localStorage["ai-mentor-onboarding-complete"]`), `setRoadmap` (exported, currently never dispatched), `saveOnboardingData`, `resetOnboarding`.

Consumers:
- `onboarding-page.tsx` — answers + navigation + simulated generation.
- `dashboard-page.tsx` — reads `onboarding.roadmap` (always `null` today) and `onboarding.onboardingData?.learningGoal`.
- `auth-page.tsx` — redirects away from `/auth` when `onboarding.isComplete`.

### Route / layout
- Route: `src/app/[locale]/(main)/onboarding/page.tsx` (inside the `(main)` layout → global Navbar + ShellBackground + Footer).
- Route strings via `useRouter()` from `@/i18n/navigation`.

### i18n namespace
`onboarding` in `messages/en.json` (line 201+) and `ar.json` (line 201+). Current keys cover the 5 steps (`stepOneTitle`, `stepTwoTitle`, `stepThreeTitle`, `stepFourTitle`, `stepFiveTitle`, `*Error`, `*Description`, `*Placeholder`, value labels, `step`, `back`, `continue`, `loading`, `generateRoadmap`, `generatingTitle`, `generatingDescription`, `notSpecified`, etc.).

## Constitution Check

| Principle (`constitution.md`) | Applicable gates for this feature | Notes / plan response |
|-------------------------------|-----------------------------------|-----------------------|
| I — Security & Privacy | No new PII; no secrets; never log submission payloads | Onboarding answers stay in client Redux/localStorage as today; submission payload passed only to the frontend boundary; nothing persisted to logs. |
| II — Separation of responsibilities | Frontend-only feature; submission intent isolated from backend contract | `onboardingService` boundary (contracts/onboarding-service.md) separates UI from any future API; UI never calls a provider directly. |
| III — Data integrity | `onboardingSlice` is the single source of truth for answers; `isComplete` only ever set on real success | Remove the simulated 3s generation (`isGenerating`, `setTimeout`). `completeOnboarding()` runs only on a genuine adapter success. Never fabricated success (FR-019). |
| IV — Maintainability | Smallest vertical slice; reuse-first; no premature abstraction | Rework existing components/slice/i18n; new files limited to Step 5 preferences, Step 6 review, shared summary rows, and the service boundary. Pattern matches feature 002. |
| V — UI/UX consistency | Dark-first tokens; RTL/LTR; responsive; WCAG AA; reduced motion | All steps reuse `OptionCard`/`InputField`/`StepNavigation`/`ProgressIndicator`/shadcn `Card`; framer-motion transitions already respect `prefers-reduced-motion`. |
| VI — Testability | Honest observable states; no runner configured | Manual smoke matrix in quickstart.md; boundary contract testable via adapter mock (`not-connected`). Success path not E2E-verifiable until real integration (documented honestly). |
| VII — Documentation | Spec, plan, research, data-model, contract, quickstart all live in `specs/005-onboarding-ux-redesign/` | All artifacts generated in this phase. |
| VIII — Incremental delivery | Deferred items explicit | Backend integration/API client (004), numeric time/level mapping, roadmap-generation flow, reload/resume behavior → explicitly out of scope and noted in plan/quickstart. |

**Result of Constitution Check:** ✅ **PASS** — no principle conflicts; research.md R4/R8 and contracts/onboarding-service.md are the direct response to the honesty/dishonest-state principle (III).

## Project Structure

```
specs/005-onboarding-ux-redesign/
  spec.md               ← SOURCE OF TRUTH
  plan.md               ← this file
  research.md           ← Phase 0 design decisions (R1..R10)
  data-model.md         ← state/transition/validation model
  contracts/
    onboarding-service.md   ← submission boundary contract
  quickstart.md         ← smoke matrix + validation order
  checklists/requirements.md   ← 16/16 passing (spec)

src/                       ← implementation (Phase 2, via speckit tasks)
  redux/slices/
    onboardingSlice.ts         Rework: learningGoal→domain, skillLevel→level,
                               remove isGenerating + saveOnboardingData/onboardingData,
                               add submitStatus/submitError
  features/onboarding/
    components/
      OnboardingLayout.tsx         unchanged (receives totalSteps=6)
      StepOneDomain.tsx            rework StepOneLearningGoal → free-text domain (single line)
      StepTwoSkillLevel.tsx        value/onChange only; field rename to level
      StepThreeTimeCommitment.tsx  renumber of StepFourTimeCommitment
      StepFourSuccessGoal.tsx      renumber of StepFiveSuccessGoal; drop summary card
      StepSixLearningPreferences.tsx NEW: dedicated preferences multi-select (≥1); renders step 5
      StepSevenReview.tsx          NEW: full summary + Edit + final submit (idle/submitting/failed/succeeded); renders step 6 (the single final confirmation)
      RoadmapGeneration.tsx        preserved export; no longer rendered by onboarding flow
      components/{OptionCard,InputField,StepNavigation,ProgressIndicator}.tsx   reuse
      components/ReviewSummary.tsx NEW: shared dl summary + row builders for steps 5 and 6
    services/
      onboardingService.ts         NEW: submission boundary (not-connected adapter today)
  features/dashboard/...          one-line read change: onboarding.domain
  messages/en.json, ar.json       onboarding namespace: new/renamed/removed keys
```

## Phase Gates (from speckit template)

- **Phase 0 — Research (this plan)**: `research.md` documents R1..R10 (design decisions with alternatives and rationales). ✅ done in this phase.
- **Phase 1 — Building Blocks (this plan)**: `data-model.md`, `contracts/onboarding-service.md`, `quickstart.md`. ✅ done in this phase.
- **Phase 2 — Tasks**: `/speckit.tasks` splits the Implementation contract into runnable tasks (not produced here).

## Out of Scope (deferred explicitly)
- Backend routes/auth, real API client (spec `feature-sequence` note; features/004-frontend-api-integration).
- Numeric mapping of time/level to the API contract (`available_minutes_per_week`).
- The roadmap creation/generation flow itself (spec says out of scope).
- Reload/resume behavior for partial onboarding (existing Redux behavior preserved unchanged).