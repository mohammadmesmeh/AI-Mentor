# AI Mentor — Project Overview

## Status

| Area | Status |
| --- | --- |
| Frontend application (routes, i18n, theme, layouts) | **Implemented** |
| Home page (marketing) | **Implemented** |
| Auth UI (sign in / create account / recovery) | **Implemented** — frontend mock only; backend contract exists but is **not integrated** |
| Authentication architecture | Current backend implementation: **JWT Bearer**. Frontend documentation uses JWT as a **provisional working assumption**, matching the current backend. **Final architecture is pending reconciliation** with the backend developer (a previously-considered alternative was Sanctum SPA + HttpOnly cookies) — not yet a confirmed decision. |
| Onboarding flow (6 steps, single final confirmation) | **Implemented** — frontend mock only; submission always returns an honest `not-connected` failure state with retry (no fabricated success, no backend call, no roadmap written) |
| Learning Dashboard (shell + sections + states) | **Implemented** — honest `unavailable` states used for data the product does not yet model |
| Dashboard data (current lesson, focus tasks, AI insight, activity, completion metrics) | **Backend-dependent** — not modeled in the current backend implementation; no reconciled contract exists (see docs/05) |
| Backend API (Laravel 12) | **Under active parallel development by another developer** (not owned by the frontend workstream). The repository contains a real implementation — identity, preferences, learning profile, onboarding status, roadmap generation request, roadmap retrieval — but this is current implementation evidence, not automatically the final agreed contract; external AI, chat, progress, resource discovery deferred |
| Backend API → frontend integration layer | **Not implemented** — the frontend has no API client, no `NEXT_PUBLIC_*` env usage, and no `fetch`/`axios` calls; integration is deferred until the backend contract is agreed/reconciled |
| Test runner | **Not configured** — no Vitest/Jest/Playwright in the project |

Read the docs below in order: `00` (this file) → `01` (architecture) → `02` (design system) → `03` (dashboard) → `04` (auth) → `05` (API integration) → `06` (development rules) → `07` (validation checklist).

## Sources

- `AI Mentor — Extracted Product Requirements.md` (root)
- `README.md` (root — default create-next-app boilerplate, not product documentation)
- `STRUCTURE.md` (root)
- `AGENTS.md`/`AGENTS.md.backup`, `.specify/memory/constitution.md` (referenced)
- `specs/001-home-page-specification/`, `specs/002-auth-page-redesign/`, `specs/003-learning-dashboard/`
- `src/app/**`, `src/features/**`, `src/shared/**`, `src/redux/**`, `src/i18n/*`, `src/proxy.ts`, `next.config.ts`, `package.json`
- `API_CONTRACT.md` (root), `Backend/README.md`

## Product Purpose

AI Mentor is a personalized learning platform that builds a learner's road map from their goal, current level, available time, and learning preferences, then guides them through stages and tasks. The core product flow:

> **User defines a goal → the system understands the user's level and available time → AI generates a roadmap → the backend validates and persists it → the user learns and completes tasks → the system tracks progress → the Mentor provides contextual guidance → AI proposes adaptations when needed → the user accepts or rejects the proposed changes.**

The platform is domain-agnostic (programming, design, marketing, languages, business, career switching, skill development, and other domains).

## MVP Scope

### In scope (per requirements)

- Account registration, authentication, sign out, account deletion, data retention policy, per-user data ownership.
- Initial onboarding: learning goal, self-assessed level, available time. The system uses onboarding information when generating the learning plan.
- AI-generated, personalized learning road maps, divided into stages containing tasks. Road maps persist as durable application data; the persisted roadmap is the source of truth and must not be regenerated on every request. One active roadmap per user in the MVP.
- Task types: Read, Watch, Quiz, Project, Assignment, Coding Challenge. Task states include pending/complete/skipped/replaced/removed with required vs effective classification. Completion is declaration-based (no mandatory AI grading or proof in the MVP); tasks have equal weight unless defined otherwise. A stage is complete when all required and effective tasks in it are complete.
- Task skip workflow with optional recorded reason; the Mentor may recommend keep/replace/skip.
- Task-based progress that accounts for completed, skipped, replaced, removed, optional, and later-added tasks.
- Streaks (a streak day = at least one task completed in a calendar day; defined user timezone; no automatic rescheduling).
- Goal change → roadmap rebuilt via a defined lifecycle; roadmap reset (explicitly destructive); regeneration only before learning begins; later significant changes via an adaptation proposal or reset-and-rebuild.
- AI Mentor: ask questions, request help, contextual explanations. Mentor actions may suggest roadmap changes but **never silently modify**; significant changes require explicit user approval (accept/reject proposal). Single Mentor chat stream; compact context; no unnecessary data sent to providers.
- Roadmap adaptation proposals (add/remove/replace/reorder tasks, change level or time estimates) as proposals before application.
- Resource discovery + ranking + validation (HTTPS, quality, freshness, trust; AI is not the sole authority for trusted URLs). Resource language independent of UI language.
- AI Roadmap Engine and AI Mentor Engine with structured JSON output that must pass schema → semantic → business-rule validation → persistence; multiple AI providers behind an abstraction (Gemini and Grok are baseline); full error handling (provider failure, timeout, rate limits, invalid JSON/response, validation failures, bounded retries).
- Simple gamification: streaks + achievements based on dynamic rules.
- Platform Administrator role (permission-controlled, audited; backend-enforced).
- Asynchronous jobs (QUEUED → PROCESSING → COMPLETED; FAILED/RETRYING/CANCELLED) for heavy AI operations; the frontend can display job state.
- Concurrency and idempotency for generate, regenerate, reset, complete task, accept/reject proposal.
- Roadmap history readiness (archive/history) — multiple active roadmaps are out of MVP.
- Arabic + English, RTL + LTR, responsive for mobile/tablet/desktop (Next.js App Router, shadcn/ui, Tailwind CSS, next-intl).
- Backend: Laravel 12, PHP 8.3+, REST, versioned `/api/v1`; MySQL (authoritative), Redis (cache/queues), Laravel Horizon, Docker, CI/CD.

