# Feature Specification: Auth Page Redesign (/auth Sign In)

**Feature Branch**: `002-auth-page-redesign`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "/auth page redesign — redesign the existing `/auth` page to match the supplied Sign In HTML prototype (visual reference only). Preserve the existing Next.js App Router architecture, the project design system tokens, next-intl localization (EN/AR), RTL/LTR behavior, accessibility best practices, and security constraints. Specification artifacts only."

## Clarifications

### Session 2026-09-11

- Q: Is social sign-in ("Sign in with Google") in scope for this redesign, and does the backend provide OAuth support? → A (superseded by the plan-phase decision below): originally answered "in scope with backend OAuth"; **superseded**.
- Q: How should users without an account reach the registration form on the redesigned page? → A: Use the prototype's "Create an account" cross-link model — a single mode per view within the same `/auth` page, with no new route. The existing login/register tab toggle is replaced by cross-links between the sign-in and account-creation views.
- Q: What should the "Forgot your password?" link do, and how should the prototype's trust/stats band be handled? → A (superseded by the plan-phase decision below): originally answered "implement backend password recovery; omit stats"; **superseded**.
- Q: [plan gate] Should this feature include building the real auth backend? → A: **No. Frontend auth redesign only.** The real backend exists externally and will be integrated in a later phase. No backend is created or implemented in this feature. The current frontend auth/mock integration (localStorage-backed redux thunks) is preserved for email/password login and registration. Google OAuth and password recovery are kept as explicit FUTURE backend integration boundaries with defined frontend contracts — never fake implementations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning user signs in (Priority: P1)

A returning user opens `/en/auth` (or `/ar/auth`), sees the redesigned sign-in screen, enters a valid email and password, submits, and is routed back into their learning journey through the existing mock-backed login flow. The visual redesign is purely presentational for this story; the login behavior is the existing migration-compatible mock.

**Why this priority**: This is the core purpose of the page. Without a working sign-in that routes the user to their destination, the page has no value regardless of the visual redesign.

**Independent Test**: Can be fully tested by loading the redesigned page, submitting credentials against the existing login flow, and observing the existing redirect behavior (dashboard if onboarding is complete, otherwise onboarding). Delivers the primary value of the page.

**Acceptance Scenarios**:

1. **Given** a returning user with valid credentials, **When** they submit the sign-in form, **Then** the existing login flow succeeds and the user is redirected to `/dashboard` (or `/onboarding` when onboarding is not complete) in the same locale.
2. **Given** the user is unauthenticated, **When** they load `/auth`, **Then** the redesigned sign-in UI is displayed and no redirect loop occurs.

---

### User Story 2 - User with invalid or missing credentials (Priority: P2)

A user submits an empty or malformed form, or credentials rejected by the existing login flow. They receive localized validation feedback and the existing error message, and can correct and retry without losing the ability to continue.

**Why this priority**: Protection against a broken entry path. Correct, localized error handling must remain intact through the redesign.

**Independent Test**: Can be fully tested by submitting an invalid email and a password shorter than the configured minimum and observing inline validation, then submitting unknown credentials and observing the existing localized error; the user can retry. Delivers a properly failing sign-in that never blocks the page.

**Acceptance Scenarios**:

1. **Given** an invalid email or a password below the minimum length, **When** the user submits the form, **Then** the field-level validation messages from the existing validation schema are shown in the active locale and no request is fired.
2. **Given** credentials rejected by the login flow, **When** the user submits, **Then** the existing localized error message (`auth.errors.*`) is displayed above the submit button.
3. **Given** a sign-in attempt in flight, **When** the request is pending, **Then** the submit button shows the existing localized loading state ("Logging in…") and is disabled against duplicates.

---

### User Story 3 - First-time user reaches account creation (Priority: P2)

A user without an account can reach the existing registration capability from the redesigned screen via the prototype's "Create an account" cross-link, which switches the single-mode view (no new route). The registration form keeps its existing validation, error, and loading behavior.

**Why this priority**: The current page already supports account creation; the redesign must not regress or hide existing functionality.

**Independent Test**: Can be fully tested by switching to the account-creation view, filling the four existing fields, submitting, and observing the existing register flow result. Delivers preserved register capability.

**Acceptance Scenarios**:

