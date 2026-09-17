---

description: "Task list for Frontend API Integration"
---

# Tasks: Frontend API Integration

**Input**: Design documents from `/specs/006-frontend-api-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-client.md, quickstart.md

**Tests**: Included. Not explicitly requested in spec.md (correctly, since it stays implementation-agnostic), but `research.md` §1 made test tooling a load-bearing resolution of the constitution's Principle IX gate for this security- and concurrency-sensitive feature, and `quickstart.md`'s sign-off criteria require the Vitest and Playwright suites to exist and pass. Scope is calibrated to what was actually decided — MSW-mocked tests for the hard concurrency/security behaviors named in FRs, component tests for each story's critical behavior, and one Playwright smoke test for the full journey — not a full contract-test-per-endpoint regime.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) to enable independent implementation and testing of each.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3, mapping to spec.md's user stories
- File paths are exact and relative to the repository root (`my-app/`)

## Path Conventions

Single project (existing Next.js frontend), per `plan.md`'s Project Structure:
`src/lib/api/` (new API client layer), `src/redux/slices/` (reshaped), `src/features/{auth,onboarding,dashboard}/` (existing screens, rewired), `tests/` (new).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test tooling and environment scaffolding decided in `research.md` §1 — nothing here exists in the repo yet.

- [ ] T001 Install test devDependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@playwright/test`) and add `test` / `test:e2e` scripts to `package.json`, per `research.md` §1 and the commands `quickstart.md` expects.
- [ ] T002 [P] Create `vitest.config.ts` wired to the existing Next.js 16 / React 19 / TypeScript-strict setup.
- [ ] T003 [P] Create `playwright.config.ts` pointing at the local dev server (`http://localhost:3000`) and expecting a local backend at `http://localhost:8000/api/v1`, per `quickstart.md` Prerequisites.
- [ ] T004 [P] Create `.env.local.example` at the repo root documenting `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1` — no env files currently exist in this repo (`API_CONTRACT.md` §1).
- [ ] T005 [P] Scaffold MSW request handlers (`tests/msw/handlers.ts`) and server setup (`tests/msw/server.ts`) matching `API_CONTRACT.md`'s `{data, meta}` / `{error, meta}` envelope shapes, reused by every story's test suite.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared API-client layer (`contracts/api-client.md`) every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create `src/lib/api/apiSlice.ts` — RTK Query `createApi` base slice using `fetchBaseQuery` with `baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL`; set `Accept: application/json` on every request and `Content-Type: application/json` on body-bearing requests (`API_CONTRACT.md` §1, `contracts/api-client.md` "Base setup").
- [ ] T007 [P] Implement `src/lib/api/errors.ts` — the `ApiError` interface (`code`, `message`, `details?`, `requestId`, `category`) and the `error.code` → `category` mapping table covering all rows of `API_CONTRACT.md` §2's common-error-code table (`401 unauthenticated`, `403 forbidden`, `404`, `409`, `422 validation_failed`, `429 too_many_requests`, `503 authentication_service_unavailable`, `500 internal_error`), defaulting unrecognized codes to `category: "unexpected"` (FR-018).
- [ ] T008 Implement `src/lib/api/auth.ts` — module-level in-memory token store (`accessToken`, `refreshToken`, `expiresAt`; never Redux, never `localStorage`/`sessionStorage`/URL — FR-007) plus a `baseQueryWithReauth` wrapper around T006's base query that: keeps exactly one refresh in flight at a time, queuing/reusing that same in-flight promise for any other request that fails on an expired session (FR-003); on success, atomically replaces both tokens before retrying the original request once, and never re-enters a refresh loop (FR-004); on refresh failure (invalid/expired/revoked/reused credential), clears the token store and reports unauthenticated (FR-005). Depends on T006.
- [ ] T009 [P] Implement `src/lib/api/idempotency.ts` — `createIdempotencyKey()` generating a key matching `API_CONTRACT.md` §14's format (8–128 safe ASCII characters matching letters/numbers/`.`/`_`/`:`/`-`, starting with a letter or number) (FR-012).
- [ ] T010 Wire a bounded-retry policy into `src/lib/api/apiSlice.ts` using RTK Query's `retry` util: applied only to query (read) endpoints with a small bounded count and brief backoff; mutation (write) endpoints MUST NOT retry automatically and must surface a manual retry option on failure instead (FR-021). Depends on T006.
- [ ] T011 Wire `apiSlice.reducer` and `apiSlice.middleware` into `src/redux/store.ts`. Depends on T006.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Account access (register, login, session refresh, logout) (Priority: P1) 🎯 MVP