### Out of scope (per requirements)

Multiple concurrent active roadmaps, template marketplace, mandatory quizzes, mandatory proof of completion, AI grading gate, calendar scheduling, automatic rescheduling, reminders, payments, social/community features, native mobile apps, offline state mutation, enterprise SSO, team analytics.

## Implemented Product Today — Frontend Only

The current frontend is fully client-side in behavior:

- **Auth** (`src/features/auth`): sign-in / create-account / password-recovery UI with `yup` validation. `authService` methods for Google sign-in and password reset return `{ status: "not-connected" }` and the UI shows a localized "unavailable" message. Auth state lives in a Redux slice backed by `localStorage["ai-mentor-auth"]`.
- **Onboarding** (`src/features/onboarding`): six steps — Learning Domain, Current Level, Available Time, Success Goal, Learning Preferences, then a single final Review/Confirmation step where the real submission fires (per `specs/005-onboarding-ux-redesign`). Submission calls `onboardingService.submitOnboarding()`, which always returns `{ status: "not-connected" }`; the UI shows an honest failure state with retry — never a fabricated success. No code path currently dispatches `setRoadmap`, so `onboarding.roadmap` (`string[] | null`) is never populated by this flow (see docs/03 "Known inconsistencies"). Only the `isComplete` flag is persisted, under `localStorage["ai-mentor-onboarding-complete"]`; the other answers are in-memory Redux state for the session.
- **Dashboard** (`src/features/dashboard`): a learning workspace shell (sidebar rail + header + drawer on mobile) and six sections. It renders learner name/goal and the structural roadmap stage list; everything the product does not model (current lesson, focus tasks, AI insight, recent activity, completion metrics) renders as an explicit, localized `unavailable`/empty state — nothing is fabricated.
- **Home** (marketing): hero, features, how-it-works, CTA, footer; informational only and not tied to product state.

## Routes (Implemented)

All routes are server pages under the `(main)` route group with `setRequestLocale`:

| Route | Status |
| --- | --- |
| `/` (localized) | Implemented — marketing home |
| `/[locale]/auth` | Implemented — auth UI |
| `/[locale]/onboarding` | Implemented — multi-step onboarding |
| `/[locale]/dashboard` | Implemented — server page + segment layout + loading skeleton + client composition root |
| `/[locale]/not-found` (via `not-found` handling) | Implemented |

## Languages & Localization (Implemented)

- Locales: `en` (LTR) and `ar` (RTL); **default locale `ar`**, `timeZone: "Asia/Riyadh"`.
- All visible strings live in `messages/en.json` and `messages/ar.json` (namespaces: `nav`, `hero`, `features`, `howItWork`, `cta`, `footer`, `auth`, `onboarding`, `dashboard`, `theme`, `validation`, `metadata`, `loading`, `notFound`, `aiLearningPath`, `home`).
- Locale negotiation is handled by `src/proxy.ts` (`next-intl` middleware, Next 16 Proxy) with the matcher `/((?!api|trpc|_next|_vercel|.*\\..*).*)`.

## Repository Layout (High Level)

```text
my-app/
├── src/
│   ├── app/                    # Next.js App Router (routes, layouts, globals.css)
│   ├── features/
│   │   ├── auth/               # Auth feature
│   │   ├── onboarding/         # Onboarding feature
│   │   ├── dashboard/          # Dashboard feature
│   │   └── home/               # Marketing home feature
│   ├── shared/                 # Shared UI, layouts, hooks, providers
│   ├── components/ui/          # shadcn/ui primitives (card, etc.)
│   ├── redux/                  # Redux store + slices
│   ├── lib/                    # Shared utilities (cn, etc.)
│   └── i18n/                   # next-intl routing/request/navigation
├── messages/                   # en.json, ar.json
├── docs/                       # This documentation layer
├── specs/                      # Feature specs, plans, tasks, quickstarts, checklists
├── Backend/                    # Laravel 12 backend (documented in README/API_CONTRACT)
├── API_CONTRACT.md             # Backend API integration contract
├── STRUCTURE.md                # Folder-structure conventions
└── package.json / next.config.ts / etc.
```

See `docs/01-architecture.md` for the detailed architecture and the mapping between documented conventions (`STRUCTURE.md`) and the actual repository shape.