1. **Given** the redesigned page in the sign-in view, **When** the user activates the "Create an account" cross-link, **Then** the page switches to the account-creation view (no route change) and the existing Full Name / Email / Password / Confirm Password fields are shown.
2. **Given** the account-creation view, **When** the user submits, **Then** the existing register flow validates and submits with localized feedback and authenticates per the existing mock flow.

---

### User Story 4 - Password recovery view via future backend boundary (Priority: P2)

A user who forgets their password activates "Forgot your password?" from the sign-in view and reaches the recovery view. The recovery view is a real UI built on a defined frontend integration boundary; today (no backend connected) submitting the form surfaces the localized "integration not available" state and NEVER simulates success.

**Why this priority**: Recovery is a real user need and an authorized UI + boundary; the backend handshake is deliberately deferred to a later phase.

**Independent Test**: Can be fully tested by opening the recovery view from the sign-in view and submitting an email; the boundary adapter returns the defined "not connected" result and the localized unavailable message is shown. Delivers the recovery entry point without a fake-success path.

**Acceptance Scenarios**:

1. **Given** the sign-in view, **When** the user activates "Forgot your password?", **Then** the page switches to the recovery view with an email field and a localized submit action.
2. **Given** a submitted recovery request, **When** the connected boundary is unavailable, **Then** the page shows the localized "integration not available" state and does NOT claim the link was sent.
3. **Given** the future backend boundary becomes connected, **When** the request is processed, **Then** the same neutral, localized confirmation is shown (no account-existence disclosure), without changing the frontend UI code beyond the adapter.

---

### User Story 5 - Google sign-in button via future backend boundary (Priority: P2)

A user on the sign-in view sees the prototype's "Sign in with Google" button. The button is wired to a defined frontend integration boundary; today (no backend connected) activating it shows the localized "integration not available" state and NEVER simulates a successful sign-in.

**Why this priority**: The button is a visible prototype affordance whose backend handshake is deferred; the boundary keeps the UI honest and ready for the later integration phase.

**Independent Test**: Can be fully tested by activating the Google button and observing the localized unavailable state and unchanged auth state. Delivers the affordance without fake authentication.

**Acceptance Scenarios**:

1. **Given** the sign-in view, **When** the user activates "Sign in with Google", **Then** the defined boundary is invoked and, since no backend is connected, the page shows the localized "integration not available" message.
2. **Given** the unavailable state is shown, **When** the user inspects auth state, **Then** no auth mutation occurred (no fake login) and the user remains on the sign-in view.

---

### User Story 6 - Password visibility toggle (Priority: P3)

A user can reveal or hide their password while typing on the password field of the sign-in view.

**Why this priority**: A convenience element; small, self-contained, and non-blocking.

**Independent Test**: Can be fully tested by toggling visibility and confirming the input switches between masked and unmasked with the toggle state exposed via an accessible attribute. Delivers the prototype affordance without backend impact.

**Acceptance Scenarios**:

1. **Given** the password field, **When** the user activates the visibility toggle, **Then** the input switches between masked and unmasked with the button state exposed via an accessible attribute (`aria-pressed`/`aria-label` equivalent).
2. **Given** a validation error is visible, **When** the user toggles visibility, **Then** the error remains; the toggle only changes visibility.

---

### Edge Cases

