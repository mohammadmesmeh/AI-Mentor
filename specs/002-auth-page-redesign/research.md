# Research: Auth Page Redesign (/auth Sign In)

**Branch**: `002-auth-page-redesign` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

Resolves the technical unknowns from Technical Context. Format: Decision / Rationale / Alternatives considered.

---

## R1 — Two-column auth layout and responsive/RTL behavior

**Decision**: Desktop (≥1024px) grid of two panels — a brand/ambient panel + a form panel — collapsing to a single column below the breakpoint with the form panel first in reading order. Layout uses flex/grid with **logical properties** (`start`/`end`, `ps-`/`pe-`, `text-start`) so the mirroring works automatically in RTL; no physical `left`/`right`/`pl-`/`pr-` on the column arrangement.

**Rationale**: Matches DR-003; logical properties are the established project norm for RTL (homepage uses `*-start/*-end`); the form-first reading order preserves the primary task (sign in) above the fold on mobile.

**Alternatives considered**: Fixed physical columns (rejected — breaks RTL); single always-centered column (rejected — diverges from the prototype's two-panel composition).

---

## R2 — Theme strategy for a light-background prototype on a dark-default app

**Decision**: Build exclusively with theme-aware tokens (`bg-card`/`surface`, `text-foreground`, `text-muted-foreground`, `bg-muted`, existing `input` styling, `FormField`, accent/secondary tokens). No new global tokens and **no** forced light mode; the page must read correctly in the default dark theme and in light theme. If the ambient second panel needs a distinct surface, reuse the existing `dark-section`/card pattern rather than inventing a palette.

**Rationale**: DR-005 documents the conflict; the ThemeProvider default is dark and the Constitution forbids theme-behavior changes. Prototype hexes map to existing tokens per DR-002 (e.g., `#12314D` → `primary-900`, `#0A2540` → `midnight`/`primary-950`, badge blues → `light-blue-bg`/`light-blue-text`).

**Alternatives considered**: Forcing `light` on `/auth` (rejected — changes app-wide theme behavior); adding prototype-only hex tokens globally (rejected — OS-004, DR-002).

---

## R3 — "Not connected" boundary adapter (Google OAuth + password recovery)

**Decision**: Define a single frontend auth-service boundary (`services/authService.ts`) with the interface shape `signInWithPassword` (delegates to existing redux `login`), `signInWithGoogle(): Promise<GoogleSignInResult>`, and `requestPasswordReset(email): Promise<PasswordResetResult>`. The shipped adapters for the two future-backend methods resolve synchronously with `{ status: "not-connected" }`. UI maps that result to the localized "integration not available" message. A later backend phase swaps only the adapter implementation; the UI and contracts do not change.

**Rationale**: Fulfils FR-007/FR-008/FR-012/FR-013 and SR-003 (never fabricate success); isolates provider/backend detail behind a boundary (FR-009, Constitution II); keeps the redesign testable and honest while the real backend is external/deferred.

**Alternatives considered**: Rendering the controls as disabled placeholders (rejected — user wants real affordances with defined boundaries, not inert elements); hardcoding provider URLs/SDK (rejected — SR-004, OS-004).

---

## R4 — View switching model (sign-in / account-creation / recovery)

**Decision**: One client component (`AuthForm`) holds `viewMode: "sign-in" | "create-account" | "recovery"` and renders the matching view. Navigation happens by cross-links/buttons with localized labels — "Create an account", "Forgot your password?", "→ Back to sign in" — inside the same `/auth` page (no route change). Switching invokes the existing `clearError()` dispatch (preserving current behavior) and resets transient local state (password visibility), per the edge-case requirement.

**Rationale**: US3/US4/US6 and FR-006; preserves `clearError()` semantics (FR-004) and keeps the page a single route (OS-002 resolved).

**Alternatives considered**: Separate routes per mode (rejected — OS-002); the legacy segment tab-toggle (rejected — clarification Q2 replaced it with cross-links).

---

## R5 — Password visibility toggle accessibility

**Decision**: A small icon button inside the password field (start/end side per locale) with `aria-pressed` reflecting masked/unmasked state and a localized `aria-label` ("Show password"/"Hide password"). It only toggles `input.type = "password" | "text"`; validation errors and focus are unaffected (AR-003, US6 edge case).

**Rationale**: Native-button semantics, keyboard operable, and screen-reader state exposed — meets AR-002/AR-003 without a custom widget library.

**Alternatives considered**: Native `checkbox` "show password" (rejected — differs from prototype affordance); custom div toggle (rejected — AR-002 native semantics).

---

## R6 — Validation & state-handling preservation

**Decision**: No changes to `loginSchema`/`registerSchema`, `react-hook-form` wiring, or the redux thunks. The sign-in and account-creation views keep the exact current submit/pending/rejected lifecycle; only layout and entrance animation change.

**Rationale**: FR-002/FR-004/FR-005 and SC-006 require behavior preservation; touching schema/reducer logic is out of scope and adds regression risk with no frontend-redesign payoff.

**Alternatives considered**: Centralizing form state into a shared hook (rejected — unnecessary abstraction, Constitution IX).

---

## Consolidated Decisions

| # | Topic | Choice |
|---|-------|--------|
| R1 | Layout | Two-column logical-property grid → stacked, form-first below desktop |
| R2 | Theme | Theme-aware tokens only; no forced theme, no global tokens |
| R3 | OAuth + recovery | `authService` boundary with `not-connected` adapters; backend swapped later |
| R4 | View switching | Single-page view controller with cross-links + `clearError()` |
| R5 | Password toggle | Icon button, `aria-pressed`, localized labels |
| R6 | Validation/state | Existing schemas, thunks, and lifecycle untouched |