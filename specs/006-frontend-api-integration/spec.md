# Feature Specification: Frontend API Integration

**Feature Branch**: `006-frontend-api-integration`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Create a specification for integrating the existing Next.js frontend with the REST API defined in `API_CONTRACT.md`, which is the single source of truth for all API endpoints, request/response schemas, authentication, and API behavior."

## Clarifications

### Session 2026-09-16

- Q: When a request that isn't about signing in (loading preferences, the learning profile, or a roadmap) fails because of a temporary network or server problem, should the app retry it automatically before showing an error, or show the error right away with a manual retry option? → A: A small number of silent automatic retries (1-2, brief backoff) for read-only requests only, then a manual retry if still failing. State-changing requests are never auto-retried.
- Q: When a returning user's account predates the preferences feature and the API reports no preferences exist for them yet, should the app silently create default preferences in the background, or surface it as a normal piece of unfinished onboarding? → A: Treat it as a normal missing piece of onboarding, same as any other incomplete field, and route them through the preferences step to set it explicitly — no special-cased silent creation.
- Q: When a roadmap generation attempt ends in failure, should the app show the specific reason the backend gives, or one generic "something went wrong" message regardless of why it failed? → A: Show a specific, mapped explanation for recognized failure reasons, falling back to a generic message for any reason not yet recognized by the frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account access (register, login, session refresh, logout) (Priority: P1)

A visitor creates an account or signs back in, and stays signed in across normal use of the app without the session unexpectedly dropping while their access token is still refreshable.

**Why this priority**: Every other flow (onboarding, roadmap generation) requires an authenticated session. Nothing else in the app is reachable or testable without this working first.

**Independent Test**: Can be fully tested by registering a new account, signing out, signing back in, and continuing to use the app past the access token's normal lifetime (triggering at least one silent refresh) — delivers a working, persistent-enough session on its own, independent of onboarding or roadmap features.

**Acceptance Scenarios**:

1. **Given** a visitor with no account, **When** they submit valid registration details, **Then** they are signed in immediately and land on the onboarding flow with default preferences already applied.
2. **Given** a returning user with valid credentials, **When** they sign in, **Then** they reach the screen appropriate to their current onboarding/roadmap state (not always the same landing screen).
3. **Given** a signed-in user whose access token has expired but whose refresh token is still valid, **When** they make any authenticated request, **Then** the app silently refreshes the session once and completes the original request without interrupting the user.
4. **Given** a signed-in user whose refresh token is invalid, expired, or revoked, **When** a refresh attempt fails, **Then** the app signs the user out and returns them to sign-in without a confusing error state.
5. **Given** a signed-in user, **When** they sign out, **Then** all local session state is cleared immediately even if the sign-out network request fails.
6. **Given** a user submitting registration or sign-in with invalid data, **When** the request is rejected, **Then** field-level and general errors are shown without ever revealing whether a given email is registered when credentials are simply wrong.

---

### User Story 2 - Complete onboarding before unlocking roadmap generation (Priority: P2)

A signed-in user who hasn't finished onboarding sets their preferences and learning profile, and only once every required piece of information is present is roadmap generation unlocked.

**Why this priority**: Roadmap generation is blocked server-side until onboarding is complete, so this flow is the prerequisite for the app's core value (User Story 3) but is independently meaningful and testable on its own.

**Independent Test**: Can be fully tested by signing in as a user with incomplete onboarding, filling in preferences and a learning profile, and confirming the onboarding-complete state is reached and roadmap generation becomes available — delivers a complete, working onboarding flow independent of whether generation is ever triggered.

**Acceptance Scenarios**:

1. **Given** a signed-in user who hasn't completed onboarding, **When** they open the app, **Then** they are shown exactly which pieces of information are still missing.
2. **Given** a user updating language/region preferences, **When** they save a change, **Then** the change is reflected immediately and persists across reloads.
3. **Given** a user submitting their learning profile for the first time, **When** they save it, **Then** it is created; **When** they save it again later with different values, **Then** the previous values are fully replaced, not merged.
4. **Given** a user whose onboarding is not yet complete, **When** they attempt to generate a roadmap through any path in the UI, **Then** the action is unavailable or blocked, and they are directed to the specific missing information.
5. **Given** a user who has just completed the last missing piece of onboarding, **When** the app checks completion status again, **Then** roadmap generation becomes available without requiring a full page reload.

---

### User Story 3 - Generate and view a learning roadmap (Priority: P3)

A user with completed onboarding requests a personalized roadmap, watches it move from in-progress to ready, and then reviews the resulting stages and tasks.

**Why this priority**: This is the app's primary value delivery, but it depends on Users Stories 1 and 2 being in place first, so it is correctly sequenced last while still being independently testable once its prerequisites exist.

