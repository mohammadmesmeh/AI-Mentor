# Research: Learning Dashboard (003)

Phase 0 of `/speckit.plan` — resolves the technical unknowns named in the plan template and the spec's Verify-During-Planning items (VR-001..VR-008). Findings and decisions are input to `plan.md`, `data-model.md`, and `contracts/learning-workspace-service.md`.

**Date**: 2026-09-12 · **Branch**: `003-learning-dashboard` · **Spec**: [spec.md](./spec.md)

---

## 1. Language / Version

**Unknown: exact language and version.**

- **Resolution**: TypeScript 5, React 19.2.4, Next.js 16.2.10 (App Router, Turbopack build).
- **Evidence**: `package.json` (`next ^16.2.10`, `react ^19.2.4`, `typescript ~5`, `pnpm` scripts `dev/build/start/lint`); all feature pages use App Router file conventions (`page.tsx`), `setRequestLocale(locale)`, and `@/i18n/navigation`.

## 2. Primary Dependencies

**Unknown: libraries used.**

- **Resolution**: next-intl 4.13.2 (i18n; `useT`/`useTranslations`/`Link`/`usePathname`/`useRouter` from `@/i18n/navigation`), @reduxjs/toolkit 2.12 + react-redux 9.3 (learner state), framer-motion 12.42 (scoped entrance animations), lucide-react (icons), tailwindcss 4 + `tw-animate-css` (`cn`, design tokens, `dark`/`light` variants), shadcn/ui `Card` (`@/components/ui/card`), cva/clsx/tailwind-merge via `src/lib/utils.ts`.
- **Modification**: **No new dependencies.** Existing stack covers all requirements (decision D1).
- **Rationale (spec)**: PR-001 ("no unnecessary dependencies"), DR-001.

## 3. Storage

**Unknown: where dashboard data comes from (VR-002/VR-003).**

- **Resolution**: Client-only. Redux store (`auth`, `onboarding`, `app` slices) backed by `localStorage` keys `ai-mentor-auth` and `ai-mentor-onboarding-complete`. `onboarding.roadmap` is `string[] | null` (milestone **titles only** — no tasks, lessons, completion, or timestamps exist).
- **Implication (investigation, V1):** The current frontend can authoritatively provide: learner `name` + `email`, learning `goal`, roadmap milestone titles, milestone count, and structural current stage. It **cannot** provide: a current lesson, focus-task entities, AI insight text, recent activity events, or task-completion percentages. These are reported as `unavailable` by the boundary (decision D2).

## 4. Testing

**Unknown: test framework / how to validate (VR-001).**

- **Resolution**: No test runner is configured (`package.json` has no vitest/jest/playwright). Existing validation = `pnpm build` (typecheck + build) + `pnpm lint`. This feature adds **no** test framework (spec PR-001/dependency constraint). Validation approach: lint + build + the manual runnable scenarios in `quickstart.md` (layout, RTL/LTR, all section states, keyboard, reduced motion). Unit tests are recorded as an open item for the future backend/task-logic phase where business-critical logic exists.

## 5. Target Platform

**Unknown: platform/mobile/desktop.**

- **Resolution**: Responsive web (desktop ≥1024px, tablet 768–1023px, mobile <768px), `en` (LTR) and `ar` (RTL) locales. Both the default dark theme and light theme must remain readable — ThemeProvider is **not** changed (decision D4, mirroring the auth precedent).

## 6. Project Type

**Unknown: application type.**

- **Resolution**: Next.js web application (frontend). The Laravel/REST backend defined by the product is a **later, separate phase** — explicitly out of scope here (spec OS-001; going-concern boundary decisions in D2/D3 keep the frontend backend-ready).

## 7. Performance Goals

**Unknown: what performance look like/success criteria.**

- **Resolution**: Primary "Continue Learning" action obvious without a deep scroll on mobile; no horizontal overflow at 320→1440px in either direction; no duplicate requests; no polling; lean client JS (small section components, memoized selectors). Per SC-007, **no** arbitrary/animated numerically fabricated completion indicators (AnimatedNumber/donut variants rejected).

## 8. Constraints

