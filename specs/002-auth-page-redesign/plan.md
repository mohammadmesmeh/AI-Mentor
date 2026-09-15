# Implementation Plan: Auth Page Redesign (/auth Sign In)

**Branch**: `002-auth-page-redesign` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auth-page-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Redesign the existing `/auth` page (currently a single centered column with a login/register tab toggle) to match the supplied Sign In prototype as a theme-aware, i18n-correct, accessible two-column layout with three view modes — sign-in, account-creation, and password-recovery — plus a visible "Sign in with Google" affordance.

**Primary requirement**: The redesign is FRONTEND-ONLY. The existing localStorage-backed redux auth mock (`login`/`register` thunks) is preserved unchanged for email/password flows. Google OAuth and password recovery are implemented as explicit frontend integration boundaries (documented in `contracts/auth-service.md`) with "not connected" adapters that surface a localized unavailable state — never fake authentication. The external backend is integrated in a later phase without reworking the UI beyond swapping the adapter.

**Technical approach** (from research): reuse the existing `Button`, `Container`, `FormField`, `FadeInView` primitives and the `(auth)` route-group layout (no global navbar/footer); map prototype colors onto existing design tokens; build the two-column/stacked layout with logical properties for RTL; theme-aware tokens so the page renders correctly in the app's default dark theme and light theme; route view switching through a single `AuthForm` view controller with cross-links (`Create an account`, `Forgot your password?`, `→ Sign in`).

## Technical Context

**Language/Version**: TypeScript `^5`; Next.js `16.2.10` (App Router) + React `19.2.4`; Turbopack build (`next build`)

**Primary Dependencies**: `next-intl ^4.13.2` (i18n/LocaleSwitcher), `@reduxjs/toolkit ^2.12.0` + `react-redux` (auth state), `react-hook-form` + `yup` (form validation), `class-variance-authority`, `framer-motion`, `lucide-react`, `tailwindcss ^4` (design tokens/utilities)

**Storage**: No database in this feature. Auth persistence remains the existing localStorage-backed redux mock (`ai-mentor-auth`); deliberately preserved until the external backend is integrated later.

**Testing**: No test runner is configured in `package.json` (no vitest/jest/playwright). Validation = `npm run lint` + `npm run build` (Next.js typecheck + build) + documented manual smoke scenarios in `quickstart.md`. Unit/E2E test commands are N/A unless a runner is added.

**Target Platform**: Web (Next.js SSR + client hydration), modern evergreen browsers, locales `en`/`ar`, LTR + RTL.

**Project Type**: Web application — frontend only for this feature.

**Performance Goals**: No new runtime dependencies; no new fonts or global tokens; no heavy client bundles added; the page must lint and build cleanly with the existing dependency set.

**Constraints**: Theme-aware (app default = dark `--bg-base #0a0d14`; must also hold in light theme); RTL/LTR first-class (logical properties); all strings via `next-intl` (`auth` namespace); no backend work; no `.env`/secrets; preserve existing mock auth behavior; no new routes (single `/auth` with view modes); `motion-reduce` respected.

**Scale/Scope**: One route (`/en|/ar/auth`) with 3 view modes + Google boundary; 6 user stories (US1–US6); success criteria SC-001–SC-009; integration boundaries IB-001–IB-005.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**G1 — Security, Privacy, Data Ownership (Constitution I)**: Frontend-only; no new outbound requests; no credentials/secrets (SR-002); no fake auth (SR-003); no client-side authorization decisions (SR-005). OAuth/recovery boundaries surface "not connected" and never mutate state.
→ **PASS**

**G2 — Separation of Responsibilities and Architectural Boundaries (II)**: UI stays in `features/auth`; the future OAuth/recovery integrations are isolated behind `authService` boundary interfaces (FR-009); the frontend does not reach into provider SDKs or hardcode provider URLs (SR-004). No backend code is created in this feature.
→ **PASS**

**G3 — Data Integrity and Authoritative Application State (III)**: No persisted-state changes; the existing mock auth + onboarding state semantics are preserved exactly (FR-002/FR-003, SC-006). The known limitation (auth authority still backed by localStorage until the external backend lands) is content-scoped: explicitly deferred to the later backend phase, not expanded here.
→ **PASS (with noted limitation)**

**G4 — Internationalization, Responsiveness, Inclusive UX (VIII)**: IR-001–003, RR-001–003, AR-001–006 all enforced in the redesign (both locales, both directions, theme-aware, keyboard + reduced-motion).
→ **PASS**

**G5 — Explicit Scope and Controlled Product Changes (X)**: OS-001–005 explicit; no backend, no routes, no deps, no marketing metrics. Registration entry changes from tab toggle to cross-link per clarification Q2 (approved product change).
→ **PASS**

**G6 — Reuse First / Maintainability (IX)**: Reuses `Button`, `Container`, `FormField`, `FadeInView`, existing auth slices/schemas/types. No new abstraction beyond the two documented boundary interfaces.
→ **PASS**

*If any gate had failed, the plan would ERROR rather than proceed; none failed.*

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-page-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── auth-service.md  # Frontend auth-service boundary contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/[locale]/(auth)/               # Route group — renders WITHOUT navbar/footer (existing)
├── layout.tsx                        # (existing) flex-1 main shell — unchanged
└── auth/
    └── page.tsx                      # (existing) server page → <AuthPage/> — unchanged

src/features/auth/                    # Auth feature slice (Feature-Sliced)
├── components/
│   ├── pages/
│   │   └── auth-page.tsx             # REWORK: two-column responsive scaffold (brand + form panels)
│   ├── AuthForm.tsx                  # REWORK: view controller (sign-in | create-account | recovery) + cross-links
│   ├── LoginForm.tsx                 # PARTIAL: reuse as the sign-in view (add password toggle, Google button, links)
│   ├── RegisterForm.tsx              # (existing) account-creation view — unchanged internally
│   ├── FormField.tsx                 # (existing) — unchanged
│   ├── social/
│   │   └── GoogleSignInButton.tsx    # NEW: localized Google button → authService.signInWithGoogle()
│   └── recovery/
│       └── RecoveryView.tsx          # NEW: recovery view → authService.requestPasswordReset()
├── services/
│   └── authService.ts                # NEW: boundary interface + "not connected" adapters (IB-004/IB-005)
├── types/auth.types.ts               # EXTEND: boundary result types, view mode type
├── validation/
│   ├── loginSchema.ts                # (existing) — unchanged
│   └── registerSchema.ts             # (existing) — unchanged

messages/
├── en.json                           # EXTEND auth namespace (google, recovery, view-switch, unavailable)
└── ar.json                           # EXTEND auth namespace (Arabic equivalents)
```

**Structure Decision**: Maximal reuse of the existing `features/auth` slice and shared `ui` primitives; the only new files are the two boundary-driven views (`social/GoogleSignInButton.tsx`, `recovery/RecoveryView.tsx`), the boundary module (`services/authService.ts`), and i18n additions. No new directories at the app root; no layout/shared changes.

## Complexity Tracking

> No Constitution violations to justify — this table is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Artifacts (Phase 0 & 1)

- **Phase 0** → `research.md` (decisions: layout pattern, theme strategy, boundary-adapter pattern, view-switch pattern, password-toggle a11y)
- **Phase 1** → `data-model.md` (view/state model + boundary result model), `contracts/auth-service.md` (frontend auth boundary contract), `quickstart.md` (validation scenarios)