- What happens when the user is already authenticated and visits `/auth`? Existing behavior: immediate redirect — must be preserved exactly.
- How does the form behave during an in-flight submit when the user switches between the sign-in and account-creation views? Existing `clearError()` on view switch must be preserved, and no in-flight mutation may be corrupted.
- What happens on a slow network or a slow mock response? Existing loading state and error display must remain; no partial state mutation.
- What happens at very narrow widths (e.g., 320px) and in RTL? All interactive elements must remain reachable; no horizontal overflow in either locale/direction.
- What happens if the password reveal toggle is activated while a validation error is showing? The error must remain; the toggle only changes visibility.
- What happens if the user activates the Google button or submits the recovery form while the backend boundary is not connected? The localized "integration not available" state is shown; no success is claimed and no auth state changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST preserve the current `/auth` route (per locale) and its server page (`src/app/[locale]/(auth)/auth/page.tsx`) and the `(auth)` route-group layout rendering without the global navbar/footer.
- **FR-002**: System MUST reuse the existing auth integration — the `login`/`register` redux thunks, `loginSchema`/`registerSchema` validation, `react-hook-form` field wiring, `FormField` inputs (`autoComplete="email"` / `"current-password"` / `"name"` / `"new-password"`), and the existing localized loading/error states. The redesign MUST NOT introduce a parallel auth mechanism and MUST NOT change the mock-backed behavior.
- **FR-003**: System MUST preserve the existing post-auth redirect rule (dashboard when onboarding is complete, otherwise onboarding) and the existing already-authenticated redirect on page load.
- **FR-004**: System MUST display the existing localized error (`auth.errors.*`) above the submit control when present, and clear it on view switch via the existing `clearError()`.
- **FR-005**: System MUST provide a password visibility toggle on the password field that only toggles input type (local, non-persisting UI state).
- **FR-006**: The "Create an account" cross-link MUST switch to the account-creation view within the same `/auth` page (see US3) — no new route. The "Forgot your password?" link MUST switch to the password-recovery view (US4).
- **FR-012**: System MUST provide a password-recovery view (email field, localized validation/loading/error states, neutral confirmation) driven by a defined frontend integration boundary (IB-005). With no backend connected, the boundary MUST return the "not available" result and the view MUST surface the localized "integration not available" message — it MUST NOT claim the reset link was sent.
- **FR-013**: System MUST NOT implement any backend password-recovery processing in this feature. The frontend boundary contract is defined in `contracts/`; the external backend provides the actual recovery service in a later phase.
- **FR-007**: System MUST render a "Sign in with Google" button with a localized label, wired to a defined frontend integration boundary (IB-004). With no backend connected, activating it MUST surface the localized "integration not available" state and MUST NOT mutate auth state or navigate.
- **FR-008**: The Google button MUST show an appropriate loading/disabled state while the boundary is resolving and MUST remain honest (no simulated success) until the future backend integration is connected.
- **FR-009**: The Google button and recovery view MUST depend only on the project's boundary interfaces (IB-004/IB-005); the frontend MUST NOT couple directly to any third-party provider SDK or hardcode provider URLs.

### UI & Design Requirements

- **DR-001**: The redesign MUST reuse the existing design system (Tailwind tokens, `Container`, `Button`, `FormField`, `FadeInView`, existing input styling) and MUST NOT introduce global palette changes.
- **DR-002**: Prototype colors map onto existing tokens as follows: navy `#12314D` → `--color-primary-900` (`#12314d`); brand navy `#0A2540` → nearest existing navy token (`--color-midnight` `#0a1930` / `--color-primary-950`, per the established homepage navy usage); badge tints `#EDF6FC`/`#D5E8F7` + slate-blue text `#24618E` → `--color-light-blue-bg` / `--color-light-blue-text` family; sky accent `#38BDF8` and button slate `#617D94` have no existing token — map to the closest existing accent/secondary/muted token and document any genuine gap. No prototype-only hex values may enter the global stylesheet.
- **DR-003**: Desktop layout (approx. ≥1024px) follows the prototype's two-column arrangement: brand/ambient panel + form panel. Below the desktop breakpoint the panels stack to a single column with the form first in reading order. Column arrangement MUST use logical layout properties so it mirrors correctly in RTL.
- **DR-004**: Typography MUST use the existing Nunito stack and existing text utilities (`text-heading-*`, muted-foreground for hints). The main heading ("Welcome Back"), subtitle, field labels, helper text, and button labels follow the prototype's hierarchy without introducing new fonts.
- **DR-005**: **Theme conflict (documented decision)**: the app default theme is dark (`--bg-base: #0a0d14` in `:root, .dark`) while the prototype is a light ambient canvas. Existing architecture takes priority: the redesigned page MUST be built from theme-aware tokens so it remains fully readable and functional in the app's default dark theme AND in light theme. The visual redesign MUST NOT force a global light theme and MUST NOT change the ThemeProvider default.
- **DR-006**: Brand representation (logo + wordmark) on the page reuses the existing brand asset used in the global Navbar pattern; no new brand asset is invented.
- **DR-007**: The prototype's ambient/backdrop decoration is optional and, if reproduced, MUST be implemented with existing utilities (e.g., `dark-section` panels, existing glow patterns) and must respect `motion-reduce`.

### Responsive Layout Requirements