- **Entry gates**: spec FR-010 (no invented behavior/state shapes/endpoints), AR/SR (a11y + accessibility toggles), PR/SR (no fabricated data, server-side ownership), OS-001..005, AGENTS/Constitution (least modification; UI never a security boundary; authoritative state), "usable in the existing dark-default theme", "prefer Server Components".
- **Resolution**: bound all dashboard data reads through the `LearningWorkspaceService` boundary; keep server surfaces server; constrain client components to client-state consumers; keep the feature under `src/features/dashboard/`.

## 9. Scale / Scope

**Unknown: size and boundaries of the deliverable.**

- **Resolution**: One route (`/dashboard` × 2 locales), one shell, seven sections, one boundary service + contract, i18n in both files, minimal changes to two existing layout files (Navbar/Footer gating). No new routes, no backend, no new state slice, no new entities persisted.

---

## 10. Investigation Record (evidence)

- `package.json` → versions/deps/scripts (Sections 1–2).
- `src/redux/store.ts`, `src/redux/slices/authSlice.ts`, `src/redux/slices/onboardingSlice.ts`, `src/redux/slices/appSlice.ts` → state shape & localStorage keys (Section 3). `onboarding.roadmap: string[] | null`.
- `src/app/[locale]/(main)/layout.tsx` → `ShellBackground decor={<AuthAmbientDecor/>}` + `Navbar` + `main#main-content` + `Footer`; `isAuth` via `usePathname().startsWith("/auth")` in the client Navbar (Section 6/decisions D6).
- `src/features/dashboard/components/pages/dashboard-page.tsx` → existing roadmap-list + no-roadmap empty state; `useT("dashboard")`; `Card`/`motion`/`BookOpen`/`Lock`/`Button`.
- `src/shared/components/layout/navbar/Navbar.tsx` → marketing nav (Home/#features/…) + auth-aware actions; gating precedent (isAuth).
- `src/shared/components/...` → `Button` (cva primary/secondary), `Container`, `FadeInView`, `useT`, `LanguageSwitcher`, `ThemeToggle`.
- `src/app/globals.css` → tokens `--color-light-blue-bg`/`--color-light-blue-text`, navy primary family, `progress-track`/`progress-fill` utilities, global `prefers-reduced-motion` CSS rule (line ~99), §7 animations + `ambient-breathe`.
- `messages/en.json`, `messages/ar.json` → `"dashboard"` namespace exists (line 70) and can be extended.
- `specs/002-auth-page-redesign/contracts/auth-service.md` → the boundary-contract precedent the dashboard mirrors (IB-004/IB-005 "not connected / will connect later" adapters).
- `STRUCTURE.md`/existing code cross-check → the documented `shared/layouts/dashboard-layout` / `dashboard-api` / `dashboard-slice` are **intended, not implemented**; the plan does not build them as shared infrastructure (decision D7).

---

## 11. Decisions

### D1 — No new dependencies
Existing stack (next-intl, redux, framer-motion, lucide-react, tailwind tokens, shadcn Card) satisfies every requirement. **Alternatives rejected**: adding a UI chart/donut library (PR-001, SC-007); headless UI for the drawer (native `<button>`, `aria-expanded`, and logical-props nav are sufficient — AR-001..007).

### D2 — Data flows through a single boundary (`LearningWorkspaceService`)
All dashboard reads go through one frontend integration boundary (contract: `contracts/learning-workspace-service.md`). The current adapter maps what redux/localStorage authoritatively holds and returns structured `unavailable` results for: current lesson, focus tasks (no task entities), AI insight, recent activity, completion percentage. **Rationale**: honest state (spec FR-005/006/007), constitution (authoritative state, no fabrication), auth-service.md precedent, backend-readiness. **Alternatives rejected**: (a) fabricate demo lesson/tasks/insight — violates SR & constitution; (b) block the dashboard until the backend exists — regresses existing value; (c) skip the section renderers entirely — the spec's states must be demonstrable.

### D3 — Continue Learning & Progress use truthful semantics
- Continue Learning: rendered from the boundary result. `unavailable` → the spec's "no current lesson" state with the primary CTA still present and pointing at the roadmap overview inside the workspace (preserves the existing roadmap list value). When a backend later reports a real lesson, **the same component** shows it — adapter-only change.
- Progress: only structural truth is shown today — stage count and the current stage label derived from `onboarding.roadmap` (first milestone = current/in-progress, matching the existing dashboard), milestone list preserved. **No completion percentage/velocity number** until persisted per-task completion exists (spec FR-006, SC-007). The task-based progress/velocity contract is defined for the future backend (data-model §5, contract §4.3).
- **Alternatives rejected**: pretend lesson exists / splice tasks from strings / compute fake %.

### D4 — Application shell inside the existing route group (Least Modification)
`dashboard/layout.tsx` (server) wraps children in `DashboardShell` (client), which provides sidebar + header + main. Global marketing Navbar returns `null` on `/dashboard`, and Footer's existing `/auth` gate is extended to `/dashboard`. No new route group, no change to `(main)/layout.tsx` shell structure, no Token changes. **Rationale**: spec Section 1; auth precedent for gating; least-modification constitution. **Alternatives rejected**: new `(workspace)` route group (architecturally heavier than needed); keeping the marketing Navbar in the workspace (marketing nav is inappropriate for the learning workspace).

### D5 — Client/server split & deliberate motion handling
Sections that consume client-held state are client components (required — data source is redux/localStorage this phase). Static chrome (route `loading.tsx`, segment `layout.tsx`, page wrapper) stays server. Motion: the global CSS `prefers-reduced-motion` rule (globals.css ~line 99) neutralizes **CSS** animations but does **not** govern framer-motion's JS-driven animations, so the dashboard wraps motion usage in `<MotionConfig reducedMotion="user">` (or `useReducedMotion`) — satisfying AR-005 robustly. **Alternatives rejected**: force everything into Server Components by caching mock data server-side (would fabricate + diverge from current-feature pattern).

### D6 — Shell chrome reuse, not duplication
`DashboardHeader` reuses `Logo`, `LanguageSwitcher`, `ThemeToggle`; `DashboardSidebar` uses the shared `Button`. Navigation items are restricted to **existing destinations**: `Overview` (`/dashboard`, active) and `Home` (`/`, leave workspace). **No** Roadmap/Mentor/Activity nav items are added because those pages do not exist (no invented routes — FR-010). **Alternatives rejected**: adding dead nav destinations.

### D7 — No shared-infrastructure extraction
`STRUCTURE.md`'s `shared/layouts/dashboard-layout`, `dashboard-stats`, `dashboard-api`, `dashboard-slice` are intended-but-unimplemented. The feature keeps its shell/components under `src/features/dashboard/` and does **not** create shared infrastructure now (a shared abstraction needs a second consumer — the future backend-driven revamp can extract it then). **Alternatives rejected**: proactive extraction (premature abstraction; contradicts constitution).

### D8 — Loading/error states are contract-shaped, not faked
The current adapter is synchronous and cannot fail; loading and error/retry states exist in the **UI contract** (`SectionState`: skeleton / empty / unavailable / error+retry) so an async backend adapter can drop in without UI churn. The UI never enters loading/error under today's adapter — no fake delays or injected failures (honest states; SC-010).

---

## 12. Verify-During-Planning outcomes (VR mapping)

| Item | Resolution |
|---|---|
| VR-001 (testing approach) | No test runner configured; `pnpm build` + `pnpm lint` + `quickstart.md` manual scenarios (research §4). |
| VR-002 / VR-003 (data source) | Client redux + localStorage; authoritative fields enumerated (research §3); boundary adapter (D2). |
| VR-004 (server/client split) | Server: page/layout/loading. Client: shell + 7 sections (client-held data) (D5). |
| VR-005 (progress forgiveness/evidence) | Structural stage vs. task-based %: only structural today; contract defines future task-based velocity (D3, data-model §5). |
| VR-006 (focus task cap) | Constant `FOCUS_TASK_LIMIT = 3`; UI caps at that (spec §4/SS story 3). |
| VR-007 (service availability) | `SectionState` unavailable/error/retry defined; retry hook wired for async adapter drop-in (D8). |
| VR-008 (i18n/RTL/responsive/a11y) | `dashboard` namespace in both files; logical properties; 3-tier responsive; `MotionConfig reducedMotion="user"` (D5, D6). |

## 13. Open Items

- **Dev-flow unit tests**: deferred to the future backend/task-logic phase (no runner configured today; not introduced per dependency constraint).
- **Progressive session resume** (spec Q1/A6): runtime-specific, deferred — the boundary already models a current-lesson concept a backend can fulfill.
- **Backend integration**: separate feature phase; the boundary contract names the endpoints/entities to be built then (spec OS-001).