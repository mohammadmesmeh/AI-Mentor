# Data Model: Auth Page Redesign (/auth Sign In)

**Branch**: `002-auth-page-redesign` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md) | **Contract**: [contracts/auth-service.md](./contracts/auth-service.md)

## 1. Scope of this model

This feature is frontend-only and introduces **no new persisted entities and no new backend contracts**. This document defines (a) the residual UI view/component state introduced by the redesign, and (b) the result model exposed by the frontend auth-service boundary (`contracts/auth-service.md`), which is the *only_ new data surface in this feature.

## 2. Existing domain entities (reused, unchanged)

| Entity | Shape (current) | Source |
|--------|-----------------|--------|
| `AuthUser` | `{ name: string; email: string }` | `src/features/auth/types/auth.types.ts` |
| `AuthState` | `{ user: AuthUser \| null; isAuthenticated: boolean; isLoading: boolean; error: string \| null }` | `authSlice` initial state |
| `OnboardingState` | `{ isComplete: boolean }` | `onboardingSlice` (untouched) |

Persistence: localStorage-backed mock key `ai-mentor-auth` — **rewritten in this feature**. Field-level semantics of `AuthState` and the `login`/`register` thunks (pending/fulfilled/rejected, 1s simulated delay, `noAccountRegisterFirst`/`noAccountWithEmail`/`accountExists` rejections, `clearError()`) are preserved exactly (FR-002/FR-004, SC-006).

## 3. New UI view-state model (component-local)

### 3.1 `AuthViewMode`

```ts
type AuthViewMode = "sign-in" | "create-account" | "recovery"
```

Owned by the `AuthForm` view controller (R4). Not persisted; not lifted to redux.

**Transitions**:

```
sign-in ──(Create an account)──────────────→ create-account
sign-in ──(Forgot your password?)──────────→ recovery
create-account ──(→ Back to sign in)───────→ sign-in
recovery ──(→ Back to sign in)─────────────→ sign-in
```

Every transition dispatches the existing `clearError()` (preserving FR-004) and resets transient password-visibility state.

### 3.2 `PasswordVisibility`

```ts
type PasswordVisibility = "mask" | "reveal"
```

Per-field transient state in `LoginForm` (and any password field that later adds it). Defaults `"mask"`; toggled by the `aria-pressed` button (R5); resets on view switch (R4).

### 3.3 Form-local state (unchanged)

`react-hook-form` field values + errors remain component-local inside `LoginForm`/`RegisterForm`/`RecoveryView` (e.g., `email`, `password`, `confirmPassword`, `name` per existing schemas). No new global field state.

## 4. Auth-service boundary result model (new)

Defined fully in [contracts/auth-service.md](./contracts/auth-service.md). Summary:

| Operation | Result union (status) | Today |
|-----------|----------------------|-------|
| `signInWithPassword(email, password)` | delegates to redux `login` thunk (existing `AuthState` lifecycle) | working (mock) |
| `signInWithGoogle()` | `{ status: "not-connected" }` | boundary only |
| `requestPasswordReset(email)` | `{ status: "not-connected" }` | boundary only |

`not-connected` is the honest terminal state for the two future-backend operations while the external backend is deferred (SR-003). No `success`/`failure` shape is fabricated for them; all other result types, payload shapes, and backend contract details are undefined and will be established in the Backend Integration phase.

## 5. State-transition mapping (success criteria)

| SC | Flow | Redux/local transitions involved |
|----|------|---------------------------------|
| SC-001 | Wrong-credentials error | `login` rejected → `AuthState.error` set → sign-in view shows localized error (existing lifecycle reused) |
| SC-002 | Register-standing login | `login` rejected `noAccountWithEmail` → sign-in view shows localized error |
| SC-003 | Duplicate register | `register` rejected `accountExists` → create-account view shows localized error |
| SC-004 | Register→authenticated | `register` fulfilled → `AuthState.user` set → navbar reflects session |
| SC-005 | Google unavailable | `signInWithGoogle` → `{status:"not-connected"}` → localized unavailable message (no state mutation) |
| SC-006 | View/cross-link correctness | `clearError()` on every `AuthViewMode` transition; field/password state reset |
| SC-007 | i18n | no model impact |
| SC-008 | RTL/LTR | no model impact (layout-only) |
| SC-009 | a11y focus | focus helpers on cross-link/field mount; no persistent-state impact |

No persisted-state mutation is introduced anywhere in this feature.