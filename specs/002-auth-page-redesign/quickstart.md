# Quickstart: Auth Page Redesign (/auth Sign In)

**Branch**: `002-auth-page-redesign` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md) | **Tests**: [../checklists/requirements.md](../checklists/requirements.md) → `tasks.md` (Phase 2)

How to run, validate, and manually smoke-test the redesigned `/auth` page.

## Prerequisites

- Node.js + npm installed; dependencies installed (`npm install`).
- No environment variables are required for this feature (frontend-only, no backend, no `.env`).

## Commands

| Task | Command | Expect |
|------|---------|--------|
| Dev server | `npm run dev` | App at `http://localhost:3000` |
| Lint | `npm run lint` | Pass (0 errors) |
| Build (typecheck + production build) | `npm run build` | Pass; auth page included |
| Preview | `npm run start` | Serves the production build |

## URLs

- `http://localhost:3000/en/auth` — English, LTR
- `http://localhost:3000/ar/auth` — Arabic, RTL
- `http://localhost:3000` — root → redirects per `middleware`/locale routing

## Manual smoke scenarios

Each scenario maps to a success criterion (SC) and user story (US) from the spec.

### A. Readiness / parity

1. **Layout parity (SC-001/DR-001–DR-004)** — `/en/auth`: entire prototype composition is rendered (ambient panel + form panel on desktop; stacked, form-first below ~1024px). No layout overflow at 360px, 768px, 1280px.
2. **Theme parity (SC-002/DR-005)** — Toggle dark and light theme: contrast (WCAG AA) holds, all text readable, no forced-light injections.

### B. Sign-in flow (US1, FR-002, SC-001)

3. **Wrong credentials**: submit valid-format email + wrong password → localized error surfaces and focus returns to the appropriate field (existing thunk behavior preserved).
4. **Success**: submit registered mock account (`ai-mentor-auth` in localStorage) → authenticated; navbar reflects session.

### C. Account creation flow (US3, FR-003, SC-003)

5. **Cross-link navigation (SC-006)**: from sign-in, "Create an account" opens the create-account view in-band, clears any prior error, focus moves correctly.
6. **Duplicate**: register an email already in `ai-mentor-auth` → localized `accountExists` error.
7. **Success**: valid new account → `AuthState.user` set; navbar reflects session.

### D. Password recovery + Google (US4/US6, FR-007/FR-008, SC-005)

8. **Recovery unavailable**: open recovery view ("Forgot your password?"), submit an email → localized "not available yet" state appears (`authService.requestPasswordReset` = `{status:"not-connected"}`); **no** confirmation of a sent email.
9. **Google unavailable**: click "Sign in with Google" → localized "not available yet" state appears (`authService.signInWithGoogle` = `{status:"not-connected"}`); no auth state change.

### E. i18n, a11y, reduced motion (IR/RR/AR, SC-007/SC-008/SC-009)

10. **RTL**: repeat key scenarios on `/ar/auth`; layout mirrors via logical properties, strings translate, no physical-direction leaks.
11. **Keyboard**: entire page operable by Tab/Enter/Space; focus-visible rings visible; cross-links and Google button focusable; password toggle sets `aria-pressed` and switches input type.
12. **Screen reader (spot)**: view headings and error regions have appropriate roles/labels; cross-links announce destination.
13. **Reduced motion**: with `prefers-reduced-motion`, FadeInView/scroll animations run without motion; no content is hidden from animation.

## Regression checklist

- [ ] Existing `LoginForm`/`RegisterForm` submit, validation, and error lifecycle unchanged (R6, FR-002/FR-003).
- [ ] `(auth)` layout (no global navbar/footer) still wraps the page.
- [ ] Devtools console shows no errors; localStorage `ai-mentor-auth` untouched by view switching.
- [ ] `Backend/` contents unchanged (still `.gitkeep`).

## Validation order (narrow → broad)

1. `npm run lint`
2. `npm run build`
3. Manual scenarios A–E above

Tests: no dedicated unit/E2E runner is configured; the manual matrix above is the feature's test plan (`tasks.md` will break it into runnable steps). Adding a runner is out of scope (OS-007).