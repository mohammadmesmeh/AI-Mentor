# AI Mentor — Authentication (Feature 002)

## Status

| Area | Status |
| --- | --- |
| Auth UI (sign-in / create account / password recovery) | **Implemented** — frontend mock |
| Client validation (yup schemas + react-hook-form) | **Implemented** |
| Redux `auth` slice + localStorage persistence | **Implemented** (`ai-mentor-auth`) |
| Post-auth / already-authenticated redirects | **Implemented** |
| Google sign-in + password reset surfaces | **Implemented** as explicit `not-connected` states — real capability **Backend-dependent**, not built |
| Backend auth endpoints (`register`, `login`, `refresh`, `logout`, `/me`) | **Implemented** in `Backend/`, under active parallel development by another developer, per `API_CONTRACT.md` — current implementation evidence, not automatically the final agreed contract |
| Authentication architecture | Current backend implementation: **JWT Bearer**. Provisional frontend working assumption: **JWT Bearer**, matching the backend. **Final architecture is pending reconciliation** with the backend developer (a previously-considered alternative was Sanctum SPA + HttpOnly cookies). |
| Frontend ↔ backend auth integration (fetch/token handling) | **Not implemented** — no API client exists; deferred until the contract is agreed/reconciled |

## Sources

- `specs/002-auth-page-redesign/{spec.md,plan.md,tasks.md,quickstart.md,contracts/auth-service.md}`
- `src/app/[locale]/(main)/auth/page.tsx`
- `src/features/auth/components/**` (auth-page, AuthForm, LoginForm, RegisterForm, RecoveryView, GoogleSignInButton, AuthBrandPanel, FormField)
- `src/features/auth/...` services (`authService.ts`), types (`auth.types.ts`), validation schemas
- `src/redux/slices/authSlice.ts`, `src/redux/store.ts`
- `API_CONTRACT.md` (backend auth contract), `Backend/README.md`

## Product Purpose

Users create an account, sign in and out, and (per requirements) manage and delete their account. Every user owns only their own data; the UI never enforces authorization. Auth is the gate into the product funnel: sign in → onboard → learn.

## Frontend Flow (as implemented)

```text
Start (no session)
  /[locale]
     ├─ unauthenticated  → marketing home; "Sign In"/"Start Learning" CTAs
     └─ authenticated
          ├─ onboarding not complete → /[locale]/onboarding
          └─ onboarding complete     → /[locale]/dashboard
```

`AuthPage` (client, `src/features/auth/components/pages/auth-page.tsx`) applies the redirect rule on entry and when auth/onboarding state changes. Onboarding's own client page pushes to `/dashboard` the moment `completeOnboarding` is dispatched.

### Views (AuthForm)

- **Sign-in**: email + password, show/hide password, "remember device" checkbox, forgot-password link. Submits the Redux `login` thunk.
- **Create account**: name + work/student email + password + confirm, requiring-markers copy, terms/social area.
- **Recovery**: email field; submits `requestPasswordReset` → localized "not connected; no email was sent" (`resetUnavailable`).
- **Google**: `GoogleSignInButton` calls `authService.signInWithGoogle()` → `{ status: "not-connected" }` → localized unavailable message (`googleUnavailable`); no account change is claimed.

### Validation

- `loginSchema`, `registerSchema` (yup) wired via `@hookform/resolvers`; messages from the `validation` namespace (email required/valid, password min 6, confirm match, name required). `FormField` renders inputs with error/disabled/loading states.
- Backend contract validation is stricter (password min 8, regex-free but 8-char minimum). The current 6-char client rule is a **mock-bound** discrepancy to reconcile during integration (see docs/06).

### Mock service & state

- `authService.ts`: `signInWithGoogle`, `requestPasswordReset` return `{ status: "not-connected" }` — a conscious stub for future backend operations.
- `authSlice`: `login`/`register` thunks simulate a ~1s round-trip against `localStorage["ai-mentor-auth"]`; error cases map to localized keys (`noAccountRegisterFirst`, `noAccountWithEmail`, `accountExists`); `logout` clears state and storage. `loading` flags drive button pending text.
- Important: the login/register thunks **do not call the backend**; credentials are compared only against locally-stored records. This is a UX scaffold, not auth.

## Backend Auth (Implemented under parallel development, not yet integrated)

> **Provisional authentication assumption**: JWT Bearer authentication, matching the current backend implementation. Final authentication architecture remains pending reconciliation with the backend developer.

Per `API_CONTRACT.md` and `Backend/README.md` — current implementation evidence, not automatically the final agreed contract:

- `POST /api/v1/register` → `201`; creates user, default preferences (`ui_locale=en`, `resource_language=both`, `timezone=UTC`), token pair. 3 attempts/IP/min.
- `POST /api/v1/login` → `200`; same generic `422 validation_failed` for bad credentials and inactive accounts (no account enumeration). 5 attempts/email/IP/min.
- `POST /api/v1/refresh` → `200`; rotates the token pair atomically under a row lock; reuse revokes the family. 10 attempts/IP/min.
- `POST /api/v1/logout` → `204`; revokes family and deny-lists `jti`/`sid`.
- `GET /api/v1/me` → current user; `status` ∈ `active|suspended|deletion_requested`.

### Token rules the frontend must honor when it integrates (from the contract)

1. Never put tokens in URLs, logs, analytics, or error reports.
2. Do not persist the refresh token in `localStorage`.
3. Direct-browser MVP: keep tokens in memory (reload signs out).
4. Persistent sessions: Next.js server/BFF with `HttpOnly Secure SameSite` cookie.
5. One in-flight refresh at a time (serialized) — concurrent refreshes trigger reuse detection.
6. Replace **both** tokens atomically after refresh, then retry once; no infinite loops.
7. On logout, clear frontend state even if the network request fails.
8. Refresh responses are `no-store`/`no-cache`.
9. On `401 unauthenticated`: try one serialized refresh, then sign out. `403` → access-denied; `429` → back off honoring `Retry-After`; `503 authentication_service_unavailable` → temporary error, don't clear tokens immediately.

## Security Considerations

- The current mock must not be mistaken for real auth in any environment review. When the backend is wired in, ownership/authorization comes from the server (JWT), never from the UI.
- No secrets exist in the frontend; there are no credentials, keys, or env vars in `src/`.
- Password reset and Google OAuth remain **not-connected** stubs until the respective backend endpoints exist (reset is listed as an API gap in docs/05).

## Task Status (002)

The auth-page-redesign feature is implemented and validated per its own plan/tasks (build + lint pass). The redirect rules, form states, and light-theme auth surface (brand panel with the documented light gradient and ambient decor) are part of what the dashboard's theme requirements must not regress.