**Goal**: A visitor can register or sign in, stay signed in across a silent token refresh, and sign out cleanly — the prerequisite for every other story.

**Independent Test**: Register a new account, sign out, sign back in, and continue using the app past the access token's normal lifetime (triggering at least one silent refresh) — delivers a working session on its own.

### Tests for User Story 1 ⚠️

> Write these tests FIRST; confirm they FAIL before the implementation tasks below.

- [ ] T012 [P] [US1] MSW+Vitest test: concurrent requests that all fail on an expired token trigger exactly one `/auth/refresh` call, not one per request, in `tests/unit/api/auth.refresh.test.ts` (FR-003).
- [ ] T013 [P] [US1] MSW+Vitest test: after a successful refresh both tokens are replaced together, the original request is retried exactly once, and a second consecutive `401` does not cause an infinite refresh loop, in `tests/unit/api/auth.refresh.test.ts` (FR-004).
- [ ] T014 [P] [US1] MSW+Vitest test: `POST /auth/login` with a wrong password and with a non-existent email both resolve to the same generic `422 validation_failed` outcome, in `tests/unit/api/auth.errors.test.ts` (FR-002).
- [ ] T015 [P] [US1] Component test: triggering sign-out clears `isAuthenticated`/`user` state immediately even when the `POST /auth/logout` MSW handler is set to fail, in `tests/component/auth/logout.test.tsx` (FR-006).

### Implementation for User Story 1

- [ ] T016 [US1] Reshape `src/redux/slices/authSlice.ts`: delete the `loadAuth()` `localStorage` read, the fake `login`/`register` `createAsyncThunk`s, and the `ai-mentor-auth` persistence; keep only derived `isAuthenticated: boolean` and `user` (per `data-model.md` User table) sourced from RTK Query endpoints (`useRegisterMutation`, `useLoginMutation`, `useLogoutMutation`, `useGetMeQuery`) injected into `apiSlice`. Depends on T008, T011.
- [ ] T017 [P] [US1] Wire `src/features/auth/components/RegisterForm.tsx` to `useRegisterMutation`; map `422 validation_failed` field errors (`name` ≤120 chars, `email` ≤255 chars unique, `password` ≥8 chars, `password_confirmation` must match, extra fields rejected — `API_CONTRACT.md` §6) to the form via T007's error mapping. Depends on T016.
- [ ] T018 [P] [US1] Wire `src/features/auth/components/LoginForm.tsx` to `useLoginMutation`, surfacing FR-002's single generic invalid-credentials message (never distinguishing wrong password from no account). Depends on T016.
- [ ] T019 [P] [US1] Wire the sign-out control (`src/shared/components/layout/navbar/Navbar.tsx`) to `useLogoutMutation`; clear local auth state in the `onQueryStarted` handler before awaiting the response, and again on failure, per FR-006. Depends on T016.
- [ ] T020 [US1] In `src/features/auth/components/pages/auth-page.tsx`, after a successful register/login trigger `useGetMeQuery` then `useGetOnboardingStatusQuery` and route to the screen matching current state (not always the same landing screen — spec US1 Acceptance Scenario 2). Depends on T017, T018.
- [ ] T021 [US1] In `src/features/auth/components/pages/auth-page.tsx`, confirm newly registered accounts show default preferences (`ui_locale=en`, `resource_language=both`, `timezone=UTC` — `API_CONTRACT.md` §6) via `useGetPreferencesQuery` immediately after registration. Depends on T020.

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Complete onboarding before unlocking roadmap generation (Priority: P2)

