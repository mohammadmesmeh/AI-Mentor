import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import type { ApiError } from "./errors"
import { toApiError } from "./errors"
import type { Session, User } from "./types"
import { clearLocalSession } from "@/redux/slices/authSlice"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

/** What the session route returns: never the refresh token. */
interface WireAuthData {
  token_type?: string
  access_token?: string
  expires_in?: number
  user?: unknown
}

let session: Session | null = null

/**
 * Module-level in-memory store for the access token — never Redux, never
 * storage (FR-007). The refresh token isn't here at all: it lives in the
 * HttpOnly cookie set by the session route (src/app/api/session).
 */
export function getSession(): Session | null {
  return session
}

export function setSession(next: Session | null): void {
  session = next
}

export function clearSession(): void {
  session = null
}

export function isSessionActive(): boolean {
  return session !== null
}

function mapAuthData(wire: WireAuthData): Session {
  return {
    tokenType: wire.token_type ?? "Bearer",
    accessToken: wire.access_token ?? "",
    expiresAt: Date.now() + (wire.expires_in ?? 0) * 1000,
  }
}

/**
 * Base fetch for authenticated requests. Sets `Accept` on every request and
 * injects the current bearer token from the module store.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json")
    const current = getSession()
    if (current) {
      headers.set("Authorization", `Bearer ${current.accessToken}`)
    }
    return headers
  },
})

function snakeToCamel(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(snakeToCamel)
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
      out[camel] = snakeToCamel(val)
    }
    return out
  }
  return value
}

type UnwrapResult = { data?: unknown; meta?: undefined } | { error: ApiError }

/**
 * Central envelope handling: unwraps `{data, meta}` → `data`, converts keys to
 * camelCase once for every endpoint, and maps every failure — including
 * network-level failures — to the shared `ApiError` shape (contracts/api-client.md).
 */
const unwrappedBaseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    const error = result.error as FetchBaseQueryError
    const status = error.status
    const fallbackMeta = result.meta && "response" in result.meta ? { headers: result.meta.response?.headers as Headers | undefined } : undefined
    const apiError =
      typeof status === "number"
        ? toApiError(error.data, fallbackMeta, status)
        : toApiError(error.error, fallbackMeta, status)
    const out: UnwrapResult = { error: apiError }
    return out
  }

  if (result.meta && "response" in result.meta && result.meta.response?.status === 204) {
    return { data: undefined }
  }

  const body = result.data as { data?: unknown } | undefined
  // Body-bearing responses use the `{data, meta}` envelope; 204 and similar
  // responses carry no body.
  if (body && typeof body === "object" && "data" in body) {
    return { data: snakeToCamel(body.data) }
  }
  return { data: snakeToCamel(body) }
}

/**
 * `retryAfterMs` is set only when the refresh was rate limited (429): how long
 * to wait before the one retry, from the backend's Retry-After.
 */
export type RefreshOutcome = { ok: boolean; signOut: boolean; user?: User; retryAfterMs?: number }

type RouteResult = { ok: true; data: unknown } | { ok: false; error: ApiError; retryAfterMs?: number }

/**
 * Used when a 429 has no usable Retry-After — which is what the backend sends
 * today (docs/backend-issues.md #11). Its window is one minute; 10s is a guess
 * that keeps the loading screen short.
 */
export const DEFAULT_RETRY_AFTER_MS = 10_000
/** Never keep a learner on the loading screen longer than this for one retry. */
export const MAX_RETRY_AFTER_MS = 60_000

/**
 * Retry-After (RFC 9110): delay-seconds or an HTTP date. Clamped to
 * [1s, MAX_RETRY_AFTER_MS]; missing or unreadable → DEFAULT_RETRY_AFTER_MS.
 */
export function parseRetryAfter(value: string | null, now = Date.now()): number {
  if (!value) return DEFAULT_RETRY_AFTER_MS
  const seconds = Number(value.trim())
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now
  if (!Number.isFinite(ms)) return DEFAULT_RETRY_AFTER_MS
  return Math.min(Math.max(ms, 1000), MAX_RETRY_AFTER_MS)
}

/**
 * Calls our own session route (src/app/api/session), which holds the refresh
 * token in an HttpOnly cookie (contract §3 rule 4). Same origin, so the cookie
 * is sent; the custom header is the route's CSRF guard. Errors come back in the
 * backend's envelope and are normalized like any other API error.
 */
