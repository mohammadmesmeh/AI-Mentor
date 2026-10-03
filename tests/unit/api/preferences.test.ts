import { describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

describe("preferences 404 handling (FR-022)", () => {
  it("T022: user_preferences_not_found resolves to null, not a thrown error", async () => {
    clearSession()
    server.use(
      http.get(`${API_BASE}/me/preferences`, () => {
        return HttpResponse.json(
          {
            error: { code: "user_preferences_not_found", message: "Preferences not found" },
            meta: { request_id: "r-prefs-404" },
          },
          { status: 404 }
        )
      })
    )

    const store = makeStore()
    const outcome = await store.dispatch(apiSlice.endpoints.getPreferences.initiate())

    expect(outcome.status).toBe("fulfilled")
    expect(outcome.data).toBeNull()
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("T022b: a non-404 failure still surfaces as an error", async () => {
    clearSession()
    server.use(
      http.get(`${API_BASE}/me/preferences`, () => {
        return HttpResponse.json(
          {
            error: { code: "validation_failed", message: "Something went wrong" },
            meta: { request_id: "r-prefs-500" },
          },
          { status: 422 }
        )
      })
    )

    const store = makeStore()
    const outcome = await store.dispatch(apiSlice.endpoints.getPreferences.initiate())

    expect(outcome.status).toBe("rejected")
    expect((outcome.error as { code: string }).code).toBe("validation_failed")
    store.dispatch(apiSlice.util.resetApiState())
  })
})
describe("preferences contract (§11: no time zone)", () => {
  it("PATCH sends only ui_locale / resource_language — never timezone — and the contract mock accepts it", async () => {
    clearSession()
    let body: Record<string, unknown> = {}
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PATCH" && request.url.endsWith("/me/preferences")) body = await request.clone().json()
    })
    const store = makeStore()
    const saved = await store
      .dispatch(apiSlice.endpoints.updatePreferences.initiate({ uiLocale: "ar", resourceLanguage: "both" }))
      .unwrap()
    server.events.removeAllListeners()

    expect(body).toEqual({ ui_locale: "ar", resource_language: "both" })
    expect(body).not.toHaveProperty("timezone")
    expect(saved).toMatchObject({ uiLocale: "ar", resourceLanguage: "both" })
    expect(saved).not.toHaveProperty("timezone")
    store.dispatch(apiSlice.util.resetApiState())
  })
})
