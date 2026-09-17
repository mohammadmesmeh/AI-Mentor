import { describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
import type { ApiError } from "@/lib/api/errors"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

async function expectGenericLoginFailure(payload: { email: string; password: string }) {
  const store = makeStore()
  const attempt = store.dispatch(
    apiSlice.endpoints.login.initiate({ email: payload.email, password: payload.password })
  )
  const outcome = await attempt
  const error = outcome.error as ApiError
  expect(error.code).toBe("validation_failed")
  expect(error.category).toBe("invalid_input")
  expect(error.message).not.toBe("")
  store.dispatch(apiSlice.util.resetApiState())
  return error
}

describe("auth login error handling (FR-002)", () => {
  it("T014: wrong password and non-existent email resolve to the same generic outcome", async () => {
    clearSession()

    server.use(
      http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string }
        const isWrongPassword = body.email === "known@example.com"
        const isUnknownEmail = body.email === "unknown@example.com"
        expect(isWrongPassword || isUnknownEmail).toBe(true)
        return HttpResponse.json(
          {
            error: { code: "validation_failed", message: "The provided credentials are incorrect." },
            meta: { request_id: "req-login-fail" },
          },
          { status: 422 }
        )
      })
    )

    const wrongPassword = await expectGenericLoginFailure({
      email: "known@example.com",
      password: "wrong-password",
    })
    const unknownEmail = await expectGenericLoginFailure({
      email: "unknown@example.com",
      password: "any-password",
    })

    // Identical surface outcome — the client must never distinguish the two.
    expect(wrongPassword.category).toBe(unknownEmail.category)
    expect(wrongPassword.code).toBe(unknownEmail.code)
  })
})