async function sessionRoute(
  action: "store" | "refresh" | "logout",
  { body, authorization }: { body?: unknown; authorization?: string } = {}
): Promise<RouteResult> {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
  const headers: Record<string, string> = { Accept: "application/json", "X-Masar-Session": "1" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (authorization) headers.Authorization = authorization
  try {
    const response = await fetch(`${origin}/api/session/${action}`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 204) return { ok: true, data: undefined }
    const json = (await response.json().catch(() => null)) as { data?: unknown } | null
    if (!response.ok) {
      const error = toApiError(json ?? "", { headers: response.headers }, response.status)
      return response.status === 429
        ? { ok: false, error, retryAfterMs: parseRetryAfter(response.headers.get("retry-after")) }
        : { ok: false, error }
    }
    return { ok: true, data: json?.data }
  } catch (error) {
    return { ok: false, error: toApiError(error instanceof Error ? error.message : "", undefined, "FETCH_ERROR") }
  }
}

/**
 * After login/register: hand the refresh token to the session route, which
 * keeps it in the HttpOnly cookie. It is not kept anywhere in JavaScript.
 */
export async function storeRefreshToken(refreshToken: string, refreshExpiresIn?: number): Promise<boolean> {
  const result = await sessionRoute("store", {
    body: { refresh_token: refreshToken, refresh_expires_in: refreshExpiresIn },
  })
  return result.ok
}

/**
 * Logout (contract §9, §3 rule 7): the route revokes the session on the
 * backend with this bearer and the cookie's refresh token, then clears the
 * cookie even if the backend call fails.
 */
export async function endSession(current: Session | null): Promise<void> {
  await sessionRoute("logout", {
    authorization: current ? `${current.tokenType} ${current.accessToken}` : undefined,
  })
}

/**
 * Contract §3 rule 5 across tabs: tabs share the cookie, so a refresh in one tab
 * must not overlap a refresh in another (reuse detection would revoke the whole
 * token family). The Web Locks API serializes them where available.
 */
function acrossTabs<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined
  // request() resolves with the callback's own resolved value.
  return locks ? (locks.request("masar-session-refresh", run) as unknown as Promise<T>) : run()
}

async function runRefresh(): Promise<RefreshOutcome> {
  const result = await acrossTabs(() => sessionRoute("refresh"))

  if (!result.ok) {
    // 401 (no cookie, or an invalid/expired/revoked/reused token) and 422 end
    // the session. unavailable, rate_limited and network failures keep it: the
    // cookie stays and a later attempt can still succeed.
    if (result.error.category === "access_denied" || result.error.code === "validation_failed") {
      clearSession()
      return { ok: false, signOut: true }
    }
    // A 429 also keeps the session; the caller may retry once after Retry-After.
    return { ok: false, signOut: false, retryAfterMs: result.retryAfterMs }
  }

  const wire = result.data as WireAuthData | undefined
  if (!wire?.access_token) {
    clearSession()
    return { ok: false, signOut: true }
  }
  setSession(mapAuthData(wire))
  return { ok: true, signOut: false, user: snakeToCamel(wire.user) as User }
}

/**
 * Keeps exactly one refresh in flight at a time: any request that fails with an
 * expired-session 401 awaits the same promise (FR-003). On success the access
 * token is replaced (the route rotated the refresh token in the cookie) before
 * the original request is retried exactly once (FR-004). On a credential
 * failure the token store is cleared and the caller is reported
 * unauthenticated (FR-005).
 */
function refreshSession(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

let refreshPromise: Promise<RefreshOutcome> | null = null

/**
 * App load: get a fresh access token from the cookie session, if there is one.
 * Shares the single in-flight refresh with any request that 401s meanwhile.
 */
export function restoreSession(): Promise<RefreshOutcome> {
  return refreshSession()
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await unwrappedBaseQuery(args, api, extraOptions)

  if (result.error?.code === "unauthenticated") {
    const outcome = await refreshSession()
    if (outcome.ok) {
      result = await unwrappedBaseQuery(args, api, extraOptions)
    } else if (outcome.signOut) {
      api.dispatch(clearLocalSession())
    }
  }

  return result
}