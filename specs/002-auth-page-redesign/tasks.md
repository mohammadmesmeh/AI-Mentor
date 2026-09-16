---

description: "Task list for Auth Page Redesign feature implementation"
---

# Tasks: Auth Page Redesign (/auth Sign In)

**Input**: Design documents from `/specs/002-auth-page-redesign/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/auth-service.md`, `quickstart.md`

**Tests**: Manual, per the smoke matrix in `quickstart.md`. No automated test framework is configured in this project, and none is requested by this feature — test tasks are therefore NOT generated. Each story includes independent (manual) test criteria.

**Architectural boundary (frontend-only)**: Frontend Auth Redesign → existing Redux/localStorage mock for email/password → minimal frontend boundaries for Google OAuth and password recovery (`{ status: "not-connected" }`) → real backend integrated in a later Backend Integration phase. No backend implementation, API endpoints, request/response schemas, OAuth callbacks, session/token contracts, provider SDKs, database, or backend framework is created, modified, inspected, or assumed in this feature.

**Git**: All Git operations (branch, status, commit, push) are performed separately by the user. NO task in this file performs or verifies Git operations.

**Validation**: Validation is USER-run. The agent performs no shell/validation commands; the final phase instructs the user how to run the existing checks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router frontend: paths under `src/`.
- No backend work in this feature (OS-001). Do not create or modify anything under `Backend/`.
- New directories (`social/`, `recovery/`, `services/`) are created implicitly by the tasks that add their first source file — no standalone scaffolding tasks.

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The UI view types and the minimal frontend boundary that user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Extend `src/features/auth/types/auth.types.ts` with the UI view types per `data-model.md` §3: `AuthViewMode` with literal values `"sign-in" | "create-account" | "recovery"` and `PasswordVisibility` with literal values `"mask" | "reveal"` (UI-local, non-persisted state)
- [x] T002 [P] Create `src/features/auth/services/authService.ts` as a MINIMAL frontend boundary for capabilities not connected in this phase, per `contracts/auth-service.md`: exactly two methods — `signInWithGoogle(): Promise<GoogleSignInResult>` and `requestPasswordReset(email: string): Promise<PasswordResetResult>` — both resolving `{ status: "not-connected" }`, with both result types declared inline. Do NOT wrap or replace the existing Redux `login`/`register` thunks. Do NOT define or assume any backend endpoints, payloads, sessions, tokens, OAuth callback routes, response schemas, or provider SDKs (SR-002, SR-004, contracts principle 5)
- [x] T003 [P] Enhance `src/features/auth/components/FormField.tsx` to associate the label and the error text with the child input via `id` / `htmlFor` / `aria-describedby` (AR-001, AR-004: "Field-level and error messages MUST be visible text and, where feasible, associated with the receiving control"), preserving the existing `space-y-2 text-start` structure and styling

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 2: User Story 1 - Returning user signs in (Priority: P1) — MVP

**Goal**: The redesigned two-column `/auth` page renders (theme-aware, RTL-safe) and a returning user completes sign-in through the existing mock-backed login flow with the existing redirect behavior.

**Independent Test** (per spec): Load `/en/auth`; the redesigned page renders with no redirect loop while unauthenticated. Submit valid mock credentials (localStorage `ai-mentor-auth`); the existing login flow succeeds and redirects to `/dashboard` (or `/onboarding` when onboarding is incomplete) in the same locale. Repeat on `/ar/auth`.

### Implementation for User Story 1