**Independent Test**: Can be fully tested by signing in as a user with completed onboarding, requesting a roadmap, observing the status change from queued/running to succeeded, and viewing the resulting roadmap content — delivers the full generation-to-viewing journey on its own.

**Acceptance Scenarios**:

1. **Given** a user with completed onboarding, **When** they request a roadmap, **Then** the request is accepted and the UI shows an in-progress state.
2. **Given** a roadmap generation request in progress, **When** the user waits, **Then** the UI checks progress periodically without requiring a manual refresh, and stops checking as soon as a final outcome is known.
3. **Given** a roadmap generation request that finishes successfully, **When** the final state is reached, **Then** the user is taken to their new roadmap automatically.
4. **Given** a roadmap generation request that fails or is cancelled, **When** the final state is reached, **Then** the user sees a specific explanation for recognized failure reasons (a generic explanation for unrecognized ones) and a way to try again that does not silently reuse the failed attempt.
5. **Given** a user views a generated roadmap, **When** the roadmap is rendered, **Then** stages and the tasks within them appear in their intended order, grouped correctly, with each task's resources visible.
6. **Given** a roadmap generation request is already in progress for a user, **When** the same user tries to start a second one, **Then** they are shown the existing in-progress request instead of starting a duplicate.

---

### Edge Cases

