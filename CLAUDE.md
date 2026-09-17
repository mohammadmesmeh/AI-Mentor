# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI Mentor — a Next.js 16 (App Router) frontend for an AI-driven learning-roadmap product. The backend is a separate Laravel 12 / PHP 8.3 REST API (lives in a sibling `Backend/` dir, out of scope here) documented in `API_CONTRACT.md` at the repo root — read it before changing anything in `src/lib/api/`.

## Commands

```bash
pnpm dev          # next dev --turbo
pnpm build        # next build
pnpm lint         # eslint
pnpm test         # vitest run (unit + component tests)
pnpm test:watch   # vitest watch mode
pnpm test:e2e     # playwright test (builds + starts the app first)
```

Run a single Vitest file/test: `pnpm vitest run tests/unit/api/auth.refresh.test.ts` or `pnpm vitest run -t "test name"`.
Run a single Playwright spec: `pnpm playwright test tests/e2e/<file>.spec.ts`.

There is no separate typecheck script — use `pnpm tsc --noEmit` (tsconfig has `noEmit: true`, strict mode on).

Test layout: `tests/unit/**` and `tests/component/**` run under Vitest (jsdom, MSW-mocked API via `tests/msw/`), `tests/e2e/**` runs under Playwright against a real built server. `tests/setup.ts` and `tests/helpers/intl.tsx` provide shared fixtures (the intl helper wraps components with the `next-intl` provider for locale-aware component tests).

## Architecture

### Path aliases
`@/*` → `src/*`, `@tests/*` → `tests/*` (defined in `tsconfig.json`, mirrored in `vitest.config.ts`).

### Routing & i18n
App Router pages live under `src/app/[locale]/(main)/...`. Locale is a required route segment; `src/i18n/routing.ts` declares supported locales (`en`, `ar`) with `ar` as default, and `src/proxy.ts` (next-intl middleware) handles locale negotiation/redirects — it's wired in as Next's middleware despite the filename. Translation strings live in `messages/en.json` and `messages/ar.json` (keep both in sync — nested by feature, e.g. `auth.errors.*`). `ar` is RTL; per the project constitution, new UI must not assume LTR or a single locale.

### State layer (Redux Toolkit)
`src/redux/store.ts` combines plain slices (`appSlice`, `onboardingSlice`, `authSlice`) with a single RTK Query API slice (`src/lib/api/apiSlice.ts`, reducer path `"api"`). Redux/RTK-Query state is a **cache of server responses**, never a source of truth — onboarding completion, auth identity, and roadmap-generation status are always re-derived from the latest API response, not held as client-authoritative flags (see `onboardingSlice`/`authSlice` comments and the constitution's Principle III).

### API client layer (`src/lib/api/`)
This is the most load-bearing part of the codebase — read `API_CONTRACT.md` and the module doc-comments before touching it:

- **`auth.ts`** — the module-level (non-Redux, non-storage) in-memory session store (`getSession`/`setSession`/`clearSession`). Access tokens and refresh tokens are **never** persisted to `localStorage`/`sessionStorage`/Redux — they live only in this module's closure for the life of the tab. `baseQueryWithReauth` wraps every request: on a `401 unauthenticated`, it triggers `refreshSession()`, which serializes concurrent refresh attempts behind one shared promise (`refreshPromise`) so only one `/auth/refresh` call is ever in flight — every other caller awaits the same promise and gets the atomically-replaced token pair. A refresh that fails with `access_denied`/`validation_failed` clears the session and signs the user out; a refresh that fails for `unavailable`/`rate_limited`/network reasons preserves the existing tokens instead of signing out. The base query also unwraps the server's `{data, meta}` envelope and converts all response keys from snake_case to camelCase in one place (`snakeToCamel`) — endpoint code never does its own key mapping.
- **`errors.ts`** — maps every failure (server error envelope *and* raw network/fetch failures) to one `ApiError` shape with a stable `category` (`invalid_input` | `access_denied` | `not_found` | `conflict` | `rate_limited` | `unavailable` | `unexpected`). UI code should branch on `category`/`code`, never on the raw server `message` (that string is for logs/support only — see FR-018 in the spec). `isRetryableCategory` gates automatic retry.
- **`apiSlice.ts`** — the RTK Query endpoint definitions. Notable conventions: read-only `GET` requests get a bounded 2-attempt retry with backoff for retryable error categories (`apiBaseQuery`); mutations never auto-retry (an idempotency key alone doesn't make a blind retry safe — failures are surfaced to the caller instead); endpoints that map a specific "not found" error code to a valid empty state (`getPreferences`, `getLearningProfile`) use a custom `queryFn` rather than `query`, so a 404-shaped business state doesn't get treated as a request failure.
- **`idempotency.ts`** — generates idempotency keys matching the contract's `^[a-zA-Z0-9._:-]{8,128}$` format for mutating requests that need duplicate-safe retries (e.g. roadmap generation requests).
- **`types.ts`** — shared wire/domain types consumed across slices and components.

### Feature/shared split
- `src/features/<domain>/` (`auth`, `onboarding`, `dashboard`, `home`) — feature-scoped `components/`, `services/`, `validation/` (yup schemas + react-hook-form), `types/`, and `lib/`. Page-level composition typically lives under `components/pages/`.
- `src/shared/` — cross-feature UI: `components/ui` (design-system primitives), `components/layout` (navbar/footer/shell), `components/animations` (Framer Motion / GSAP wrappers), `components/providers`, `hooks/`.
- `src/components/ui/` (top-level, outside `shared/`) holds shadcn/ui-generated primitives.

### Spec-driven workflow
This repo uses [spec-kit](.specify/) (`speckit-*` skills / `/speckit.*` slash commands). Each feature has a numbered folder under `specs/NNN-feature-name/` containing `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `tasks.md`. Before implementing a feature-sized change, check whether a spec folder already exists for it — the plan/data-model/contracts documents there are the authoritative design, not something to re-derive from scratch.

### Project constitution
`.specify/memory/constitution.md` defines binding engineering principles for this repo (security/privacy boundaries, frontend/backend separation, client state as cache not source-of-truth, AI output treated as untrusted, provider replaceability, idempotency/concurrency safety, i18n/RTL as first-class, scope discipline). It is consulted explicitly during `/speckit.plan` ("Constitution Check" gate) — when in doubt about an architectural choice in this repo, this document has priority over ad hoc convention.
