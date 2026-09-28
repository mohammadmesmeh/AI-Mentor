import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import type { ApiError } from "./errors"
import { asApiError, toApiError } from "./errors"
import type { Session } from "./types"
import { clearLocalSession } from "@/redux/slices/authSlice"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

interface WireAuthData {
  token_type?: string
  access_token?: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
  user?: unknown
}

interface WireAuthEnvelope {
  data?: WireAuthData
}

let session: Session | null = null

/** Module-level in-memory token store — never Redux, never storage (FR-007). */
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
  const now = Date.now()
  return {
    tokenType: wire.token_type ?? "Bearer",
    accessToken: wire.access_token ?? "",
    expiresAt: now + (wire.expires_in ?? 0) * 1000,
    refreshToken: wire.refresh_token ?? "",
    refreshExpiresAt: now + (wire.refresh_expires_in ?? 0) * 1000,
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

/** Auth-free fetch used only by the single-flight refresh (contract §8). */
const refreshBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json")
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

type RefreshOutcome = { ok: boolean; signOut: boolean }

let refreshPromise: Promise<RefreshOutcome> | null = null

/**
 * The refresh call uses a raw fetchBaseQuery, so its error is a
 * FetchBaseQueryError ({status, data}), not an ApiError — normalize it, or a
 * 401 from /auth/refresh would never be recognized as "sign out".
 */
function normalizedError(result: { error?: unknown }): ApiError {
  return asApiError(result.error)
}

async function runRefresh(): Promise<RefreshOutcome> {
  const current = getSession()
  if (!current?.refreshToken) {
    return { ok: false, signOut: true }
  }

  try {
    const result = await refreshBaseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        body: { refresh_token: current.refreshToken },
      } as FetchArgs,
      {} as Parameters<typeof refreshBaseQuery>[1],
      {} as Parameters<typeof refreshBaseQuery>[2]
    )

    if (result.error) {
      const apiError = normalizedError(result as { error?: unknown })
      if (apiError.category === "access_denied" || apiError.code === "validation_failed") {
        clearSession()
        return { ok: false, signOut: true }
      }
      // unavailable, rate_limited, network: keep tokens; do not sign the user out.
      return { ok: false, signOut: false }
    }

    const envelope = result.data as WireAuthEnvelope
    const wire = envelope?.data
    if (!wire?.access_token || !wire?.refresh_token) {
      clearSession()
      return { ok: false, signOut: true }
    }
    setSession(mapAuthData(wire))
    return { ok: true, signOut: false }
  } catch {
    return { ok: false, signOut: false }
  }
}

/**
 * Keeps exactly one refresh in flight at a time: any request that fails with an
 * expired-session 401 awaits the same promise (FR-003). On success both tokens
 * are replaced atomically before the original request is retried exactly once
 * (FR-004). On a credential failure the token store is cleared and the caller
 * is reported unauthenticated (FR-005).
 */
function refreshSession(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
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