- What happens when a user double-clicks "Generate roadmap" or the request is retried after a network timeout — does it ever create two roadmap-generation jobs from one user action?
- What happens when two authenticated requests fail for an expired token at the same moment — does the app attempt more than one refresh at a time, and can that cause the user to be signed out unnecessarily?
- What happens when a user reloads the page while a roadmap-generation request is still in progress or a roadmap already exists? (No endpoint currently lets the frontend rediscover an in-progress request or an existing roadmap without already knowing its ID.)
- What happens when a legacy account has no preferences row? It is treated as a normal missing piece of onboarding (surfaced the same way as any other incomplete field), not silently defaulted. What happens when such an account also has no learning-profile row, or a learning profile with missing optional fields?
- What happens when a roadmap's current version, or a task's resource list, is empty or absent?
- What happens when the user is rate-limited during registration, sign-in, or roadmap-generation requests?
- What happens when the authentication service is temporarily unavailable during a token refresh — is the user's existing session torn down, or preserved for a retry?
- What happens when a user tries to view or act on a roadmap-generation request or roadmap that belongs to someone else, or that never existed?
- What happens when a user tries to complete or skip an individual task, or activate a different roadmap version? (These actions have no backend support yet.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a new visitor register with name, email, and password, and immediately establish a signed-in session on success, with default preferences applied automatically.
- **FR-002**: System MUST let a returning user sign in with email and password, returning the same generic outcome for "account does not exist," "wrong password," and "inactive account" so account existence is never revealed through sign-in errors.
- **FR-003**: System MUST keep exactly one authentication refresh in flight at a time; any requests that fail for an expired session while a refresh is already underway MUST wait for and reuse that same refresh outcome rather than starting another.
- **FR-004**: System MUST, after a successful refresh, replace both the access and refresh credentials together before retrying the original request, and MUST NOT ever enter a repeating refresh loop.
- **FR-005**: System MUST sign the user out and return them to sign-in whenever a refresh attempt itself fails (invalid, expired, revoked, or reused credential).
- **FR-006**: System MUST clear all local session state on sign-out regardless of whether the sign-out network request succeeds.
- **FR-007**: System MUST NOT persist long-lived session credentials in any durable browser storage, MUST NOT place them in URLs, and MUST NOT include them in logs, analytics, or error reports.
- **FR-008**: System MUST show the user exactly which onboarding information is still missing whenever onboarding is incomplete, sourced from the current server-reported status rather than the frontend's own guess.
- **FR-009**: System MUST let a user view and update their preferences (interface language, resource-content language, timezone), applying only the fields the user actually changed.
- **FR-010**: System MUST let a user create their learning profile, and MUST treat a later save as a full replacement of the previous profile rather than a partial update.
- **FR-011**: System MUST prevent starting roadmap generation until onboarding is reported complete, and MUST re-check completion after onboarding-related changes without requiring a full page reload.
- **FR-012**: System MUST generate one unique identifier per user-initiated "generate roadmap" action and MUST reuse that same identifier only when automatically retrying that exact action after a timeout or network failure, never for a new, separate click.
- **FR-013**: System MUST treat an already-in-progress roadmap-generation request for a user as the authoritative current request rather than allowing a second concurrent one to be started.
- **FR-014**: System MUST poll for roadmap-generation status after a request is accepted, starting promptly and backing off over time, and MUST stop polling immediately once a final outcome (success, failure, or cancellation) is known.
- **FR-015**: System MUST stop polling after a bounded waiting period even if no final outcome has been reached, and MUST offer the user a way to check again without that action alone creating a new generation request.
- **FR-016**: System MUST take the user to their newly generated roadmap automatically once generation succeeds.
- **FR-017**: System MUST render a roadmap's stages, tasks, and each task's resources in their intended order, and MUST render task-level completion/skip controls as unavailable, since no backend capability exists yet to act on them.
- **FR-018**: System MUST show a distinct, understandable state for each category of failure (invalid input, access denied, not found, conflicting request, rate-limited, temporarily unavailable, unexpected error) rather than a single generic error message, and MUST base that state on the server's error classification rather than matching human-readable error text.
- **FR-019**: System MUST retain the identifier included with every server response long enough to show it to the user or include it in support-facing error states.
- **FR-020**: System MUST treat "not found" and "belongs to someone else" identically when a user requests a roadmap-generation request or roadmap they cannot access, without indicating which case applies.
- **FR-021**: For read-only requests that fail due to a transient network or server error (not an authentication or validation failure), system MUST automatically retry a small, bounded number of times with a brief backoff before surfacing an error to the user. Requests that change data MUST NOT be automatically retried and MUST instead surface a manual retry option immediately on failure.
- **FR-022**: When a user's account has no preferences saved yet (including legacy accounts predating default preference creation), system MUST treat this as a normal missing piece of onboarding — reported through the same missing-onboarding-information mechanism as any other incomplete field — rather than silently creating default values without an explicit user action.
- **FR-023**: When a roadmap generation request ends in failure, system MUST show a specific, friendly explanation for each failure reason it recognizes, and MUST fall back to one generic explanation for any failure reason it does not yet recognize, rather than failing to render an explanation at all.

### Key Entities *(include if feature involves data)*

- **User**: An account holder. Has an identity, contact email, and an account status; only an active account can complete sign-in.
- **Session**: The signed-in state tying a user's browser to their account. Composed of a short-lived access credential and a longer-lived, rotating refresh credential.
- **Preferences**: A user's interface language, preferred content language, and timezone. One set per user.
- **Learning Profile**: A user's stated learning goal, self-assessed level, desired outcome, available time, and preferred learning methods. One current set per user; replacing it discards the prior values.
- **Onboarding Status**: A derived, server-authoritative view of whether a user's preferences and learning profile are complete enough to proceed, plus which specific pieces are missing.
- **Roadmap Generation Request**: One attempt to produce a roadmap for a user. Has a lifecycle from queued through an active state to a final outcome, and links to the resulting roadmap once successful.
- **Roadmap**: A user's personalized learning plan once generated. Composed of an active version, which in turn is composed of ordered stages, each containing ordered tasks, each of which may reference ordered resources.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can go from an empty registration form to a signed-in state ready for onboarding in a single submission, with zero manual retries needed for a valid input.
- **SC-002**: A returning user with a valid session reaches the screen matching their actual onboarding/roadmap state within 2 seconds of opening the app, without ever being shown a screen that doesn't match their real state.
- **SC-003**: 100% of requests that fail only because of an expired (not revoked) session are recovered by exactly one silent refresh and complete successfully, with the user never seeing an interruption.
- **SC-004**: 0% of roadmap-generation attempts are possible while onboarding is incomplete, across every path in the UI that could trigger one.
- **SC-005**: A user retrying a failed roadmap generation, including via a network timeout, never results in more than one job actually running for that attempt.
- **SC-006**: Once a roadmap-generation request reaches a final outcome, the UI reflects that outcome within one polling cycle, without requiring the user to manually refresh the page.
- **SC-007**: 100% of error states shown to users are one of a defined, understood set of categories (not a raw/unmapped message), regardless of which endpoint produced the error.
- **SC-008**: A user can never determine, from the app's behavior, whether a sign-in failure was due to a wrong password or a non-existent account, nor whether a denied roadmap or generation request exists but belongs to someone else.

## Assumptions

- The backend already implements every endpoint and behavior exactly as documented in `API_CONTRACT.md`; this feature is about the frontend consuming that contract, not changing backend behavior.
- "Integrating the existing frontend" means wiring already-built screens (auth, onboarding, dashboard/roadmap views) to real API calls; this feature does not cover designing new screens from scratch.
- For this iteration, sessions are kept in memory only, matching the contract's direct-browser MVP guidance — a page reload ends the session and requires signing in again. A persistent, cookie-backed session via a server-side layer is a future enhancement, not part of this feature.
- Because the backend has no endpoint yet to look up a user's existing roadmap or in-progress generation request without already knowing its ID, a page reload during an active generation or after a roadmap already exists cannot reliably restore that state from the API alone within this feature's scope.
- Acting on individual tasks (complete, skip) and activating a non-current roadmap version are out of scope, since the backend does not yet support them; the roadmap view is read-only for this feature.
- The frontend's existing language/locale support is reused for showing content in the user's preferred interface language; this feature does not introduce a new localization system.
