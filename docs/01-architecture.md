# AI Mentor — Architecture

## Status

| Area | Status |
| --- | --- |
| Frontend framework: Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS v4 (CSS-first) + shadcn/ui + next-intl + Redux Toolkit + React Compiler | **Implemented** |
| Feature-based folder structure (src/features, src/shared, src/redux, src/app) | **Implemented** — structure convention documented in `STRUCTURE.md`; the actual tree is a lighter application of it (see "Namespace vs reality" below) |
| API client layer (`src/shared/lib/api-client.ts` pattern documented in STRUCTURE.md) | **Not implemented** — no file exists, no `fetch`/`axios` usage anywhere in `src/` |
| Backend: Laravel 12 modular monolith, `/api/v1`, JWT bearer auth, MySQL/Redis/Horizon, Docker | **Under active parallel development by another developer** (not owned by the frontend workstream). The repository contains a real implementation in `Backend/` per `Backend/README.md` and `API_CONTRACT.md` — current implementation evidence, not automatically the final agreed contract. |
| Frontend ↔ backend integration | **Not implemented** — see docs/05 |

## Sources

- `STRUCTURE.md` (documented conventions)
- `src/app/**`, `src/features/**`, `src/shared/**`, `src/redux/**`, `src/i18n/*`, `src/proxy.ts`
- `next.config.ts`, `package.json`
- `AI Mentor — Extracted Product Requirements.md` (frontend/backend requirements)
- `Backend/README.md` (backend architecture), `API_CONTRACT.md`
- `specs/003-learning-dashboard/plan.md` (architecture decisions and the reasons behind them)

## Frontend Architecture

### Stack