- **RR-001**: The page MUST render without horizontal scrolling at widths 320px, 375px, 768px, 1024px, and 1440px in `en` (LTR) with all form controls fully reachable.
- **RR-002**: The same guarantees as RR-001 MUST hold in `ar` (RTL): the two-column arrangement mirrors, alignment flips, and no LTR assumptions in icon spacing or text alignment.
- **RR-003**: All interactive elements MUST have a minimum touch-target size consistent with the existing design system and remain usable between breakpoints (no elements clipped or overlapping when the columns collapse).

### Internationalization Requirements

- **IR-001**: All user-facing strings introduced by the redesign MUST be added to `messages/en.json` and `messages/ar.json` — no hardcoded strings anywhere in components.
- **IR-002**: The prototype's trust/stats band is omitted (Q3); therefore no unverified marketing metrics appear. New strings (Google button, recovery view, "integration not available", view-switch links) MUST be localized and reviewed in both locales.
- **IR-003**: RTL MUST be treated as first-class: mirrored columns, logical spacing, and correct text direction for all newly added layout and copy.

### Accessibility Requirements

- **AR-001**: Every form control MUST have a programmatically-associated label (existing `FormField` label precedes the input); a placeholder alone MUST NOT serve as the label.
- **AR-002**: The full sign-in path MUST be operable by keyboard alone: logical tab order, visible focus on inputs/buttons/toggle, and buttons implementing native semantics (no bare `div` click targets).
- **AR-003**: The password visibility toggle MUST expose its state via an accessible attribute (`aria-pressed` or equivalent) and a descriptive localized `aria-label` ("Show password"/"Hide password").
- **AR-004**: Field-level and error messages MUST be visible text and, where feasible, associated with the receiving control; color alone MUST NOT be the only error indicator.
- **AR-005**: Any animation or transition introduced by the redesign MUST respect the `motion-reduce` media query (existing `FadeInView` behavior preserved).
- **AR-006**: The sign-in / account-creation / recovery views switch via proper link/button semantics with clear, localized labels; the active view MUST be conveyed to assistive technology.

### Security Requirements

- **SR-001**: The prototype's inline toggle script, Tailwind CDN reference, and any browser-executed prototype code MUST NOT be copied into the codebase.
- **SR-002**: No credentials, tokens, or secrets are committed; no new outbound requests are added by this feature (the OAuth/recovery boundaries are unimplemented adapters in this phase).
- **SR-003**: No fake authentication: the Google button and recovery view MUST NOT simulate a successful sign-in, mutate auth state, or misreport success while the backend boundary is not connected.
- **SR-004**: Any real external link added by the redesign MUST use `https:` and safe target handling; no guessed route names or provider URLs may be hardcoded.
- **SR-005**: The redesign MUST NOT weaken server-side truth: it adds no client-side-only authorization decisions and preserves the current mock behavior unchanged until the external backend is integrated in a later phase.

### Integration Boundaries

*Existing frontend integration (reuse, not invented)*:

- **IB-001**: `redux/slices/authSlice` — `login`/`register` thunks, `isLoading`, `error`, `clearError()`; `redux`/`onboarding` state; `RootState` selectors. The mock-backed behavior is intentionally preserved this phase.
- **IB-002**: `src/features/auth/components/{AuthForm,LoginForm,RegisterForm,FormField,pages/auth-page}.tsx`, `src/features/auth/validation/{login,register}Schema.ts`, `src/features/auth/types/auth.types.ts`.
- **IB-003**: `next-intl` (`auth` and `validation` namespaces), `useRouter` from `@/i18n/navigation`, `setRequestLocale`, `Container`, `Button`, `FadeInView`.

*Future backend integration boundaries (defined now as frontend contracts; backend implemented later)*:

- **IB-004**: Google OAuth sign-in — frontend boundary/service interface defined in `contracts/auth-service.md`. The current adapter returns a defined "not connected" (unavailable) result; no provider SDK, URLs, or tokens. The external backend provides the OAuth handshake in a later phase.
- **IB-005**: Password recovery — frontend boundary/service interface defined in `contracts/auth-service.md` (request reset + neutral confirmation semantics; no account-existence disclosure). Current adapter returns "not connected"; backend provides email dispatch and reset processing later.

### Out of Scope

