import { beforeEach, describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, getSession, restoreSession, setSession } from "@/lib/api/auth"
import authReducer from "@/redux/slices/authSlice"

// Session persistence through our own session route (contract §3 rule 4):
// the refresh token lives in its HttpOnly cookie, the access token in memory.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

const USER = { id: "u1", name: "Learner", email: "l@example.com", status: "active" }

/** The route's refresh answer: never a refresh token. */
const routeSession = (accessToken: string) =>
  HttpResponse.json({
    data: { token_type: "Bearer", access_token: accessToken, expires_in: 900, user: USER },
    meta: { request_id: "t" },
  })

describe("session route (contract §3 rule 4)", () => {
  beforeEach(() => clearSession())

  it("login keeps the access token in memory and hands the refresh token to the route — nothing in Redux or storage", async () => {
    let stored: unknown
    server.use(
      http.post(`${API_BASE}/auth/login`, () =>
        HttpResponse.json({
          data: {
            token_type: "Bearer",
            access_token: "acc-1",
            expires_in: 900,
            refresh_token: "refresh-token-value-1234",
            refresh_expires_in: 2592000,
            user: USER,
          },
          meta: { request_id: "t" },
        })
      ),
      http.post("*/api/session/store", async ({ request }) => {
        stored = { header: request.headers.get("x-masar-session"), body: await request.json() }
        return new HttpResponse(null, { status: 204 })
      })
    )
    const store = makeStore()

    const result = await store.dispatch(apiSlice.endpoints.login.initiate({ email: "l@example.com", password: "x" })).unwrap()

    expect(stored).toEqual({
      header: "1",
      body: { refresh_token: "refresh-token-value-1234", refresh_expires_in: 2592000 },
    })
    expect(getSession()).toMatchObject({ accessToken: "acc-1" })
    expect(getSession()).not.toHaveProperty("refreshToken")
    expect(result).toEqual({ user: expect.objectContaining({ id: "u1" }) })
    expect(store.getState().auth).toMatchObject({ isAuthenticated: true, restoring: false })
    const state = JSON.stringify(store.getState())
    expect(state).not.toContain("acc-1")
    expect(state).not.toContain("refresh-token-value-1234")
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it("reload keeps the session: app load restores a fresh access token and the user from the cookie", async () => {
    // A reload starts with empty memory; only the cookie survives.
    server.use(http.post("*/api/session/refresh", () => routeSession("restored-access")))
    let seenAuth: string | null = null
    server.use(
      http.get(`${API_BASE}/me/active-roadmap`, ({ request }) => {
        seenAuth = request.headers.get("authorization")
        return failure("active_roadmap_not_found", 404)
      })
    )

    const outcome = await restoreSession()

    expect(outcome).toMatchObject({ ok: true, user: { id: "u1", name: "Learner" } })
    expect(getSession()?.accessToken).toBe("restored-access")
    await makeStore().dispatch(apiSlice.endpoints.getActiveRoadmap.initiate())
    expect(seenAuth).toBe("Bearer restored-access")
  })

  it("no cookie: app load ends signed out without any backend call", async () => {
    // Default handler: the route answers 401 when there is no cookie.
    const outcome = await restoreSession()
    expect(outcome).toEqual({ ok: false, signOut: true })
    expect(getSession()).toBeNull()
  })

  it.each([
    ["expired or revoked (401)", 401, "unauthenticated"],
    ["malformed (422)", 422, "validation_failed"],
  ])("a %s refresh token signs out cleanly: memory and Redux cleared, no retry loop", async (_label, status, code) => {
    setSession({ tokenType: "Bearer", accessToken: "stale", expiresAt: 0 })
    let refreshCalls = 0
    let meCalls = 0
    server.use(
      http.get(`${API_BASE}/me`, () => {
        meCalls += 1
        return failure("unauthenticated", 401)
      }),
      http.post("*/api/session/refresh", () => {
        refreshCalls += 1
        return failure(code, status)
      })
    )
    const store = makeStore()

    const result = await store.dispatch(apiSlice.endpoints.getMe.initiate())

    expect(result.error).toMatchObject({ code: "unauthenticated" })
    expect(getSession()).toBeNull()
    expect(store.getState().auth).toMatchObject({ isAuthenticated: false, restoring: false })
    expect(refreshCalls).toBe(1)
    expect(meCalls).toBe(1)
  })

  it("a temporary refresh failure (503) keeps the session instead of signing out", async () => {
    setSession({ tokenType: "Bearer", accessToken: "still-mine", expiresAt: 0 })
    server.use(
      http.get(`${API_BASE}/me`, () => failure("unauthenticated", 401)),
      http.post("*/api/session/refresh", () => failure("authentication_service_unavailable", 503))
    )
    await makeStore().dispatch(apiSlice.endpoints.getMe.initiate())
    expect(getSession()?.accessToken).toBe("still-mine")
  })

  it("concurrent refreshes still run only once: app-load restore and a 401 share one route call", async () => {
    setSession({ tokenType: "Bearer", accessToken: "old", expiresAt: 0 })
    let refreshCalls = 0
    server.use(
      http.post("*/api/session/refresh", async () => {
        refreshCalls += 1
        await new Promise((r) => setTimeout(r, 20))
        return routeSession("new-access")
      }),
      http.get(`${API_BASE}/me`, ({ request }) =>
        request.headers.get("authorization") === "Bearer new-access"
          ? HttpResponse.json({ data: USER, meta: { request_id: "t" } })
          : failure("unauthenticated", 401)
      )
    )
    const store = makeStore()

    const [restored, me] = await Promise.all([
      restoreSession(),
      store.dispatch(apiSlice.endpoints.getMe.initiate()).unwrap(),
      restoreSession(),
    ])

    expect(refreshCalls).toBe(1)
    expect(restored.ok).toBe(true)
    expect(me).toMatchObject({ id: "u1" })
  })

  it("logout revokes through the route with the bearer, and clears memory and Redux even when it fails", async () => {
    setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: 0 })
    let seenAuth: string | null = null
    server.use(
      http.post("*/api/session/logout", ({ request }) => {
        seenAuth = request.headers.get("authorization")
        return failure("internal_error", 500)
      })
    )
    const store = makeStore()

    const result = await store.dispatch(apiSlice.endpoints.logout.initiate())

    // regression: returning { data: undefined } made RTK Query report an error
    expect("error" in result ? result.error : undefined).toBeUndefined()
    expect(seenAuth).toBe("Bearer acc")
    expect(getSession()).toBeNull()
    expect(store.getState().auth.isAuthenticated).toBe(false)
  })
})
