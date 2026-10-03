import { beforeEach, describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
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

describe("automatic retry", () => {
  it("never retries a 429 automatically (contract: disable retry temporarily)", async () => {
    const { isRetryableCategory } = await import("@/lib/api/errors")
    expect(isRetryableCategory("rate_limited")).toBe(false)
    expect(isRetryableCategory("unavailable")).toBe(true)
  })
})
