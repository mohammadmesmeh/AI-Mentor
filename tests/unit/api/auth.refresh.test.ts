import { beforeEach, describe, expect, it, vi } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, setSession } from "@/lib/api/auth"
import { getSession } from "@/lib/api/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

function sessionWith(token: string, refreshToken: string) {
  const now = Date.now()
  return {
    tokenType: "Bearer",
    accessToken: token,
    expiresAt: now - 1000,
    refreshToken,
    refreshExpiresAt: now + 2592000000,
  }
}

async function flushWithTimeout(ms = 10) {
  await new Promise((r) => setTimeout(r, ms))
}

describe("auth refresh (FR-003, FR-004, FR-005)", () => {
  beforeEach(() => {
    clearSession()
    vi.clearAllMocks()
  })

  it("T012: concurrent 401s trigger exactly one /auth/refresh call", async () => {
    let meAttempts = 0
    let prefsAttempts = 0
    let refreshCalls = 0

    server.use(
      http.get(`${API_BASE}/me`, () => {
        meAttempts += 1
        if (meAttempts === 1) {
          return HttpResponse.json(
            { error: { code: "unauthenticated", message: "expired" }, meta: { request_id: "r1" } },
            { status: 401 }
          )
        }
        return HttpResponse.json(
          { data: { id: "u1", name: "A", email: "a@b.c", status: "active", email_verified_at: null, last_login_at: null, created_at: new Date().toISOString() }, meta: { request_id: "r2" } },
          { status: 200 }
        )
      }),
      http.get(`${API_BASE}/me/preferences`, () => {
        prefsAttempts += 1
        if (prefsAttempts === 1) {
          return HttpResponse.json(
            { error: { code: "unauthenticated", message: "expired" }, meta: { request_id: "r3" } },
            { status: 401 }
          )
        }
        return HttpResponse.json(
          { data: { ui_locale: "en", resource_language: "both", timezone: "UTC", updated_at: new Date().toISOString() }, meta: { request_id: "r4" } },
          { status: 200 }
        )
      }),
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json(
          {
            data: {
              token_type: "Bearer",
              access_token: "new-access",
              expires_in: 900,
              refresh_token: "new-refresh",
              refresh_expires_in: 2592000,
              user: { id: "u1" },
            },
            meta: { request_id: "r5" },
          },
          { status: 200 }
        )
      })
    )

    setSession(sessionWith("old-access", "old-refresh"))
    const store = makeStore()

    const me = store.dispatch(apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
    const prefs = store.dispatch(apiSlice.endpoints.getPreferences.initiate(undefined, { forceRefetch: true }))

    const [meResult, prefsResult] = await Promise.all([me.unwrap(), prefs.unwrap()])

    expect(refreshCalls).toBe(1)
    expect(meResult).toMatchObject({ name: "A" })
    expect(prefsResult).toMatchObject({ uiLocale: "en" })
    // Token store holds the fresh pair.
    expect(getSession()?.accessToken).toBe("new-access")
    expect(getSession()?.refreshToken).toBe("new-refresh")

    await flushWithTimeout()
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("T013: refreshed request is retried exactly once with fresh token and stops on repeat 401", async () => {
    let meAttempts = 0
    let refreshCalls = 0
    let lastAuthHeader: string | null = null

    server.use(
      http.get(`${API_BASE}/me`, ({ request }) => {
        meAttempts += 1
        lastAuthHeader = request.headers.get("Authorization")
        if (meAttempts === 1) {
          return HttpResponse.json(
            { error: { code: "unauthenticated", message: "expired" }, meta: { request_id: "r1" } },
            { status: 401 }
          )
        }
        return HttpResponse.json(
          { data: { id: "u1", name: "fresh", email: "a@b.c", status: "active", email_verified_at: null, last_login_at: null, created_at: new Date().toISOString() }, meta: { request_id: "r2" } },
          { status: 200 }
        )
      }),
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json(
          {
            data: {
              token_type: "Bearer",
              access_token: `fresh-access-${refreshCalls}`,
              expires_in: 900,
              refresh_token: `fresh-refresh-${refreshCalls}`,
              refresh_expires_in: 2592000,
              user: { id: "u1" },
            },
            meta: { request_id: "r5" },
          },
          { status: 200 }
        )
      })
    )

    setSession(sessionWith("old-access", "old-refresh"))
    const store = makeStore()

    const result = await store.dispatch(apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap()

    // Original request retried exactly once after refresh.
    expect(meAttempts).toBe(2)
    expect(refreshCalls).toBe(1)
    // Retried request carried the newly issued access token.
    expect(lastAuthHeader).toBe("Bearer fresh-access-1")
    expect(getSession()?.refreshToken).toBe("fresh-refresh-1")
    expect(result).toMatchObject({ name: "fresh" })

    await flushWithTimeout()
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("T013b: a second consecutive 401 after a successful refresh does not loop", async () => {
    let meAttempts = 0
    let refreshCalls = 0

    server.use(
      http.get(`${API_BASE}/me`, () => {
        meAttempts += 1
        // Always 401 — simulates a token the server keeps rejecting.
        return HttpResponse.json(
          { error: { code: "unauthenticated", message: "expired" }, meta: { request_id: "r1" } },
          { status: 401 }
        )
      }),
      http.post(`${API_BASE}/auth/refresh`, () => {
        refreshCalls += 1
        return HttpResponse.json(
          {
            data: {
              token_type: "Bearer",
              access_token: "still-bad",
              expires_in: 900,
              refresh_token: "still-bad",
              refresh_expires_in: 2592000,
              user: { id: "u1" },
            },
            meta: { request_id: "r5" },
          },
          { status: 200 }
        )
      })
    )

    setSession(sessionWith("bad-access", "bad-refresh"))
    const store = makeStore()

    const outcome = await store.dispatch(
      apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true })
    )

    // Each baseQueryWithReauth runs at most one refresh + one retry; repeat
    // 401s return the error instead of looping (FR-004), and access_denied is
    // never outer-retried (FR-021).
    expect(refreshCalls).toBe(1)
    expect(meAttempts).toBe(2)
    expect(outcome.status).toBe("rejected")
    expect((outcome.error as { code: string }).code).toBe("unauthenticated")

    store.dispatch(apiSlice.util.resetApiState())
  })
})