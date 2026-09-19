# Contract: Frontend API Client (`src/lib/api/`)

This is the internal contract this feature exposes to the rest of the
frontend: the RTK Query endpoints (hooks) other components/screens will call.
It is a thin, typed wrapper over `API_CONTRACT.md` — for exact request/response
JSON shapes, status codes, and error codes, see that file's referenced
section; this document does not repeat wire-level detail already defined
there.

## Base setup

- One RTK Query API slice: `apiSlice` (`src/lib/api/apiSlice.ts`), `baseQuery`
  built from `fetchBaseQuery` with `baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL`.
- Wrapped in `baseQueryWithReauth` (`src/lib/api/auth.ts`) implementing the
  single-flight refresh described in `research.md` §3 and `plan.md`'s
  Constitution Check (Principle VII).
- Every request sets `Accept: application/json`; body-bearing requests also
  set `Content-Type: application/json`; authenticated endpoints add
  `Authorization: Bearer <accessToken>` from the module-level token store.
- Response envelope unwrapping (`{data, meta}` → `data`) and error envelope
  parsing (`{error, meta}` → the shape below) happen once, centrally, in the
  `baseQuery`'s `transformResponse`/`transformErrorResponse` — individual
  endpoints never parse the envelope themselves.

```ts
// Shape every failed query/mutation resolves to (src/lib/api/errors.ts)
interface ApiError {
  code: string;        // e.g. "validation_failed", "onboarding_incomplete"
  message: string;      // raw server message — NEVER shown to users directly (FR-018)
  details?: Record<string, unknown>;
  requestId: string;    // from meta.request_id — retained for support (FR-019)
  category: "invalid_input" | "access_denied" | "not_found" | "conflict"
          | "rate_limited" | "unavailable" | "unexpected"; // mapped from `code` (FR-018, FR-023)
}
```

## Endpoints

| Hook | Method + path (see contract §) | Auth | Notes |
|---|---|---|---|
| `useRegisterMutation` | `POST /auth/register` (§6) | No | On success, stores tokens via `auth.ts`, invalidates `Me`/`OnboardingStatus` tags. |
| `useLoginMutation` | `POST /auth/login` (§7) | No | Same success handling as register. Error mapped per FR-002 (never distinguishes "no account" from "wrong password"). |
| — refresh — | `POST /auth/refresh` (§8) | No | Not a directly-called hook — invoked only from inside `baseQueryWithReauth`. |
| `useLogoutMutation` | `POST /auth/logout` (§9) | Bearer | Clears local session state in the `onQueryStarted` handler *before* awaiting the response, and again on failure — never conditional on network success (FR-006). |
| `useGetMeQuery` | `GET /me` (§10) | Bearer | Tag: `Me`. |
| `useGetPreferencesQuery` | `GET /me/preferences` (§11) | Bearer | Tag: `Preferences`. A `404 user_preferences_not_found` resolves to "no preferences yet," not a thrown error — see `data-model.md`. |
| `useUpdatePreferencesMutation` | `PATCH /me/preferences` (§11) | Bearer | Invalidates `Preferences`, `OnboardingStatus`. |
| `useGetLearningProfileQuery` | `GET /me/learning-profile` (§12) | Bearer | Tag: `LearningProfile`. `404` resolves the same way as preferences. |
| `usePutLearningProfileMutation` | `PUT /me/learning-profile` (§12) | Bearer | Full replace only — no partial-update variant exists (FR-010). Invalidates `LearningProfile`, `OnboardingStatus`. |
| `useGetOnboardingStatusQuery` | `GET /me/onboarding-status` (§13) | Bearer | Tag: `OnboardingStatus`. Authoritative gate for generation (FR-011). |
| `useRequestRoadmapGenerationMutation` | `POST /roadmap-generation-requests` (§14) | Bearer + `Idempotency-Key` | Caller supplies the idempotency key (generated per FR-012, not by this hook). Body is always `{}`. |
| `useGetGenerationStatusQuery` | `GET /roadmap-generation-requests/{id}` (§15) | Bearer | `pollingInterval` driven externally per `research.md` §4 — this hook does not decide its own polling cadence. |
| `useGetRoadmapQuery` | `GET /roadmaps/{id}` (§16) | Bearer | Tag: `Roadmap`. |

## Idempotency key generation

A small helper, `createIdempotencyKey()` (`src/lib/api/idempotency.ts`),
generates a UUID matching the contract's key format (§14: 8–128 safe ASCII
characters, starting with a letter or number). Callers (the "Generate
roadmap" action handler) create exactly one key per user click and hold it in
component/hook state for the lifetime of that attempt, reusing it only for an
automatic retry of that same attempt (FR-012) — this contract does not
generate or store keys on the caller's behalf beyond providing the generator
function.

## Error category mapping (`src/lib/api/errors.ts`)

Implements FR-018's server-error-code → UI-category mapping and FR-023's
failure-reason → friendly-explanation mapping, per `API_CONTRACT.md` §2's
common error code table and §14's `failure_code` values. Both mappings
default to a generic fallback (`category: "unexpected"` / a generic failure
message) for any code not explicitly listed — new server-side codes must
never crash or dead-end the UI, only fall back to the generic case (FR-023).