- **OS-001**: All backend work is OUT OF SCOPE for this feature: no Laravel/API implementation, no OAuth provider handshake, no password-reset processing, no email dispatch, no database or session changes. The existing frontend mock auth integration is preserved unchanged.
- **OS-002**: A separate `/register` page or any new route (resolved: cross-link model, no new route — see Q2).
- **OS-003**: Dashboard, onboarding, navbar/footer, or homepage changes (including the pending glass-card glow decision from the homepage work).
- **OS-004**: New dependencies, new global design tokens, font changes, provider SDKs, or theme-provider behavior changes.
- **OS-005**: The prototype's trust/stats band (e.g., "42M+ users") is OMITTED from the redesigned page per clarification Q3; no marketing metrics are displayed.

### Key Entities

No new data entities are introduced as public API by this redesign. The feature relies on the existing authenticated-user state produced by the existing mock login/register flow; the UI-local state is the view mode (sign-in / account-creation / password-recovery) and the password visibility toggle. The OAuth and recovery boundaries (IB-004/IB-005) are defined as frontend service contracts only; their backend models are deliberately deferred and NOT defined here.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete sign-in on the redesigned page end-to-end through the existing mock login flow in both `en` and `ar` with a successful redirect to `/dashboard` or `/onboarding` per the existing rule.
- **SC-002**: The redesigned page renders with no horizontal overflow and all controls usable at 375px, 768px, 1024px, and 1440px in both LTR and RTL (verified visually and via CSS/layout checks).
- **SC-003**: Zero hardcoded user-facing strings; 100% of newly introduced strings exist in both `messages/en.json` and `messages/ar.json`.
- **SC-004**: The sign-in form and the password toggle are fully operable by keyboard alone, with visible focus and accessible toggle state, in both locales.
- **SC-005**: `npm run build` (Next.js/Turbopack typecheck + build) and `npm run lint` complete successfully with no new dependencies and no changes to the global theme/token files.
- **SC-006**: Existing behavior is preserved: already-authenticated redirects, registration capability, validation, localized errors, loading states, and `clearError()` on view switch behave as today, with registration now reached via the "Create an account" cross-link instead of the tab toggle.
- **SC-007**: The rendered page matches the approved prototype layout at desktop and mobile per the DR-002/DR-003 mapping, with all token substitutions per DR-001 documented and consistent.
- **SC-008**: Activating "Sign in with Google" and submitting the recovery form each surface the localized "integration not available" state, leave auth state unchanged, and never claim success — verified in both locales and both themes.
- **SC-009**: The recovery view toggles correctly between the sign-in view and exhibits the defined neutral confirmation semantics in the boundary contract (not verified end-to-end until the backend phase).

## Assumptions

- The supplied HTML is a visual reference; its code, inline scripts, CDN reference, and brand hex values are not part of the build.
- The real auth backend exists externally and is integrated in a later phase; this feature never creates or modifies backend code and preserves the current localStorage-backed mock for email/password flows.
- Google OAuth and password recovery are defined as frontend integration boundaries (IB-004/IB-005) with "not connected" adapters; they go live when a later phase connects the external backend, without reworking the UI code beyond the adapter.
- "Create an account" is a cross-link that switches to the account-creation view within the same `/auth` page (no new route, per clarification Q2).
- The trust/stats band is omitted from the redesigned page (per clarification Q3).
- The page must remain fully usable in the app's default dark theme; the light prototype canvas is a design reference, not a theme mandate.
- No new browser dependencies or external fonts beyond the existing Nunito setup.

## Open Questions ([NEEDS CLARIFICATION], max 3)

| ID | Question | Status / Decision |
| --- | --- | --- |
| Q1 | Is social sign-in ("Sign in with Google") in scope for this redesign? | **RESOLVED (plan gate, session 2026-09-11)**: Frontend-only. The button is a UI affordance wired to the future backend boundary (IB-004); today it surfaces the localized "integration not available" state and never fakes success. Backend OAuth deferred to a later phase. |
| Q2 | How should users without an account reach the registration form on the redesigned page? | **RESOLVED (session 2026-09-11)**: Prototype's "Create an account" cross-link model — single mode per view within the same `/auth` page, no new route (see FR-006, US3). |
| Q3 | What should the "Forgot your password?" link do, and how should the prototype's trust/stats band be handled? | **RESOLVED (plan gate, session 2026-09-11)**: Recovery is a frontend view + boundary (IB-005) with a "not connected" adapter today; the trust/stats band is omitted entirely (OS-005). Backend recovery processing deferred to a later phase. |