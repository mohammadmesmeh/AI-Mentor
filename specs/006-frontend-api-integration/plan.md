# Implementation Plan: Frontend API Integration

**Branch**: `006-frontend-api-integration` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-frontend-api-integration/spec.md`

## Summary

Replace the frontend's current `localStorage`-mocked auth/onboarding/roadmap state
with real calls to the REST API documented in `API_CONTRACT.md`: bearer-JWT
authentication with serialized silent refresh, server-authoritative onboarding
completion, idempotent roadmap-generation requests with backoff polling, and
read-only rendering of the resulting roadmap tree. The existing UI screens
already exist; this feature rewires their data layer, and — because the
existing mock `learning-profile`/`roadmap` shapes do not match the real API's
schema — requires reshaping the onboarding and roadmap Redux state to match
the contract.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19.2.4, Next.js 16.2.10 (App Router)

**Primary Dependencies**: Redux Toolkit 2.12 + react-redux 9.3 (existing global
state layer — already used for auth/onboarding/app state), react-hook-form 7 +
yup (existing form layer), next-intl 4.13 (existing i18n/RTL layer). No HTTP
client library is currently installed (native `fetch` only) — the API-client
pattern (raw `fetch` wrapper vs. RTK Query) is resolved in Phase 0 research.

**Storage**: N/A for durable frontend storage — per spec Assumptions, sessions
are held in memory only for this iteration; no `localStorage`/`sessionStorage`
persistence of auth tokens. (The *existing* `authSlice`/`onboardingSlice` mocks
currently persist a fake session and onboarding-complete flag to `localStorage`
— removing that is in scope for this feature, not preserving it.)

**Testing**: NEEDS CLARIFICATION — no test framework (unit, integration, or
e2e) is currently configured anywhere in this repository (`package.json` has
no test runner, `eslint` is the only quality script). A choice is required
before Quality Gate work (automated tests, per the constitution) can be
satisfied. Resolved in Phase 0 research.

**Target Platform**: Web browser via Next.js App Router (SSR shell + client
components), existing `ar`/`en` locales with RTL/LTR support already wired
through `src/i18n/`.

**Project Type**: Web application — frontend-only. The backend (`Backend/`,
Laravel) already implements the documented contract; this feature does not
modify it.

**Performance Goals**: Derived from spec Success Criteria — SC-002 (state-
matching screen shown within 2s of app load), SC-006 (generation outcome
reflected within one polling cycle). No additional throughput/latency targets
apply; this is a single-user-session browser client, not a service.

**Constraints**: Constitution Technical Constraints (Next.js App Router,
shadcn/ui + Tailwind, next-intl) apply. `API_CONTRACT.md`'s hard rules apply
directly to implementation: exactly one refresh in flight at a time with
serialized reuse, atomic replacement of both tokens post-refresh, no refresh-
token storage in `localStorage`, and CORS currently exposes only the
`X-Request-ID` response header (code must not depend on `Location` or
`Idempotency-Replayed` headers being readable).

**Scale/Scope**: Single authenticated user per browser session; roadmap trees
are per-user and bounded by what one generation run produces (no documented
upper bound on stage/task/resource counts — render as returned, ordered by
`position`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against each constitutional principle, for this feature specifically:

| Principle | Assessment |
|---|---|
| I. Security, Privacy, Data Ownership | **PASS** — tokens never written to durable storage (spec FR-007); authorization stays server-enforced, the frontend only ever reflects what the API returns. |
| II. Separation of Responsibilities | **PASS** — this feature only consumes the existing documented API boundary; no backend logic is duplicated in the frontend (onboarding completion, generation state, and roadmap authoring all stay server-decided). |
| III. Data Integrity & Authoritative State | **PASS** — client (Redux) state is explicitly a cache of server responses, never treated as authoritative; onboarding/generation status is always re-derived from the latest server response (spec FR-008, FR-011). |
| IV. Responsible AI Behavior | **N/A** — the frontend never calls an AI provider directly or handles raw AI output; it receives an already-structured roadmap JSON from the backend like any other API response. |
| V. Abstraction & Provider Replaceability | **N/A** — no AI provider integration exists at the frontend layer. |
| VI. Reliability & Failure Handling | **PASS** — spec FR-014/015/021 directly implement bounded polling, bounded retries, and explicit (not silent) failure states; the async generation contract is preserved rather than assumed synchronous. |
| VII. Safe State Changes, Concurrency, Idempotency | **PASS** — spec FR-003/004 (single in-flight refresh, atomic token swap) and FR-012/013 (idempotency-key discipline, one active generation request treated as authoritative) directly implement this principle. |
| VIII. Internationalization, Responsiveness, Inclusive UX | **PASS** — reuses the project's existing `ar`/`en` + RTL/LTR infrastructure; introduces no new localization system (spec Assumption). |
| IX. Maintainability, Observability, Auditability | **PASS** (resolved in Phase 0) — request-id retention (FR-019) covers basic support diagnostics; `research.md` §1 selects Vitest + React Testing Library + MSW + a Playwright smoke test, giving this repository a concrete, proportionate automated-test answer before implementation begins. |
| X. Explicit Scope, Controlled Changes | **PASS** — spec Assumptions explicitly bound scope (no new UI, no task-progress actions, in-memory sessions only); this plan does not expand beyond that. |

**Gate result (initial)**: PASS, with one open item (IX — test tooling
choice), deferred to Phase 0 research rather than blocking plan authoring.

**Gate result (post-Phase 0 re-check)**: PASS on all applicable principles —
see `research.md` "Constitution re-check". No violations require
justification in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-api-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is the existing single Next.js frontend project (the Laravel backend
lives separately in `Backend/` and is out of scope). This feature works
within the already-established structure below; new files are marked `NEW`,
files with logic that must change from mock-backed to API-backed are marked
`CHANGES`.

```text
my-app/
├── API_CONTRACT.md                        # Source of truth this feature integrates against
├── src/
│   ├── app/                                # Next.js App Router routes (existing, unchanged by this feature)
│   ├── lib/
│   │   ├── utils.ts                        # existing
│   │   └── api/                            # NEW — API client layer (see research.md for the exact pattern)
│   │       ├── client.ts                   # NEW — fetch wrapper: base URL, headers, error envelope parsing
│   │       ├── auth.ts                     # NEW — token store + single-flight refresh orchestration
│   │       └── errors.ts                   # NEW — error.code → UI category + friendly-message mapping (FR-018, FR-023)
│   ├── redux/
│   │   ├── store.ts                        # existing
│   │   └── slices/
│   │       ├── authSlice.ts                # CHANGES — replace localStorage mock with real endpoints (FR-001..007)
│   │       ├── onboardingSlice.ts          # CHANGES — reshape to match preferences/learning-profile schema (FR-008..011, FR-022)
│   │       └── appSlice.ts                 # existing, unchanged
│   ├── features/
│   │   ├── auth/                           # existing screens — rewire to real thunks/queries, no new screens
│   │   ├── onboarding/                     # existing screens — rewire fields to match real learning-profile shape
│   │   └── dashboard/                      # existing screens — roadmap-generation trigger + polling + read-only roadmap view
│   └── i18n/                               # existing, unchanged (reused per spec Assumptions)
└── tests/                                  # NEW — see research.md for framework choice; layout finalized there
```

**Structure Decision**: Single-project web application (existing Next.js
frontend only). No new top-level projects, no backend changes. New code is
concentrated in a new `src/lib/api/` client layer; existing `redux/slices` and
`features/*` screens are modified in place rather than replaced, per the
constitution's preference for reusing existing capabilities over introducing
parallel structures.

## Complexity Tracking

No constitution violations require justification. The one open item
(Principle IX — test tooling) is resolved as a decision in `research.md`,
not a violation.
