# AI Mentor — Backend API Integration

## Status

| Area | Status |
| --- | --- |
| Backend API (Laravel 12, `/api/v1`) | **Under active parallel development by another developer** (not owned by the frontend workstream). Real implementation exists for identity, preferences, learning profile, onboarding status, roadmap-generation request, roadmap retrieval — current implementation evidence, not automatically the final agreed contract |
| Shared response contract (`data\|error` + `meta.request_id`) | **Implemented** in the current backend |
| JWT bearer auth (access + rotating refresh) | **Implemented** in the current backend — provisional frontend working assumption; **final authentication architecture is pending reconciliation** with the backend developer (a previously-considered alternative was Sanctum SPA + HttpOnly cookies) |
| Async roadmap generation (queued → running → validating → succeeded/failed/cancelled) | **Implemented** — local deterministic generator; real AI generation **Backend-dependent/planned** |
| Frontend API client (`src/shared/lib/api-client.ts`, `features/*/api/`, route handlers, env config) | **Not implemented** — there are currently **zero** `fetch`/`axios`/`process.env`/`NEXT_PUBLIC_*` usages in `src/` |
| Frontend consumption of any backend endpoint | **Not implemented** — auth and onboarding are Redux/localStorage mocks |
| Endpoints the contract lists as gaps (task completion/skip/progress, roadmap list, activate-ready, cancel generation, password reset/email verification, account updates, chat/AI) | **Not implemented** (backend gaps documented in this doc) |

## Sources

- `API_CONTRACT.md` (root) — the authoritative frontend-facing contract, written from the implemented `Backend/`
- `Backend/README.md` — backend architecture, data model, generation walkthrough
- `src/**` (absence of API usage), `src/proxy.ts` (API path exclusion)
- `specs/003-learning-dashboard/contracts/learning-workspace-service.md` — **superseded** by the 003 plan revision; do not treat as live contract

## Current frontend integration reality

The backend is being built in parallel by another developer, independent of the frontend workstream. Everything below is read from the current `Backend/` implementation and `API_CONTRACT.md` as **evidence of today's state** — it is not automatically the final, agreed integration contract, and frontend integration remains deferred until it is reconciled.

The frontend is **completely decoupled** from the backend today:

- No HTTP client, interceptors, or route handlers exist in `src/` (`src/app/api/` does not exist).
- No `.env`/`.env.local` variables feed the app; `API_CONTRACT.md` merely *recommends* `NEXT_PUBLIC_API_BASE_URL`.
- Auth state (user, session) lives in Redux + `localStorage`. Onboarding answers (domain, level, time, success goal, preferences) live in Redux only, with just the completion flag persisted to `localStorage`. Submission always returns an honest `not-connected` failure via `onboardingService.submitOnboarding()`; no code path currently writes `onboarding.roadmap` (see docs/03 "Known inconsistencies").
- `src/proxy.ts` intentionally excludes `api` and `trpc` paths — infrastructure is ready for future API/route-handler work.

**Consequence**: every screen that today shows learner data is a mock. The backend implements the real identity/onboarding/generation API, but nothing calls it yet. Wiring these together is the natural next phase (see "Recommended integration order" below).

## Connection

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:8000/api/v1` |
| Production | Not assigned |

Requests: `Accept: application/json`; JSON bodies also `Content-Type: application/json`; protected endpoints `Authorization: Bearer <access_token>`. No cookies/Sanctum/CSRF.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Response contract

Success:

```json
{ "data": {}, "meta": { "request_id": "01..." } }
```

Error:

```json
{ "error": { "code": "validation_failed", "message": "…", "details": { "field": ["…"] } }, "meta": { "request_id": "01..." } }
```

- `error.details` is optional. UI should branch on `error.code`, never on English `message` text; keep `request_id` for diagnostics.
- Every response carries `X-Request-ID` (same ULID as `meta.request_id`). IDs are ULIDs; dates are ISO-8601 UTC or `null`.
- Error code → UX guide: `401 unauthenticated` (one serialized refresh, then sign out), `403 forbidden` (access denied), `404 not_found` (don't reveal ownership), `409` (read details, act), `422 validation_failed` (map details to fields), `429 too_many_requests` (back off, honor `Retry-After`), `503 authentication_service_unavailable` (temporary; don't clear tokens), `500 internal_error` (generic retry + request_id).

## Endpoints implemented

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `{status:"ok", service:"ai-mentor-backend"}` |
| `POST` | `/auth/register` | — | `201`; default prefs en/both/UTC; 3/min/IP |
| `POST` | `/auth/login` | — | `200`; generic 422 for bad creds; 5/min/email/IP |
| `POST` | `/auth/refresh` | — | atomic rotation; family revocation on reuse; 10/min/IP |
| `POST` | `/auth/logout` | Bearer | `204` |
| `GET` | `/me` | Bearer | user; `status` active/suspended/deletion_requested |
| `GET` / `PATCH` | `/me/preferences` | Bearer | `ui_locale` ar/en; `resource_language` ar/en/both; IANA `timezone` |
| `GET` / `PUT` | `/me/learning-profile` | Bearer | idempotent create-or-replace; 5 fields required |
| `GET` | `/me/onboarding-status` | Bearer | `completed` + `missing_fields[]`; server-derived |
| `POST` | `/roadmap-generation-requests` | Bearer + `Idempotency-Key` | `202` queued; replay same key → same request (202 active / 200 terminal); 3/min/user |
| `GET` | `/roadmap-generation-requests/{id}` | Bearer | owner-scoped; 404 for unknown/foreign |
| `GET` | `/roadmaps/{id}` | Bearer | owner-scoped; current version tree |

### Token contract

> **Provisional**: this describes the current backend's JWT bearer implementation, used as the frontend's provisional working assumption. Final authentication architecture is pending reconciliation with the backend developer.

Bearer access JWT (HS256, ~15 min) + opaque refresh (~30 days). On refresh, atomically replace both. Never persist the refresh token in `localStorage`; prefer a BFF/`HttpOnly` cookie for persistent sessions, or in-memory for a reload-signs-out MVP. Only one refresh in flight; a single failure path signs out. Refresh responses are `no-store`.

## Roadmap generation flow

```text
onboarding complete → POST /roadmap-generation-requests (Idempotency-Key)
   → 202 {status:"queued", status_url, roadmap_id:null}
   → poll GET /roadmap-generation-requests/{id}
        ├─ active: queued → running → validating   (poll ~1s → 2-3s backoff)
        ├─ succeeded: use roadmap_url / roadmap_id → GET /roadmaps/{id}
        ├─ failed: show retry → NEW idempotency key
        └─ cancelled: return to generation screen
