import { NextResponse, type NextRequest } from "next/server"

/**
 * Session route (API_CONTRACT.md §3 rule 4): "For persistent browser sessions,
 * use a Next.js server/BFF with an HttpOnly, Secure, SameSite cookie instead of
 * exposing the refresh token to browser JavaScript."
 *
 * The backend sets no cookies and allows no credentialed CORS (§1, §24), so the
 * cookie lives on this site's own origin, scoped to /api/session. The browser
 * keeps only the short-lived access token, in memory (src/lib/api/auth.ts).
 *
 *   POST /api/session/store    {refresh_token, refresh_expires_in} → sets the cookie (after login/register)
 *   POST /api/session/refresh  → POST /auth/refresh with the cookie; rotates it;
 *                                returns {token_type, access_token, expires_in, user}
 *   POST /api/session/logout   → POST /auth/logout (bearer + cookie), then clears
 *                                the cookie even if the backend call fails
 *
 * Backend status codes and `{error, meta}` bodies pass through unchanged, so
 * the client's error mapping (errors.ts) still applies. Tokens are never logged
 * and never appear in a URL.
 */

const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000/api/v1"
).replace(/\/$/, "")

const SESSION_COOKIE = "masar_session"
const COOKIE_PATH = "/api/session"
/** Sent by src/lib/api/auth.ts. A cross-site form can't set it, and it forces a CORS preflight. */
const CLIENT_HEADER = "x-masar-session"
const THIRTY_DAYS = 60 * 60 * 24 * 30
/** Contract §8: the refresh token is opaque; bound its size instead of its format. */
const TOKEN_PATTERN = /^[\x21-\x7e]{16,512}$/

type Action = "store" | "refresh" | "logout"
const ACTIONS: readonly string[] = ["store", "refresh", "logout"]

interface WireAuthData {
  token_type?: string
  access_token?: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
  user?: unknown
}

interface UpstreamResult {
  status: number
  body: string
  contentType: string
  requestId: string | null
  /** Passed through on 429 so the client can wait before its one retry. */
  retryAfter: string | null
}

function noStore(init: ResponseInit = {}): ResponseInit {
  return { ...init, headers: { ...(init.headers ?? {}), "Cache-Control": "no-store" } }
}

function localError(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message }, meta: { request_id: `session-${crypto.randomUUID()}` } },
    noStore({ status })
  )
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  // Some same-origin fetches omit Origin; the custom header still requires a
  // CORS preflight that a cross-site page can't pass.
  return !origin || origin === request.nextUrl.origin
}

function setRefreshCookie(response: NextResponse, token: string, maxAge: number | undefined) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    // Browsers accept Secure cookies on http://localhost, so this holds in development too.
    secure: true,
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: maxAge && maxAge > 0 ? Math.min(maxAge, THIRTY_DAYS) : THIRTY_DAYS,
  })
}

function clearRefreshCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 0,
  })
}

async function postBackend(
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<UpstreamResult> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  return {
    status: response.status,
    body: await response.text(),
    contentType: response.headers.get("content-type") ?? "application/json",
    requestId: response.headers.get("x-request-id"),
    retryAfter: response.headers.get("retry-after"),
  }
}

/**
 * The caller's IP, so the backend's per-IP refresh limit (§25: 10/min) isn't
 * shared by every user of this server. On Vercel, X-Forwarded-For carries the
 * client IP set by the platform. Whether the backend trusts it is open
 * (docs/backend-issues.md).
 */
function forwardedFor(request: NextRequest): Record<string, string> {
  const value = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")
  return value ? { "X-Forwarded-For": value } : {}
}

/**
 * Contract §3 rule 5: concurrent refreshes with the same token can trigger
 * reuse detection and revoke the whole token family. The client already runs
 * one refresh at a time (and one across tabs), but two requests that reach this
 * server with the same cookie share one backend call, and a request that
 * arrives just after the rotation (with the old cookie) gets the same result.
 *
 * A successful result is also kept under the *new* token for the same window:
 * tabs opened together restore one after another (the Web Lock serializes
 * them), each with the cookie the previous one just received, so they share one
 * backend call instead of spending one of the 10 refreshes per minute each.
 * In-memory, per server instance: best effort.
 *
 * Only successes are kept. A 429 or 503 is forgotten at once, so the client's
 * retry after Retry-After really reaches the backend.
 */
const refreshes = new Map<string, Promise<UpstreamResult>>()
const REFRESH_GRACE_MS = 5000