- [x] T004 [P] [US1] Rework `src/features/auth/components/pages/auth-page.tsx` into the two-column responsive scaffold per DR-003/DR-005 and `research.md` R1: brand/ambient panel + form panel on desktop (≥1024px), stacked single column with form FIRST in reading order below the breakpoint, using ONLY logical layout properties (`start`/`end`, `ps-`/`pe-`, `text-start`) and theme-aware tokens (`bg-card`/surface, `text-foreground`, `text-muted-foreground`) — no global token or theme changes (DR-001/DR-005); reuse `Container` and `FadeInView`; reuse the existing brand asset used in the Navbar pattern (DR-006); optional ambient decoration ONLY via existing utilities (e.g., `dark-section`, existing glow patterns) respecting `motion-reduce` (DR-007). Preserve the existing already-authenticated `useEffect` redirect to `/dashboard` when `onboarding.isComplete` else `/onboarding` (FR-003). Keep the `(auth)` route-group layout with no global navbar/footer (FR-001)
- [x] T005 [P] [US1] Rework `src/features/auth/components/AuthForm.tsx` into the view controller per `research.md` R4: local `viewMode: AuthViewMode` state defaulting to `"sign-in"`, dispatch the existing `clearError()` on every view switch (FR-004, edge case: "clearError() on view switch must be preserved"), render the existing sign-in view for mode `"sign-in"`; no route change (FR-006, OS-002)
- [x] T006 [P] [US1] Rework `src/features/auth/components/LoginForm.tsx` into the redesigned sign-in view: KEEP unchanged the existing `useForm` + `yupResolver(loginSchema)` wiring, the existing `autoComplete` semantics on the inputs (FR-002), the existing localized error render from `auth.errors.*` above the submit button (FR-004, AR-004), the existing localized loading state with the button disabled against duplicates, and submission through the existing Redux `login` thunk with the existing `onSuccess` callback behavior (IB-001, FR-002). Do NOT introduce a parallel auth mechanism or change the mock-backed behavior (SR-005)
- [x] T007 [US1] Add the page heading hierarchy to `src/features/auth/components/pages/auth-page.tsx` per DR-004 using the approved prototype copy — main heading "AI Mentor Access", subtitle "Sign In To Your Portal". Render via the `auth` namespace (e.g., new `accessTitle` / `accessDescription` keys added to `messages/en.json` and `messages/ar.json` with correct Arabic translations); reuse the existing `welcomeTitle` / `welcomeDescription` keys ONLY if their current content already matches these strings. Use existing `text-heading-*` / `text-muted-foreground` utilities; no new fonts or global tokens (DR-004, IR-001)

**Checkpoint**: US1 fully functional and independently testable (spec "Independent Test" above). MVP scope stop-point.

---

## Phase 3: User Story 2 - User with invalid or missing credentials (Priority: P2)

**Goal**: Validation errors, rejected-credential errors, and the in-flight loading state survive the redesign exactly as today.