```

- Generate **one stable idempotency key per user action**, reuse only when retrying the same action after a timeout/network failure. Key: 8–128 chars `[A-Za-z0-9._:-]`, starts alphanumeric.
- A different key while one request is active → `409 roadmap_generation_in_progress`.
- `409 onboarding_incomplete` returns `missing_fields`.
- Browser must not rely on `Location`/`Idempotency-Replayed` headers (only `X-Request-ID` is CORS-exposed); the body carries what's needed.
- Stop pushing the retry button; if polling times out, offer "check again" without creating a new request.

## Roadmap model (server shape)

- **Roadmap** → immutable **versions** → ordered **stages** → ordered **tasks** (+ type, `is_required`, `estimated_minutes`, `depends_on_task_ids`, ordered **resources**).
- Statuses:
  - Roadmap: `draft, generating, validating, ready, active, completed, failed, reset, archived`
  - Version source: `generated, regenerated, manual, adaptation`; version status: `draft, current, superseded, archived`
  - Stage: `upcoming, active, completed`
  - Task: `upcoming, available, current, completed, skip_pending, skipped, replaced`
  - Task type: `read, watch, quiz, project, assignment, coding_challenge`
  - Resource type: `documentation, article, video, course`
- `current_version` may be `null`. Sort by `position`. Legacy tasks may return `resources: []`.
- Single active roadmap enforced by `UNIQUE (user_id, active_slot)`; first generated roadmap auto-activates, later ones stay `ready`.

## Current API gaps (must be accounted for)

Not implemented in the backend yet:

- Get/list the user's current or historical roadmaps without an ID.
- Mark tasks complete, skip tasks, or track progress.
- Activate a later `ready` roadmap.
- Cancel an active generation request.
- Password reset or email verification.
- Update account name/email/password.
- AI mentor chat or real external AI generation.

Frontend consequences today: keep generation-request ID and roadmap ID in app state while a flow is active; a reload cannot rediscover a roadmap from the API alone; roadmap UI must stay read-only (controls disabled/hidden) until completion/progress endpoints exist.

## Recommended integration order

This order is contingent on the backend contract being reconciled first (see the "Current frontend integration reality" note above) — it describes the plan once that happens, not a mandate to integrate against today's implementation as-is.

1. **Auth**: replace `authService` stubs + `authSlice` thunks with real `register`/`login`/`refresh`/`logout`/`/me` calls; implement the token rules above (provisional JWT assumption, pending reconciliation); treat onboarding completion as server-derived via `/me/onboarding-status`.
2. **Onboarding**: drive the 6-step form (`specs/005-onboarding-ux-redesign`) from `GET/PATCH /me/preferences` + `GET/PUT /me/learning-profile`; re-fetch onboarding status.
3. **Roadmap generation**: replace the `not-connected` stub in `onboardingService.submitOnboarding()` with the async `POST` + poll + `GET /roadmaps/{id}` flow.
4. **Dashboard**: source current-lesson / focus / insight / progress / activity from future endpoints (spec VR-001..VR-008 were deferred for exactly this reason) — with the honest-state fallbacks already built in docs/03.
5. Add the infrastructure documented in `STRUCTURE.md` (shared API client, per-feature `api/` modules, route handlers under `src/app/api/`) once a client is introduced.

Cross-cutting rules when integrating: ownership/authorization derives from the authenticated user server-side (never trust client IDs); no secrets in code or logs; idempotency keys for create-type calls; one serialized refresh; localized error mapping from `error.code`; and the AI output pipeline (schema → semantic → business rules → persist) before any AI-generated roadmap is displayed.