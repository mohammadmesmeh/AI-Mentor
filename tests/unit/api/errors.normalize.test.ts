import { beforeEach, describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, getSession, setSession } from "@/lib/api/auth"
import { asApiError, toApiError } from "@/lib/api/errors"
import { authErrorKey } from "@/features/auth/lib/authErrorKey"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

const failure = (code: string, status: number, details?: unknown) =>
  HttpResponse.json({ error: { code, message: code, details }, meta: { request_id: "req-1" } }, { status })

describe("asApiError — the shared helper for unwrap() errors", () => {
  beforeEach(() => clearSession())

  it("regression: keeps the code of an unwrap() rejection (toApiError turned it into internal_error)", async () => {
    server.use(
      http.post(`${API_BASE}/roadmap-generation-requests`, () =>
        failure("roadmap_generation_in_progress", 409, { generation_request_id: "gen-1" })
      )
    )
    const store = makeStore()
    let thrown: unknown
    try {
      await store.dispatch(apiSlice.endpoints.requestRoadmapGeneration.initiate({ idempotencyKey: "key-12345" })).unwrap()
    } catch (error) {
      thrown = error
    }
    expect(toApiError(thrown).code).toBe("internal_error") // the old bug
    expect(asApiError(thrown)).toMatchObject({
      code: "roadmap_generation_in_progress",
      category: "conflict",
      details: { generation_request_id: "gen-1" },
      requestId: "req-1",
    })
  })

  it("normalizes a raw fetchBaseQuery error ({status, data})", () => {
    const error = asApiError({ status: 401, data: { error: { code: "unauthenticated", message: "x" }, meta: {} } })
    expect(error).toMatchObject({ code: "unauthenticated", category: "access_denied" })
  })

  it("never throws on junk", () => {
    expect(asApiError(undefined).category).toBe("unexpected")
    expect(asApiError("boom").category).toBe("unexpected")
  })

  it.each([
    ["active_roadmap_not_found", "not_found"],
    ["task_not_found", "not_found"],
    ["roadmap_activation_conflict", "conflict"],
    ["task_completion_conflict", "conflict"],
    ["internal_error", "unexpected"],
    ["too_many_requests", "rate_limited"],
    ["authentication_service_unavailable", "unavailable"],
  ])("maps the contract code %s to %s", (code, category) => {
    expect(toApiError({ error: { code, message: code } }).category).toBe(category)
  })
})

describe("auth form errors (contract §6, §7)", () => {
  beforeEach(() => clearSession())

  async function loginError(respond: () => Response) {
    server.use(http.post(`${API_BASE}/auth/login`, respond))
    const store = makeStore()
    try {
      await store.dispatch(apiSlice.endpoints.login.initiate({ email: "a@b.co", password: "x" })).unwrap()
    } catch (error) {
      return error
    }
    throw new Error("login should have failed")
  }

  it("regression: a wrong password (422 validation_failed) is invalidCredentials, not unexpectedError", async () => {
    const error = await loginError(() => failure("validation_failed", 422, { email: ["incorrect"] }))
    expect(authErrorKey(error, "login")).toBe("invalidCredentials")
  })

  it("429 is tooManyRequests", async () => {
    const error = await loginError(() => failure("too_many_requests", 429))
    expect(authErrorKey(error, "login")).toBe("tooManyRequests")
  })
})

describe("refresh failure signs out (contract §8)", () => {
  beforeEach(() => clearSession())

  it("regression: a 401 from /auth/refresh clears the session (the raw error used to be misread)", async () => {
    setSession({ tokenType: "Bearer", accessToken: "old", expiresAt: 0, refreshToken: "rt", refreshExpiresAt: 0 })
    server.use(
      http.get(`${API_BASE}/me`, () => failure("unauthenticated", 401)),
      http.post(`${API_BASE}/auth/refresh`, () => failure("unauthenticated", 401))
    )
    const result = await makeStore().dispatch(apiSlice.endpoints.getMe.initiate())
    expect(result.error).toMatchObject({ code: "unauthenticated" })
    expect(getSession()).toBeNull()
  })

  it("a 503 from /auth/refresh keeps the tokens", async () => {
    setSession({ tokenType: "Bearer", accessToken: "old", expiresAt: 0, refreshToken: "rt", refreshExpiresAt: 0 })
    server.use(
      http.get(`${API_BASE}/me`, () => failure("unauthenticated", 401)),
      http.post(`${API_BASE}/auth/refresh`, () => failure("authentication_service_unavailable", 503))
    )
    await makeStore().dispatch(apiSlice.endpoints.getMe.initiate())
    expect(getSession()?.refreshToken).toBe("rt")
  })
})

describe("logout (contract §9)", () => {
  beforeEach(() => clearSession())

  it("regression: sends the bearer and the refresh token, then clears the session", async () => {
    setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: 0, refreshToken: "rt-1", refreshExpiresAt: 0 })
    let seen: { auth: string | null; body: unknown } | null = null
    server.use(
      http.post(`${API_BASE}/auth/logout`, async ({ request }) => {
        seen = { auth: request.headers.get("authorization"), body: await request.json() }
        return new HttpResponse(null, { status: 204 })
      })
    )
    const result = await makeStore().dispatch(apiSlice.endpoints.logout.initiate())
    // regression: returning { data: undefined } made RTK Query report an error
    expect("error" in result ? result.error : undefined).toBeUndefined()
    expect(seen).toEqual({ auth: "Bearer acc", body: { refresh_token: "rt-1" } })
    expect(getSession()).toBeNull()
  })
})
