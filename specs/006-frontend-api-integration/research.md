# Phase 0 Research: Frontend API Integration

Four unknowns were flagged `NEEDS CLARIFICATION` in the plan's Technical
Context. Each is resolved below as a decision, not left open — this feature
does not proceed to Phase 1 with open technical questions.

## 1. Test framework

**Decision**: Vitest + React Testing Library + MSW (Mock Service Worker) for
unit/component/integration tests; a small Playwright smoke suite covering the
one critical end-to-end path (register → complete onboarding → generate
roadmap → view roadmap).

**Rationale**: The repository has zero test tooling today, but the
constitution's Quality Gates require "relevant automated tests" proportional
to risk, and this feature is explicitly security-sensitive (token handling)
and concurrency-sensitive (refresh serialization, idempotency) — both
categories the constitution calls out as needing *stronger* validation.
Vitest is the natural fit for a Next.js 16 / React 19 / TypeScript-strict
project with no existing Babel/Jest setup: native ESM and TS support, a
Jest-compatible API, fast watch mode. MSW is unusually well-suited to *this
specific feature* because it intercepts at the network layer — tests exercise
the real `fetch`/RTK Query code paths against responses shaped exactly like
`API_CONTRACT.md` (including its `{data, meta}` / `{error, meta}` envelopes),
which is precisely what needs verifying (refresh serialization, idempotency-
key replay, error-code → UI-category mapping). One Playwright smoke test
matches "testing proportional to risk" — the three user stories are
sequentially dependent (spec: US1 → US2 → US3), so one real end-to-end pass
catches integration issues unit tests can't, without standing up a large e2e
suite for a first iteration.

**Alternatives considered**: Jest (more setup friction with Next 16 + React
19 + ESM than Vitest, no material benefit here). Cypress for e2e (weaker
first-party Next.js support than Playwright, heavier to run in CI). No test
framework / deferring indefinitely (rejected outright — fails the
constitution's Quality Gate for a security- and concurrency-sensitive
feature).

## 2. API client pattern

**Decision**: RTK Query, using the `createApi` / `fetchBaseQuery` +
`baseQueryWithReauth` pattern, replacing the current ad-hoc
`createAsyncThunk` mocks in `authSlice`/`onboardingSlice`.

**Rationale**: RTK Query ships inside the already-installed `@reduxjs/toolkit`
(2.12) — zero new runtime dependency. It has a well-documented, exact-fit
recipe for this feature's hardest requirement: a `baseQueryWithReauth` wrapper
that intercepts a `401`, performs one single-flight refresh, and retries the
original request — which is precisely FR-003/FR-004. It also provides caching,
loading/error state, and built-in polling (`pollingInterval`) for free across
every one of the dozen-plus endpoints in the contract, removing hand-rolled
boilerplate. It extends the state-management approach already used throughout
the app rather than introducing a second paradigm (constitution Principle II
— new functionality follows established architectural boundaries; Principle
IX — reuse existing capabilities before adding new ones).

**Alternatives considered**: A hand-rolled `fetch` wrapper with custom hooks
(rejected — reimplements caching/loading/retry machinery RTK Query already
provides, for the same result). Axios with a response-interceptor + mutex
(evaluated in depth — it can satisfy every hard requirement here, including
single-flight refresh: Axios's interceptor pattern needs the same shared
in-flight-refresh lock RTK Query's own `baseQueryWithReauth` recipe uses, so
neither approach has an edge on correctness. Rejected anyway because it adds
two new dependencies — Axios itself and `axios-retry` for FR-021's read-only
retry policy — for capabilities `fetchBaseQuery` and RTK Query's built-in
`retry` util already provide at zero cost, and because request/response
caching and tag-based invalidation (used for FR-011's re-check-after-save
behavior) would have to be hand-rolled rather than reused). TanStack Query
(rejected — new dependency that introduces a second, parallel data-fetching
paradigm alongside the
already-used Redux Toolkit, rather than extending it).

## 3. Token storage and refresh orchestration

**Decision**: Hold both tokens in a module-level, non-Redux, non-persisted
store inside `src/lib/api/auth.ts`. Redux only ever holds derived, non-secret
state (`isAuthenticated`, the `user` profile). A small hand-rolled
promise-based lock (not a new dependency) inside the same module guarantees
exactly one in-flight refresh at a time; on success, both tokens are replaced
together before the original request is retried.

**Rationale**: Keeping raw token values out of Redux state is defense in
depth for FR-007 and constitution Principle I ("must not be exposed to
external services") — Redux state is trivially visible in Redux DevTools and
could be accidentally serialized by a future persistence middleware; a
module-level closure is not. A ~10-line promise-queue lock is simple enough
that pulling in a library for it (e.g. `async-mutex`) would violate the
constitution's "avoid unnecessary dependencies" guidance for no real benefit.

**Alternatives considered**: Storing tokens directly in Redux state
(rejected — highest accidental-exposure risk, hardest to audit against
FR-007). The `async-mutex` package (rejected — unnecessary dependency for a
primitive this small).

## 4. Backoff polling for roadmap-generation status

**Decision**: Drive RTK Query's `pollingInterval` option from local hook
state that steps from ~1000ms for the first couple of polls to ~2500ms
afterward, rather than building a separate polling mechanism. The wrapping
hook sets `pollingInterval` to `0` the instant a terminal status (`succeeded`
/ `failed` / `cancelled`) is observed.

**Rationale**: Reuses RTK Query's existing polling/cache/loading machinery
(including automatic cleanup on unmount) instead of hand-rolling a parallel
`setInterval` loop — directly serving FR-014's "stop polling immediately on
any terminal status" by making that a one-line interval change rather than a
separate teardown path to get right twice.

**Alternatives considered**: A fully custom `setInterval`-based polling hook
independent of RTK Query (rejected — duplicates machinery RTK Query already
provides, and is exactly the kind of hand-rolled interval logic most prone to
the orphaned-interval bugs FR-014 exists to prevent).

## Constitution re-check

With test tooling now decided (Vitest/RTL/MSW/Playwright), **Principle IX
(Maintainability, Observability, Auditability)** moves from *Open* to
**PASS** — the repository now has a concrete, proportionate answer for
"relevant automated tests" before any implementation work begins. No other
principle is affected by these four decisions. All other Phase 1 gates from
`plan.md`'s Constitution Check remain PASS/N/A as previously evaluated.
