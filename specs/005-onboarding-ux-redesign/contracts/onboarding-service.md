# Contract: Frontend Onboarding Submission Boundary

**Branch**: `005-onboarding-ux-redesign` | **Date**: 2026-09-13 | **Spec**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md) | **Research**: [research.md](../research.md) R4

## 1. Purpose

Defines the single frontend boundary for the **Step-7** submission operation (the final Review/Confirmation step holds the submit CTA; Steps 5 and 6 do not call this boundary). It is the mechanism behind the submit lifecycle required by **FR-016**, **FR-018**, and **FR-019** and the future home of the real backend call once the API integration exists.

This contract is **frontend-only**. It documents what Step 6 (the single final Review/Confirmation) may call and what it must render for each result. It deliberately does **not** define or assume any backend endpoint, payload, `PUT /me/learning-profile` encoding, error schema, retry/idempotency policy, or provider SDK — those are defined entirely during the Backend Integration phase (`features/004-frontend-api-integration` / `research.md` deferred items).

## 2. Principles (Constitution + spec)

1. **No fabricated success.** The adapter never fakes a success, delay, or failure. Today it resolves `not-connected`; a fabricated `succeeded` state must not be reachable (FR-019, Constitution III).
2. **No provider/API coupling in UI.** `StepSevenReview` (renders step 6) depends on this boundary module, never on endpoints, encodings, or SDKs (Constitution II).
3. **Answers are provided by the slice, not the adapter.** The boundary receives a frozen `OnboardingData` snapshot; it does not own or mutate `OnboardingState` (Constitution III).
4. **`not-connected` is an explicit, observable state.** The UI renders the localized unavailable message; answers remain in the slice for Retry (FR-018).
5. **No assumed backend contracts.** The result union carries no assumptions about request payloads, response schemas, HTTP semantics, or success/error encodings. All of it is undefined until the integration phase.

## 3. Interface

Implemented in `src/features/onboarding/services/onboardingService.ts`.

```ts
// Reuses the OnboardingData snapshot shape from the onboarding slice
// (data-model.md §3): { domain, level, timeCommitment,
//   timeCustomDescription, successGoal, learningPreferences }

interface OnboardingSubmitResult {
  status: "not-connected"
  // Full result shape undefined — defined entirely during the Backend Integration phase
}

interface OnboardingService {
  /** Submits the onboarding answers. Today: resolves not-connected. */
  submitOnboarding(answers: OnboardingData): Promise<OnboardingSubmitResult>
}
```

### Notes on the interface

- The result is a discriminated union whose only member today is `not-connected`. Future members (e.g., `success`, `error`, `rate-limited`) are intentionally undefined here.
- The method is async so callers must handle the promise lifecycle; Step 6 toggles `submitStatus` around the awaited call.
- No user/session/roadmap entity crosses this boundary today; `roadmap` and `isComplete` stay owned by the redux slice.

## 4. Adapter behavior today (2026-09-13)

| Operation | Implementation | Return | UI rendering (Step Six Submit) |
|-----------|----------------|--------|--------------------------------|
| `submitOnboarding` | `async () => ({ status: "not-connected" })` | `not-connected` | `submitStatus` → `"failed"`, `submitError` = `stepSixErrorNotConnected` → localized error Card + Retry; **no** `saveOnboardingData` / `completeOnboarding` call; no fake success. |

## 5. Future backend swap (documented, NOT implemented here)

When the external backend is integrated:

1. Replace the adapter body behind the same interface (call the real API defined in the integration phase).
2. Define the complete result union as part of that phase — nothing is assumed here.
3. Step 6 changes only to render the newly returned statuses; the boundary file, contract, and state flow remain.

**Out of scope / undefined here**: `PUT /me/learning-profile` payload, `goal`/`desired_outcome`/`self_assessed_level` vs `domain`/`language` mapping, numeric `available_minutes_per_week` derivation, HTTP status handling, retry policies, idempotency. All deferred to Backend Integration (research deferred items).

## 6. Consumers
- `src/features/onboarding/components/StepSevenReview.tsx` → `submitOnboarding(answers)` (drives `submitStatus` idle → submitting → failed/`not-connected`).

- `src/features/onboarding/components/pages/onboarding-page.tsx` → builds the `OnboardingData` snapshot from the slice for Step 6.

## 7. Testability (today)

The contract is exercised by mocking the adapter at the UI test seam:
- **`not-connected`** → assert `submitStatus === "failed"` + `submitError` set + no `isComplete` change.
- **Refusal to fake success** → assert the adapter has no code path that resolves `succeeded` in this feature.

These verifications run in the manual smoke matrix (quickstart.md); no automated runner is configured.