**Goal**: A signed-in user with incomplete onboarding sets preferences and a learning profile, and roadmap generation unlocks only once the server reports onboarding complete.

**Independent Test**: Sign in as a user with incomplete onboarding, fill in preferences and a learning profile, and confirm the onboarding-complete state is reached and roadmap generation becomes available.

### Tests for User Story 2 ⚠️

- [ ] T022 [P] [US2] MSW+Vitest test: a `404 user_preferences_not_found` response resolves to "preferences missing" (not a thrown/unhandled error), in `tests/unit/api/preferences.test.ts` (FR-022).
- [ ] T023 [P] [US2] MSW+Vitest test: a second `PUT /me/learning-profile` fully replaces the first save's values rather than merging them, in `tests/unit/api/learningProfile.test.ts` (FR-010).
- [ ] T024 [P] [US2] Component test: the missing-onboarding-information UI reflects exactly the `missing_fields` array from `GET /me/onboarding-status`, in `tests/component/onboarding/status.test.tsx` (FR-008).

### Implementation for User Story 2

- [ ] T025 [US2] Reshape `src/redux/slices/onboardingSlice.ts`: delete `domain`/`level`/`timeCommitment`/`timeCustomDescription`/`successGoal`/`learningPreferences`/`roadmap` fields and the `ai-mentor-onboarding-complete` `localStorage` flag; replace with RTK Query endpoints (`useGetPreferencesQuery`, `useUpdatePreferencesMutation`, `useGetLearningProfileQuery`, `usePutLearningProfileMutation`, `useGetOnboardingStatusQuery`) per `data-model.md`'s Preferences / Learning Profile / Onboarding Status tables. Depends on T008, T011.
- [ ] T026 [P] [US2] Create/wire `src/features/onboarding/components/PreferencesStep.tsx` to `useUpdatePreferencesMutation`, sending only the fields the user actually changed (`ui_locale`: `ar`|`en`, `resource_language`: `ar`|`en`|`both`, `timezone`: IANA string ≤64 chars — `API_CONTRACT.md` §11). Depends on T025.
- [ ] T027 [P] [US2] Reshape the onboarding screens in `src/features/onboarding/components/` to the real learning-profile schema: `goal` (≤1000 chars, required), `self_assessed_level` (`complete_beginner`|`some_experience`|`intermediate`, required), `desired_outcome` (≤2000 chars, required), `available_minutes_per_week` (integer, 15–10080, required), `preferred_learning_methods` (1–4 unique values from `hands_on_projects`|`reading_docs`|`video_walkthroughs`|`quizzes_drills`, required) — all five required, extra fields rejected — wired to `usePutLearningProfileMutation` (FR-010). Depends on T025.
- [ ] T028 [P] [US2] Create `src/features/onboarding/components/OnboardingStatus.tsx`, the missing-onboarding-information display driven by `useGetOnboardingStatusQuery().missingFields`, including the legacy-preferences-404 case routed through the same path (FR-008, FR-022). Depends on T025.
- [ ] T029 [US2] Gate every "Generate roadmap" entry point in `src/features/dashboard/` behind `onboardingStatus.completed === true`; ensure `useUpdatePreferencesMutation`/`usePutLearningProfileMutation` invalidate the `OnboardingStatus` RTK Query tag so completion re-checks without a full page reload (FR-011). Depends on T026, T027, T028.

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Generate and view a learning roadmap (Priority: P3)

**Goal**: A user with completed onboarding requests a roadmap, watches it move to a terminal state, and views the resulting read-only roadmap.

**Independent Test**: Sign in as a user with completed onboarding, request a roadmap, observe the status change from queued/running to succeeded, and view the resulting roadmap content.

### Tests for User Story 3 ⚠️