- **Next.js 16.2.10** (App Router, Turbopack dev), React 19.2.4.
- **Tailwind CSS v4** — CSS-first configuration in `src/app/globals.css` (`@theme` block). No `tailwind.config.*`.
- **shadcn/ui** (`^4.13.0`) — `src/components/ui/` (e.g., `card.tsx`) plus `shadcn/tailwind.css`.
- **next-intl `^4.13.2`** — `src/i18n/request.ts` (messages + locale + timezone), `src/i18n/routing.ts` (`en`/`ar`, default `ar`, `Asia/Riyadh`), `src/i18n/navigation.ts` (localized `Link`, `usePathname`, `useRouter`).
- **Redux Toolkit `^2.12.0`** + **react-redux `^9.3.0`** — `src/redux/store.ts`, slices in `src/redux/slices/`.
- **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`).
- **Animations**: `framer-motion` (used in home/auth/onboarding and inside the legacy `Button`), `gsap`, `ogl` (WebGL). Dashboard deliberately uses **no** motion architecture (see docs/03).
- **Icons**: `lucide-react`. **Class merging**: `clsx` + `tailwind-merge` via `src/lib/utils.ts` (`cn`).
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `yup`.

### Routing tree (implemented)

```text
src/app/
├── layout.tsx                 # Root layout — loads fonts, <html> dir/lang/class
├── not-found.tsx (global)     # 404 surface
├── [locale]/
│   ├── layout.tsx             # Locale layout: providers, setRequestLocale
│   └── (main)/                # Application route group
│       ├── layout.tsx         # ShellBackground + Navbar + <main id="main-content"> + Footer
│       ├── page.tsx           # Home (marketing)
│       ├── auth/page.tsx
│       ├── onboarding/page.tsx
│       ├── dashboard/
│       │   ├── layout.tsx     # Server — wraps children in <DashboardShell>
│       │   ├── loading.tsx    # Server — route-level skeleton
│       │   └── page.tsx       # Server (setRequestLocale) → <DashboardPage/>
│       └── not-found.tsx
```

- Every page calls `setRequestLocale(locale)` and renders a feature-level client (or server) component.
- Server pages stay thin; the client composition roots live in `src/features/*/components/pages/*`.
- The marketing `Navbar`/`Footer` render only outside `/dashboard` (and the footer already nulls on `/auth`); the dashboard provides its own shell.

### Server/Client boundary

- **Server Components**: route layouts/pages, `dashboard/layout.tsx`, `dashboard/loading.tsx`, `DashboardShell`.
- **Client components** exist only where required: auth forms (interactive), onboarding steps (stateful), `DashboardPage` (reads Redux + localStorage-backed state), `DashboardWorkspaceNav` (uses `usePathname`, drawer interactivity), plus shared chrome (`Navbar`, `Footer`, `ThemeToggle`, `LanguageSwitcher`, `Logo`, `providers`).
- Dashboard sections are props-driven presentational client modules (client-bound because they are children of the client `DashboardPage`; they use no browser APIs or hooks themselves).

### State

| Slice | Location | Behavior |
| --- | --- | --- |
| `auth` | `src/redux/slices/authSlice.ts` | `user`, `isAuthenticated`, `loading`, `error`. Login/register thunks simulate a network call (~1s) against `localStorage["ai-mentor-auth"]`; errors are localized (`noAccountRegisterFirst`, `noAccountWithEmail`, `accountExists`). Logout clears persisted state. |
| `onboarding` | `src/redux/slices/onboardingSlice.ts` | `currentStep`, `domain`, `level`, `timeCommitment`, `timeCustomDescription`, `successGoal`, `learningPreferences`, `isComplete`, `roadmap: string[] \| null` (milestone title keys — the `setRoadmap` action exists but no current code path dispatches it, so this stays `null`; see docs/03 "Known inconsistencies"), `submitStatus` (`idle\|submitting\|succeeded\|failed`), `submitError`. Only `isComplete` is persisted, under `localStorage["ai-mentor-onboarding-complete"]`; the rest is in-memory session state. |
| `app` | `src/redux/slices/appSlice.ts` | Theme preference (`dark` default), persisted under `localStorage["ai-mentor-theme"]`. |

State-changing operations are **not** persisted synchronously in a DB: the app is a mock/frontend-only product until the backend integration phase (docs/05).

### i18n plumbing

- `next.config.ts`: `next-intl` plugin → `src/i18n/request.ts`.
- `src/proxy.ts`: `export default createMiddleware(routing)` with matcher `/((?!api|trpc|_next|_vercel|.*\\..*).*)`. Note: `api`/`trpc` are excluded — a deliberate carve-out for future API routes; none exist today.
- `useT(namespace)` hook (`src/shared/hooks/useT.ts`) wraps `useTranslations`; components call `t(key, fallback)`.

### Folder conventions (documented in STRUCTURE.md) vs reality

`STRUCTURE.md` documents a feature-based layout (features own `components/hooks/api/store/validations/types`; shared code in `shared/`; a `src/types`, `src/styles`, `src/messages` split; barrel `index.ts`; service-layer `api/` folders; Zod schemas). The actual repository applies a lighter, consistent version:

| STRUCTURE.md documents | Reality |
| --- | --- |
| `features/<feature>/api/` per feature | **Not present** — there is no API layer yet (documented in docs/05). |
| Route handlers in `src/app/api/` | **Not present** — none exist yet. |
| `src/middleware.ts` for next-intl | `src/proxy.ts` (Next.js 16 Proxy/Middleware equivalent). |
| `messages/` under `src/` | Messages live at the repo root in `messages/`. |
| Zod schemas in `features/<feature>/validations/` | Schemas use **yup** (`loginSchema`, `registerSchema`) inside `features/auth/components/views/` or a `schemas` folder. |
| `shared/ui/` folders | shadcn/ui primitives in `src/components/ui/`; shared chrome in `src/shared/components/layout/` and `src/shared/components/ui/`. |
| Dashboard file names (plan) | Implemented as `features/dashboard/components/{app-shell,sections,states,pages}`. |

New work should follow the **actual** conventions in the codebase (see the existing `auth`/`onboarding`/`dashboard` features) while remaining compatible with `STRUCTURE.md`'s placement rules.

## Feature Boundaries

```text
app/ (composition roots, thin)
  → features/{auth,onboarding,dashboard,home}/  (domain components, state access)
    → shared/                                   (reusable UI, layouts, hooks, providers)
      → components/ui/                          (shadcn primitives)
      → lib/                                    (cn, utils)
      → redux/                                  (store + slices)
```

Rules relied upon by the codebase:

- Pages only import from `features/`, `shared/`, `components/ui`, or `redux/`.
- Shared components never import from features (no backward coupling).
- Presentation is separated from data access: dashboard sections take props; `DashboardPage` is the single client composition root that reads Redux.
- No access control, ownership, or business validation happens in the UI (the UI is never a security boundary).

## Backend Architecture (`Backend/`, under active parallel development by another developer — implementation evidence, not automatically the final agreed contract)

- **Modular monolith** (Laravel 12 / PHP 8.4 image, NGINX + FPM; MySQL 8.4; Redis 7.4; Horizon; scheduler; Docker Compose with named volumes).
- Modules: `Identity` (users, auth, preferences), `LearningProfile`, `Roadmap` (lifecycle, immutable versions, ordered stages, single-active-roadmap rule via `UNIQUE (user_id, active_slot)`), `TaskExecution` (task taxonomy, task state, replacements, dependencies), `Shared` (HTTP transport).
- Presentation calls Application; Application coordinates Domain rules; Infrastructure provides Eloquent. Domain does not depend on HTTP.
- Identifiers are **ULIDs**; timestamps UTC; MySQL is the source of truth; Redis backs queues/cache/Horizon/denylist.
- Auth: **JWT bearer** (`auth:jwt`), 15-minute HS256 access tokens, opaque 30-day rotating refresh tokens (SHA-256 hashes only; family revocation on reuse); logout revokes family and deny-lists `jti`/`sid`; fails closed on Redis unavailability. No Sanctum, cookies, CSRF, or sessions.
- Deployment: production image runs as `www-data`, migrations run as a separate release job, TLS terminates at the platform.

> **Reconciliation status**: JWT bearer is the current backend implementation and the frontend's provisional working assumption for new documentation/spec work. This is not a finalized decision — the final authentication architecture remains pending reconciliation with the backend developer (a previously-considered frontend-side alternative was Sanctum SPA + HttpOnly cookies).

See `Backend/README.md` for ADRs (modular monolith, ULIDs, single-active-roadmap, generation-request concurrency, JWT) and the full data model.

## Data Ownership & Integrity (Product Rule)

- Each user owns only their own learning data (roadmaps, tasks, progress, chat, resources, account). Backend authorization derives ownership from the authenticated user; client-provided IDs/ownership fields must never be trusted. UI visibility is never authorization.
- The persisted roadmap is the source of truth; it is never regenerated per request and never silently replaced. AI-generated content must pass schema → semantic → business-rule validation before persistence.
- Roadmap lifecycle: one active roadmap per user (MVP); regeneration only before learning begins; later significant changes via adaptation proposal (approval required) or reset-and-rebuild.

## Cross-Cutting Concerns

- **Theme**: dark-first (see docs/02) — tokens default to dark; `.light` opt-in.
- **RTL**: `html[dir="rtl"]` drives the Arabic font switch and typography overrides; logical properties (`ms-`/`me-`, `start`/`end`) everywhere; no hardcoded physical alignment.
- **Reduced motion**: global `prefers-reduced-motion` CSS rule in `globals.css` neutralizes CSS animations/transitions; dashboard avoids JS animation to begin with.
- **Error handling**: per-layer states (loading / empty / unavailable / error). The dashboard uses an explicit `SectionState` renderer because several sections have no data source yet and degrade gracefully rather than fabricating content.

This document intentionally does not invent endpoints, contracts, or state shapes; see `docs/05-api-integration.md` for what the backend actually provides and the current gaps.