**Dependency**: Depends on US1 (T006 reworks the sign-in view this story's feedback renders in). Permitted US2-to-US1 ordering means the user-visible behavior is pre-existing; this story's implementation value is i18n completeness. The user validates behavior per `quickstart.md` scenario B — no redundant verification task is generated.

**Independent Test** (per spec): On the redesigned sign-in view, submit an invalid email and a password below the minimum length → inline localized validation messages from the existing schema, no request fired. Submit unknown credentials → existing localized `auth.errors.*` above the submit button, user can retry.

### Implementation for User Story 2

- [x] T008 [US2] Ensure the redesigned sign-in view's feedback keys exist in `messages/en.json` and `messages/ar.json` — field validation reuse via existing `validation.*` keys (e.g., `emailRequired`, `invalidEmail`, `passwordRequired`, `passwordMin`) and errors via the existing `auth.errors.*`; add only whatever is missing; zero hardcoded user-facing strings (IR-001, SC-003)

**Checkpoint**: Sign-in fails properly and never blocks the entry path.

---

## Phase 4: User Story 3 - First-time user reaches account creation (Priority: P2)

**Goal**: "Create an account" cross-link switches to the existing registration view within the same `/auth` page (no new route); the existing register flow is preserved unchanged.

**Dependency**: Depends on US1 (T005 view controller hosts the switch). The `AuthForm.tsx` file is shared with US4 — apply T009 and the US4 `AuthForm` task sequentially, not in parallel.

**Independent Test** (per spec): From the sign-in view, activate "Create an account" → account-creation view renders the existing registration form (no route change); fill and submit → existing register flow validates and authenticates per the mock flow.

### Implementation for User Story 3

- [x] T009 [US3] Wire the "Create an account" cross-link in `src/features/auth/components/AuthForm.tsx`: a native-semantics control (no bare `div`) with a localized label that sets `viewMode` to `"create-account"` and dispatches `clearError()` (FR-006, US3/AS1, AR-006); render the EXISTING `RegisterForm` component unchanged for mode `"create-account"` — preserve its existing fields, validation, submission behavior (the Redux `register` thunk), and `autoComplete` semantics exactly (FR-002, OS-001)
- [x] T010 [US3] Add localized view-switch link strings (e.g., `createAccount`, `backToSignIn`) to the `auth` namespace in `messages/en.json` and `messages/ar.json` (IR-001/IR-002, SC-003)

**Checkpoint**: Registration reachable via the cross-link with unchanged behavior.

---

## Phase 5: User Story 4 - Password recovery view via future backend boundary (Priority: P2)

**Goal**: "Forgot your password?" opens a real recovery view; submitting today resolves the boundary to `not-connected` and shows the localized "integration not available" state — never a simulated success.

**Dependency**: Depends on US1 (T005 controller) and Foundation (T002 `authService`). The `AuthForm.tsx` file is shared with US3 — apply the US4 `AuthForm` task sequentially after T009.

**Independent Test** (per spec): From the sign-in view, activate "Forgot your password?" → recovery view with an email field and localized submit; submit → the `requestPasswordReset` adapter returns `{ status: "not-connected" }` and the localized unavailable message is shown; auth state unchanged.

### Implementation for User Story 4

- [x] T011 [P] [US4] Create `src/features/auth/components/recovery/RecoveryView.tsx`: an email field via the existing `FormField`, a localized submit action, and a submit handler that calls `authService.requestPasswordReset(email)`; on a `{ status: "not-connected" }` result render the localized "integration not available" message and MUST NOT claim a password reset email was sent (FR-012, SR-003); MUST NOT mutate auth state (SC-008)
- [x] T012 [US4] Wire the "Forgot your password?" link in `src/features/auth/components/AuthForm.tsx`: a native-semantics control with a localized label that sets `viewMode` to `"recovery"` and dispatches `clearError()` (FR-006, AR-006); render `RecoveryView` for mode `"recovery"`
- [x] T013 [US4] Add recovery-view strings (e.g., `forgotPassword`, `recoveryTitle`, `recoveryDescription`, `requestReset`, `resetUnavailable`) to the `auth` namespace in `messages/en.json` and `messages/ar.json` (IR-001/IR-002, SC-003)

**Checkpoint**: Recovery entry point delivered without a fake-success path.

---

## Phase 6: User Story 5 - Google sign-in button via future backend boundary (Priority: P2)

**Goal**: The prototype's "Sign in with Google" button is rendered and wired to the `authService` boundary; activating it today shows the localized "integration not available" state and never fakes sign-in.

**Dependency**: Depends on US1 (T006 sign-in view) and Foundation (T002 `authService`). The `LoginForm.tsx` file is shared with US6 — apply T015 before the US6 toggle task, not in parallel.

**Independent Test** (per spec): Activate "Sign in with Google" → boundary invoked, localized "integration not available" message shown; inspecting auth state shows NO mutation; user remains on the sign-in view.

### Implementation for User Story 5

- [x] T014 [P] [US5] Create `src/features/auth/components/social/GoogleSignInButton.tsx`: renders a "Sign in with Google" button with a localized label. For the Google mark, reuse an existing approved Google brand asset if one already exists in the project; otherwise use a minimal, accessible inline Google brand mark — do NOT assume or add a `lucide-react` Google icon, any new icon library, dependency, or provider SDK, and do NOT hardcode Google OAuth URLs (FR-009, SR-002, SR-004). On activate, call `authService.signInWithGoogle()`, show an appropriate loading/disabled state while the boundary resolves (FR-008), and on `{ status: "not-connected" }` show the localized "integration not available" message — MUST NOT mutate auth state or navigate (FR-007, SR-003)
- [x] T015 [US5] Render `GoogleSignInButton` in the sign-in view of `src/features/auth/components/LoginForm.tsx` (after T006)
- [x] T016 [US5] Add Google-button strings (e.g., `signInWithGoogle`, `googleUnavailable`) to the `auth` namespace in `messages/en.json` and `messages/ar.json` (IR-001/IR-002, SC-003)

**Checkpoint**: Google affordance delivered, honest about the unconnected backend.

---

## Phase 7: User Story 6 - Password visibility toggle (Priority: P3)

**Goal**: A user can reveal/hide their password on the sign-in password field via an accessible toggle.

**Dependency**: Depends on US1 (T006 sign-in view). The `LoginForm.tsx` file is shared with US5 — this task is applied after T015, not in parallel.

**Independent Test** (per spec): Toggle visibility → the input switches between masked and unmasked with the toggle state exposed via an accessible attribute (`aria-pressed`); with a validation error visible, toggling leaves the error intact.

### Implementation for User Story 6

- [x] T017 [US6] Add a password visibility toggle to the password input in `src/features/auth/components/LoginForm.tsx`: a native icon `<button type="button">` that toggles the input `type` between `"password"` and `"text"` (local, non-persisting state per FR-005), exposes state via `aria-pressed` and a descriptive localized `aria-label` (AR-003), and does NOT clear or affect any visible validation error (US6/AS2); reuse an existing project eye icon where available
- [x] T018 [US6] Add password-toggle strings (e.g., `showPassword`, `hidePassword`) to the `auth` namespace in `messages/en.json` and `messages/ar.json` (IR-001, AR-003)

**Checkpoint**: Toggle works without backend impact.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, reduced-motion, and security cross-cutting requirements derived from the spec. Responsive/RTL/LTR behavior is implemented throughout the story phases (logical properties, RR-001..RR-003) and validated by the user in the final validation step — no redundant standalone verification task is generated.

**Dependency**: Applies across US1–US6.

- [x] T019 [P] Convey the active view to assistive technology (AR-006): ensure the sign-in / account-creation / recovery view switch is announced and the active view is programmatically indicated in `src/features/auth/components/AuthForm.tsx` and its rendered views
- [x] T020 [P] Ensure reduced-motion compliance (AR-005, DR-007): confirm `FadeInView` and any ambient/entrance decorations introduced by the redesign respect `prefers-reduced-motion`, reusing existing motion-safe primitives and adjusting only non-compliant animation usage in the redesigned auth components
- [x] T021 [P] Security review per SR-001..SR-005 of the redesigned auth components: no prototype inline script/CDN copied into the codebase; no new outbound requests, credentials, tokens, or secrets; no fake-auth code path (every Google/recovery path resolves `not-connected` and never mutates state, never claims a reset email was sent); no guessed route names, provider URLs, or backend assumptions hardcoded
- [x] T022 Final validation handoff (user-run): instruct the user to run from the project root `npm run lint` and `npm run build` (SC-005 — must pass with no new dependencies and no changes to global theme/token files) and then execute the full manual matrix in `specs/002-auth-page-redesign/quickstart.md` (scenarios A–E) covering SC-001..SC-009 in both locales and directions, both themes, at 320–1440px widths, and via keyboard. The agent does NOT run these commands or any Git/validation commands itself

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately; BLOCKS all user stories.
- **User Stories (Phase 2+)**: All depend on Foundational completion. US1 (P1) comes first as MVP; US2–US6 follow.
- **Polish (Phase 8)**: Applies across all user stories.

### User Story Dependencies

- **US1 (P1)**: No story dependencies — starts after Foundational; the MVP.
- **US2 (P2)**: Depends on US1 (validates the redesigned sign-in view). Implementation is i18n-only.
- **US3 (P2)**: Depends on US1 (T005 view controller hosts the switch). Independent of US2/US4/US5 (subject to shared `AuthForm.tsx` ordering with US4).
- **US4 (P2)**: Depends on US1 + Foundation T002 (`authService`). Independent of US2/US3/US5 (subject to shared `AuthForm.tsx` ordering with US3).
- **US5 (P2)**: Depends on US1 + Foundation T002 (`authService`). Independent of US2/US3/US4 (subject to shared `LoginForm.tsx` ordering with US6).
- **US6 (P3)**: Depends on US1 (sign-in password field). Independent of US2/US3/US4 (subject to shared `LoginForm.tsx` ordering with US5).

### Shared-File Sequencing (no parallel same-file conflicts)

- `src/features/auth/components/AuthForm.tsx`: T005 (US1) → T009 (US3) → T012 (US4) → T019 (Polish) — sequential.
- `src/features/auth/components/LoginForm.tsx`: T006 (US1) → T015 (US5) → T017 (US6) — sequential.
- `messages/en.json` + `messages/ar.json`: T007 (US1), T010 (US3), T013 (US4), T016 (US5), T018 (US6), and T008 (US2) all edit these files — apply additions sequentially across stories (distinct keys, shared files).
- `src/features/auth/components/pages/auth-page.tsx`: T004 → T007 — sequential.

### Within Each User Story

- Foundation types (`auth.types.ts`) before the boundary module before consumers
- Component/UI creation before i18n additions
- Story complete (its checkpoints verified) before moving to the next priority

### Parallel Opportunities (distinct files only)

- **Foundational**: T002 and T003 [P] run in parallel (T001 is the type prerequisite).
- **US1**: T004, T005, T006 [P] run in parallel (three distinct files); T007 applies the heading after T004.
- **US4**: T011 [P] (new `RecoveryView.tsx`) is parallel-safe with other components.
- **US5**: T014 [P] (new `GoogleSignInButton.tsx`) is parallel-safe with other components.
- **Polish**: T019, T020, T021 [P] run in parallel (distinct concerns); T022 is the final user-run gate.

---

## Parallel Example: Foundational

```bash
# Launch the authService boundary and the FormField a11y enhancement together:
Task: "Create src/features/auth/services/authService.ts"
Task: "Enhance src/features/auth/components/FormField.tsx"
```

## Parallel Example: User Story 1

```bash
# Launch the three distinct-file scaffolds together:
Task: "Rework src/features/auth/components/pages/auth-page.tsx"
Task: "Rework src/features/auth/components/AuthForm.tsx"
Task: "Rework src/features/auth/components/LoginForm.tsx"
# then apply T007 (heading) after T004 on auth-page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (view types, `authService` boundary)
2. Complete Phase 2: User Story 1 (redesigned two-column page + working sign-in + redirect)
3. **STOP and VALIDATE**: User verifies US1 independently (spec "Independent Test")
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → foundation ready
2. Add US1 → user validates → MVP
3. Add US2, US3, US4, US5, US6 → user validates each
4. Final Polish → user runs the full `quickstart.md` matrix

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once US1 is done:
   - Developer A: US3 (view switch)
   - Developer B: US4 (recovery view)
   - Developer C: US5 (Google button)
   - Developer D: US6 (password toggle) — coordinate on `LoginForm.tsx` with US5
   - i18n additions applied sequentially (shared message files)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a spec user story for traceability
- Each user story is independently completable and testable via `quickstart.md`
- **Frontend-only** (OS-001): no backend work of any kind; the existing Redux `login`/`register` thunks, localStorage persistence, onboarding semantics, and redirect behavior are preserved unchanged
- `authService` exposes ONLY `signInWithGoogle()` and `requestPasswordReset(email)`, both resolving `{ status: "not-connected" }`, and never defines or assumes backend contracts — those are defined in the later Backend Integration phase
- **No new routes** (OS-002); **no new dependencies / global tokens / fonts / provider SDKs / theme changes** (OS-004); **no trust/stats band** (OS-005)
- The user handles all Git operations separately; the agent runs no shell/validation commands
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts across parallel tasks, cross-story dependencies that break independence, verification-only tasks that `quickstart.md` already covers