- [ ] T030 [P] [US3] MSW+Vitest test: retrying the same generation attempt after a simulated timeout reuses the same idempotency key and does not create a second job; a brand-new click uses a new key; a `409 roadmap_generation_in_progress` response is handled via its `generation_request_id`, in `tests/unit/api/generation.test.ts` (FR-012, FR-013).
- [ ] T031 [P] [US3] MSW+Vitest test: polling stops immediately once a terminal status (`succeeded`/`failed`/`cancelled`) is returned and never issues a further status request afterward, in `tests/unit/api/generation.polling.test.ts` (FR-014).
- [ ] T032 [P] [US3] MSW+Vitest test: each recognized `failure_code` maps to its specific friendly explanation, and an unrecognized code falls back to the generic explanation, in `tests/unit/api/generation.errors.test.ts` (FR-023).
- [ ] T033 [P] [US3] Component test: a roadmap renders its stages, tasks, and each task's resources in `position` order, and every task-level action control renders disabled, in `tests/component/roadmap/view.test.tsx` (FR-017).

### Implementation for User Story 3

- [ ] T034 [US3] Add `useRequestRoadmapGenerationMutation`, `useGetGenerationStatusQuery`, and `useGetRoadmapQuery` endpoints to `src/lib/api/apiSlice.ts` per `contracts/api-client.md`. Depends on T006, T009.
- [ ] T035 [US3] Create `src/features/dashboard/hooks/useGenerateRoadmap.ts`: the "Generate roadmap" action handler — generate one idempotency key per click via `createIdempotencyKey()` (T009), hold it for the attempt's lifetime, and reuse it only for an automatic retry of that same attempt, never for a new click (FR-012). Depends on T034.
- [ ] T036 [US3] Create `src/features/dashboard/hooks/useRoadmapGenerationPolling.ts`: a backoff-polling hook wrapping `useGetGenerationStatusQuery` — `pollingInterval` starts near 1000ms, steps to ~2500ms after the first couple of polls, and is set to `0` the instant a terminal status is observed (`research.md` §4, FR-014). Depends on T034.
- [ ] T037 [US3] In `src/features/dashboard/hooks/useRoadmapGenerationPolling.ts`, implement a bounded polling timeout with a "check again" action that re-fetches status without itself creating a new generation request (FR-015). Depends on T036.
- [ ] T038 [US3] In `src/features/dashboard/hooks/useGenerateRoadmap.ts`, handle `409 roadmap_generation_in_progress`: read `error.details.generation_request_id` and resume polling that request instead of erroring out (`API_CONTRACT.md` §14, FR-013). Depends on T035.
- [ ] T039 [US3] In `src/features/dashboard/hooks/useRoadmapGenerationPolling.ts`, on `succeeded` status automatically navigate to the roadmap via `roadmap_id` (FR-016). Depends on T036.
- [ ] T040 [P] [US3] Implement the read-only roadmap view in `src/features/dashboard/components/RoadmapView.tsx`: render stages → tasks → resources ordered by `position` per `data-model.md`'s Roadmap/Stage/Task/Resource tables; render task completion/skip controls disabled since no backend capability exists yet to act on them (FR-017). Depends on T034.
- [ ] T041 [US3] Create `src/features/dashboard/components/RoadmapGenerationFailure.tsx`: the failure-state UI using T007's `errors.ts` failure-code mapping (T032's decided behavior) — specific explanation for recognized codes, generic fallback otherwise, plus a retry action that calls T009's generator for a **new** idempotency key (FR-023, FR-012). Depends on T036, T009.
- [ ] T042 [US3] In `src/lib/api/apiSlice.ts`'s `useGetGenerationStatusQuery`/`useGetRoadmapQuery` error handling, handle `404` on `GET /roadmap-generation-requests/{id}` and `GET /roadmaps/{id}` identically for "not found" and "belongs to someone else," with no distinguishing detail shown (FR-020). Depends on T034.

**Checkpoint**: All three user stories are independently functional; the full P1 → P2 → P3 journey works end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and hardening that spans multiple stories.

