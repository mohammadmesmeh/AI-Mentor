# Decisions

Architecture decisions for the frontend, newest first. Each entry records what was decided, why, and what it costs.

---

## 2026-09-28 — Persistent sessions through a Next.js session route

**Status:** accepted (decided by the project owner).

### Context

Tokens used to live only in memory (FR-007), so every reload signed the learner out. The backend uses bearer JWTs and no cookies: `API_CONTRACT.md` §1 says "It does **not** use cookies, Sanctum, CSRF", and §24 says "Credentials/cookies are disabled." Checking Render confirmed this: no `Set-Cookie` header, and no `Access-Control-Allow-Credentials`.

The contract's only persistent-session mechanism is §3 rule 4:

> For persistent browser sessions, use a Next.js server/BFF with an `HttpOnly`, `Secure`, `SameSite` cookie instead of exposing the refresh token to browser JavaScript.

§3 rule 2 also says: "Do not persist the refresh token in `localStorage`."

### Decision

A route on the frontend's own origin, `src/app/api/session/[action]/route.ts`, owns the refresh token:

| Action | What it does |
| --- | --- |
| `POST /api/session/store` | After login/register, stores the refresh token in the `masar_session` cookie (HttpOnly, Secure, SameSite=Lax, Path=/api/session, Max-Age = `refresh_expires_in`). |
| `POST /api/session/refresh` | Calls `POST /auth/refresh` with the cookie, rotates the cookie, and returns only the access token and user. 401/422 clear the cookie; 429/503 keep it. |
| `POST /api/session/logout` | Calls `POST /auth/logout` with the bearer and the cookie's token, then clears the cookie even if the backend call fails. |

On the client (`src/lib/api/auth.ts`):

- The access token stays in memory only. Nothing goes to Redux, `localStorage` or `sessionStorage`.
- Login and register still go from the browser to the backend, so the backend's per-IP login limits (§25) see the learner's own IP. The refresh token from that response is handed to `/store` and not kept.
- On app load, `SessionRestorer` calls `/refresh`. Until it finishes, `auth.restoring` is true and screens show loading, never the sign-in state.
- Every refresh (app-load restore or a 401) goes through the one serialized `refreshSession()` promise, and across tabs through the Web Locks API (§3 rule 5). The route also shares one backend call between requests carrying the same cookie. The error-category rules are unchanged: `access_denied` or `validation_failed` signs out, anything temporary keeps the session.
- The route requires same origin plus an `X-Masar-Session: 1` header, which is its CSRF guard alongside SameSite.

### Consequences

- A reload, a new tab or a returning visit within 30 days keeps the learner signed in.
- For a moment after login, the refresh token passes through browser JavaScript on its way to `/store`. Proxying login through the route would avoid that, but then every login would come from the server's IP and share one rate limit. This trade-off was chosen deliberately.
- Refresh calls now reach the backend from the frontend server's IP, and §25 limits refresh to 10/min per IP. The route forwards `X-Forwarded-For`. Whether the backend trusts it is an open question in `docs/backend-issues.md`.
- The frontend now needs a Node runtime for `/api/session/*` (Vercel route handlers); a static export would not work.
- Browsers accept `Secure` cookies on `http://localhost`, so development works without HTTPS.