function rotatedToken(upstream: UpstreamResult): string | null {
  try {
    const token = (JSON.parse(upstream.body) as { data?: WireAuthData }).data?.refresh_token
    return typeof token === "string" ? token : null
  } catch {
    return null
  }
}

function refreshOnce(token: string, request: NextRequest): Promise<UpstreamResult> {
  const existing = refreshes.get(token)
  if (existing) return existing
  const promise = postBackend("/auth/refresh", { refresh_token: token }, forwardedFor(request))
  refreshes.set(token, promise)
  promise.then(
    (upstream) => {
      if (upstream.status < 200 || upstream.status >= 300) {
        refreshes.delete(token)
        return
      }
      const next = rotatedToken(upstream)
      if (next && !refreshes.has(next)) refreshes.set(next, promise)
      setTimeout(() => {
        refreshes.delete(token)
        if (next && refreshes.get(next) === promise) refreshes.delete(next)
      }, REFRESH_GRACE_MS)
    },
    () => refreshes.delete(token)
  )
  return promise
}

function passThrough(upstream: UpstreamResult): NextResponse {
  return new NextResponse(
    upstream.body || null,
    noStore({
      status: upstream.status,
      headers: {
        "Content-Type": upstream.contentType,
        ...(upstream.requestId ? { "X-Request-ID": upstream.requestId } : {}),
        ...(upstream.retryAfter ? { "Retry-After": upstream.retryAfter } : {}),
      },
    })
  )
}

/** Keeps the refresh token in the cookie; the browser gets only the access token and the user. */
function sessionResponse(upstream: UpstreamResult): NextResponse {
  let json: { data?: WireAuthData; meta?: unknown }
  try {
    json = JSON.parse(upstream.body)
  } catch {
    return localError(502, "internal_error", "The authentication response was not JSON.")
  }
  const data = json.data ?? {}
  if (!data.access_token || !data.refresh_token) {
    return localError(502, "internal_error", "The authentication response was incomplete.")
  }
  const response = NextResponse.json(
    {
      data: {
        token_type: data.token_type ?? "Bearer",
        access_token: data.access_token,
        expires_in: data.expires_in,
        user: data.user,
      },
      meta: json.meta,
    },
    noStore({ status: 200 })
  )
  setRefreshCookie(response, data.refresh_token, data.refresh_expires_in)
  return response
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params
  if (!ACTIONS.includes(action)) {
    return localError(404, "not_found", "Unknown session action.")
  }
  if (!sameOrigin(request) || request.headers.get(CLIENT_HEADER) !== "1") {
    return localError(403, "forbidden", "Cross-site session requests are not allowed.")
  }

  const refreshToken = request.cookies.get(SESSION_COOKIE)?.value

  switch (action as Action) {
    case "store": {
      const body = (await request.json().catch(() => null)) as {
        refresh_token?: unknown
        refresh_expires_in?: unknown
      } | null
      const token = body?.refresh_token
      if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
        return localError(422, "validation_failed", "A refresh token is required.")
      }
      const maxAge = typeof body?.refresh_expires_in === "number" ? body.refresh_expires_in : undefined
      const response = new NextResponse(null, noStore({ status: 204 }))
      setRefreshCookie(response, token, maxAge)
      return response
    }

    case "refresh": {
      if (!refreshToken) {
        return localError(401, "unauthenticated", "No session.")
      }
      let upstream: UpstreamResult
      try {
        upstream = await refreshOnce(refreshToken, request)
      } catch {
        // Temporary: keep the cookie so the next attempt can still restore the session.
        return localError(503, "session_upstream_unavailable", "The authentication service could not be reached.")
      }
      if (upstream.status >= 200 && upstream.status < 300) return sessionResponse(upstream)
      const response = passThrough(upstream)
      // Contract §8: 401 (invalid, expired, revoked or reused) and 422 (malformed)
      // end the session; 429 and 503 are temporary, so the cookie stays.
      if (upstream.status === 401 || upstream.status === 422) clearRefreshCookie(response)
      return response
    }

    case "logout": {
      // Contract §3 rule 7: the session ends locally even if the backend call fails.
      const authorization = request.headers.get("authorization")
      if (refreshToken && authorization) {
        await postBackend("/auth/logout", { refresh_token: refreshToken }, { Authorization: authorization }).catch(
          () => undefined
        )
      }
      const response = new NextResponse(null, noStore({ status: 204 }))
      clearRefreshCookie(response)
      return response
    }
  }
}