- [ ] T043 [P] In `src/lib/api/apiSlice.ts`, confirm `useGetMeQuery`, `useGetPreferencesQuery`, `useGetLearningProfileQuery`, and `useGetRoadmapQuery` all inherit T010's read-only retry policy rather than opting out (FR-021).
- [ ] T044 [P] Run `npm run lint` across `src/lib/api/`, `src/redux/slices/`, and `src/features/{auth,onboarding,dashboard}/`, and fix any violations introduced by this feature.
- [ ] T045 Author the Playwright smoke test `tests/e2e/primary-journey.spec.ts`, automating `quickstart.md` Scenario 1 → 2 → 3 (register → complete onboarding → generate → view roadmap) end-to-end against a real local backend.
- [ ] T046 Execute the three manual validation scenarios in `specs/006-frontend-api-integration/quickstart.md` against a real local backend and confirm every "Expect" outcome and the Sign-off criteria pass.
- [ ] T047 Audit `src/lib/api/auth.ts` and the reshaped `authSlice.ts`/`onboardingSlice.ts` to confirm no token value is ever written to `localStorage`, `sessionStorage`, a URL, a log statement, or an analytics/error report, and that the old `ai-mentor-auth` / `ai-mentor-onboarding-complete` `localStorage` keys are gone entirely (FR-007).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completing (test/env scaffolding) — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completing. US2 and US3 are additionally sequenced by product logic (US3 needs onboarding-complete, which US2 delivers) even though each phase is independently testable in isolation with appropriate fixtures.
- **Polish (Phase 6)**: Depends on the user stories it verifies being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. No dependency on other stories.
- **User Story 2 (P2)**: Starts after Foundational. Independently testable with a pre-authenticated test fixture; in the real product flow it follows US1.
- **User Story 3 (P3)**: Starts after Foundational. Independently testable with a pre-onboarded test fixture; in the real product flow it follows US2.

### Within Each User Story

- Tests are written first and must fail before the implementation tasks below them.
- Slice reshape before UI wiring (T016 before T017–T021; T025 before T026–T029).
- Endpoint additions before the handlers/hooks that call them (T034 before T035–T042).

### Parallel Opportunities

- T002–T005 (Setup) in parallel once T001 completes.
- T007 and T009 (Foundational) in parallel with each other.
- All 4 test tasks within each story phase (T012–T015, T022–T024, T030–T033) in parallel.
- T017, T018, T019 (US1) in parallel once T016 completes.
- T026, T027, T028 (US2) in parallel once T025 completes.
- T040 (US3 roadmap view) in parallel with T035–T039/T041–T042, since it touches a separate component.

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (after Phase 2 is complete):
Task: "MSW+Vitest test: single in-flight refresh in tests/unit/api/auth.refresh.test.ts"
Task: "MSW+Vitest test: atomic token replace + no infinite loop in tests/unit/api/auth.refresh.test.ts"
Task: "MSW+Vitest test: generic login failure message in tests/unit/api/auth.errors.test.ts"
Task: "Component test: sign-out clears state despite network failure in tests/component/auth/logout.test.tsx"

# Once T016 (authSlice reshape) is done, launch these together:
Task: "Wire RegisterForm.tsx to useRegisterMutation"
Task: "Wire LoginForm.tsx to useLoginMutation"
Task: "Wire sign-out control to useLogoutMutation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` Scenario 1 against a real local backend
5. This alone replaces the mocked auth with the real API — a legitimate, demoable increment even before onboarding/roadmap work begins

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → real authentication working (MVP)
3. Add User Story 2 → validate independently → real onboarding gating working
4. Add User Story 3 → validate independently → full generate-and-view journey working
5. Phase 6 polish, then full `quickstart.md` sign-off

### Parallel Team Strategy

With multiple developers: complete Setup + Foundational together first (Foundational is a shared, tightly-coupled API-client layer — splitting it further than T006–T011 is not recommended given how small it is). Once done, one developer per story (US1, US2, US3) can proceed in parallel, since each story phase above is scoped to its own files with dependencies made explicit in each task's "Depends on" note.

---

## Notes

- [P] tasks touch different files and have no incomplete-task dependency.
- Every FR-XXX / SC-XXX reference above traces directly to `spec.md`; every field constraint traces to `API_CONTRACT.md` and `data-model.md` — implementation should not need to re-derive either.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
- Avoid: skipping the Foundational phase, letting a story's implementation start before its tests are written and failing, touching files outside a task's stated path.
