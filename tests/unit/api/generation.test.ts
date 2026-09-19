import { describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { createIdempotencyKey } from "@/lib/api/idempotency"
import { clearSession } from "@/lib/api/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

describe("roadmap generation idempotency (FR-012, FR-013)", () => {
  it("creates a distinct idempotency key for each fresh attempt", () => {
    const keyA = createIdempotencyKey()
    const keyB = createIdempotencyKey()
    expect(keyA).not.toBe(keyB)
    expect(keyA.length).toBeGreaterThanOrEqual(8)
    expect(keyA.length).toBeLessThanOrEqual(128)
  })

  it("T030: requestRoadmapGeneration sends the provided Idempotency-Key header", async () => {
    clearSession()
    const recordedHeaders: string[] = []
    server.use(
      http.post(`${API_BASE}/roadmap-generation-requests`, ({ request }) => {
        recordedHeaders.push(request.headers.get("Idempotency-Key") ?? "none")
        return HttpResponse.json(
          {
            data: {
              id: "gen-a",
              status: "queued",
              roadmap_id: null,
              failure_code: null,
              created_at: new Date().toISOString(),
              started_at: null,
              completed_at: null,
              status_url: `${API_BASE}/roadmap-generation-requests/gen-a`,
              roadmap_url: null,
            },
            meta: { request_id: "r-gen" },
          },
          { status: 202 }
        )
      })
    )

    const store = makeStore()
    await store
      .dispatch(apiSlice.endpoints.requestRoadmapGeneration.initiate({ idempotencyKey: "key-for-attempt" }))
      .unwrap()

    expect(recordedHeaders).toEqual(["key-for-attempt"])
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("T030b: 409 roadmap_generation_in_progress resolves via its generation_request_id", async () => {
    clearSession()
    server.use(
      http.post(`${API_BASE}/roadmap-generation-requests`, () => {
        return HttpResponse.json(
          {
            error: {
              code: "roadmap_generation_in_progress",
              message: "Generation already in progress.",
              details: { generation_request_id: "existing-gen-id" },
            },
            meta: { request_id: "r-409" },
          },
          { status: 409 }
        )
      })
    )

    const store = makeStore()
    const outcome = await store.dispatch(
      apiSlice.endpoints.requestRoadmapGeneration.initiate({ idempotencyKey: "x" })
    )

    expect(outcome.error).not.toBeUndefined()
    const error = outcome.error as { code: string; details?: Record<string, unknown> }
    expect(error.code).toBe("roadmap_generation_in_progress")
    expect(error.details?.generation_request_id).toBe("existing-gen-id")
    store.dispatch(apiSlice.util.resetApiState())
  })
})