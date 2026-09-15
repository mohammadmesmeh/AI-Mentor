# Contract: Frontend Auth Service Boundary

**Branch**: `002-auth-page-redesign` | **Date**: 2026-09-11 | **Spec**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md)

## 1. Purpose

Defines the single frontend boundary for all authentication operations used by the redesigned `/auth` page. It is the mechanism behind integration boundaries **IB-004** (Google OAuth) and **IB-005** (password recovery) and the prescribed home for the email/password entry (IB-003).

This contract is **frontend-only**. It documents what the UI may call and what the UI must render for each result. It deliberately does **not** define or assume any backend endpoints, payloads, sessions, tokens, OAuth callback routes, response schemas, or provider SDKs — those contracts will be defined entirely during the later Backend Integration phase (SR-004).

## 2. Principles (from Constitution + spec)

1. **No fabricated success.** Future-backend operations shipped in this feature resolve to `{ status: "not-connected" }` — never a fake success/failure path (SR-003, FR-007/FR-008).
2. **No provider coupling in UI.** Components depend on this boundary module, never on provider SDKs, URLs, or keys (SR-004, FR-009).
3. **Email/password behavior preserved.** The sign-in path continues through the existing redux `login` thunk (localStorage mock) with its exact lifecycle (FR-002/FR-004); nothing here changes reducer semantics.
4. **Not-connected is an explicit, observable state.** The UI renders the localized unavailable message for `not-connected` and must not mutate auth state.
5. **No assumed backend contracts.** The interface and result types defined here carry no assumptions about backend endpoints, OAuth callback routes, payload shapes, token formats, session mechanics, or response schemas. The backend integration contract is undefined and will be established in the Backend Integration phase.

## 3. Interface

Implemented in `src/features/auth/services/authService.ts`.

```ts
// Boundary result types (extend `types/auth.types.ts`)

interface GoogleSignInResult {
  status: "not-connected"
  // Full result shape undefined — defined entirely during the Backend Integration phase
}

interface PasswordResetResult {
  status: "not-connected"
  // Full result shape undefined — defined entirely during the Backend Integration phase
}

interface AuthService {
  /** Email/password login — delegates to the existing redux login thunk. */
  signInWithPassword(email: string, password: string): void
  /** Google OAuth — IB-004. Today: resolves not-connected. */
  signInWithGoogle(): Promise<GoogleSignInResult>
  /** Password recovery request — IB-005. Today: resolves not-connected. */
  requestPasswordReset(email: string): Promise<PasswordResetResult>
}
```

### Notes on the interface

- `signInWithPassword` returns `void` because all responsibility (validation, pending/fulfilled/rejected, `AuthState.error`) lives in the existing redux thunk; the boundary merely forwards the call (IB-003: reuse).
- The two future-backend methods are async and return a discriminated union so callers must handle `not-connected` explicitly. All other statuses and payloads are intentionally undefined until the Backend Integration phase.
- No session/token/user entity crosses this boundary today; `AuthUser` stays owned by redux `AuthState`.

## 4. Adapter behavior today (2026-09-11)

| Operation | Implementation | Return | UI rendering |
|-----------|----------------|--------|--------------|
| `signInWithPassword` | Forward to `dispatch(login({ email, password }))` | — (redux lifecycle) | existing pending/error rendering inside `LoginForm` |
| `signInWithGoogle` | `async () => ({ status: "not-connected" })` | `not-connected` | localized "Google sign-in is not available yet" state on `GoogleSignInButton`; no `AuthState` mutation |
| `requestPasswordReset` | `async () => ({ status: "not-connected" })` | `not-connected` | localized "Password reset is not available yet" state in `RecoveryView`; no `AuthState` mutation |

## 5. Future backend swap (documented, NOT implemented here)

When the external backend is integrated:

1. Replace the two adapter bodies behind the same interface (keep `signInWithPassword` forwarding or connect it to the backend integration defined later).
2. Define the complete result unions as part of the Backend Integration phase — nothing is assumed here.
3. UI code changes only to render the newly returned statuses — structure, contract file, and boundary remain.

**Out of scope in this feature — undefined here**: backend endpoints, OAuth callback/`code` flows, token/session delivery, reset-link processing, provider URLs, rate limiting. These contracts are explicitly deferred to the Backend Integration phase (FR-013, `research.md` R3).

## 6. Consumers

- `src/features/auth/components/social/GoogleSignInButton.tsx` → `signInWithGoogle()`
- `src/features/auth/components/recovery/RecoveryView.tsx` → `requestPasswordReset(email)`
- `src/features/auth/components/LoginForm.tsx` → `signInWithPassword(...)` (existing thunk delegation)