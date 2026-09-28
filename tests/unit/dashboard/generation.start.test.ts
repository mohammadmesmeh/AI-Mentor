import { beforeEach, describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
import generationReducer from "@/redux/slices/generationSlice"
import { startRoadmapGeneration } from "@/features/dashboard/hooks/useGenerateRoadmap"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { generation: generationReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

const failure = (code: string, status: number, details?: unknown) =>
  HttpResponse.json({ error: { code, message: code, details }, meta: { request_id: "t" } }, { status })

const accepted = (id: string) =>
  HttpResponse.json(
    { data: { id, status: "queued", roadmap_id: null, failure_code: null }, meta: { request_id: "t" } },
    { status: 202 }
  )

describe("startRoadmapGeneration (contract §14)", () => {
  beforeEach(() => clearSession())

  it("409 roadmap_generation_in_progress resumes polling the running request instead of failing", async () => {
    server.use(
      http.post(`${API_BASE}/roadmap-generation-requests`, () =>
        failure("roadmap_generation_in_progress", 409, { generation_request_id: "gen-running" })
      )
    )
    const store = makeStore()
    await store.dispatch(startRoadmapGeneration())
    expect(store.getState().generation).toEqual({ requesting: false, requestId: "gen-running", startError: null })
  })

  it("keeps any other refusal as the start error with its code", async () => {
    server.use(http.post(`${API_BASE}/roadmap-generation-requests`, () => failure("too_many_requests", 429)))
    const store = makeStore()
    await store.dispatch(startRoadmapGeneration())
    expect(store.getState().generation.startError).toMatchObject({ code: "too_many_requests", category: "rate_limited" })
  })

  it("a second call while the first is in flight sends no second POST", async () => {
    let posts = 0
    server.use(
      http.post(`${API_BASE}/roadmap-generation-requests`, async () => {
        posts += 1
        await new Promise((r) => setTimeout(r, 30))
        return accepted("gen-1")
      })
    )
    const store = makeStore()
    await Promise.all([store.dispatch(startRoadmapGeneration()), store.dispatch(startRoadmapGeneration())])
    expect(posts).toBe(1)
    expect(store.getState().generation.requestId).toBe("gen-1")
  })

  it("never POSTs when the learner already has an active roadmap — whoever calls it", async () => {
    let posts = 0
    server.use(
      http.get(`${API_BASE}/me/active-roadmap`, () =>
        HttpResponse.json({ data: { id: "r1", status: "active", current_version: null }, meta: { request_id: "t" } })
      ),
      http.post(`${API_BASE}/roadmap-generation-requests`, () => {
        posts += 1
        return accepted("gen-1")
      })
    )
    const store = makeStore()
    await store.dispatch(startRoadmapGeneration())
    expect(posts).toBe(0)
    expect(store.getState().generation).toEqual({ requesting: false, requestId: null, startError: null })
  })

  it("generates when there is no active roadmap (404)", async () => {
    server.use(http.post(`${API_BASE}/roadmap-generation-requests`, () => accepted("gen-2")))
    const store = makeStore()
    await store.dispatch(startRoadmapGeneration())
    expect(store.getState().generation.requestId).toBe("gen-2")
  })

  it("sends nothing when it can't tell whether a roadmap is active, and reports it", async () => {
    let posts = 0
    server.use(
      http.get(`${API_BASE}/me/active-roadmap`, () => failure("internal_error", 500)),
      http.post(`${API_BASE}/roadmap-generation-requests`, () => {
        posts += 1
        return accepted("gen-3")
      })
    )
    const store = makeStore()
    await store.dispatch(startRoadmapGeneration())
    expect(posts).toBe(0)
    expect(store.getState().generation.startError).toMatchObject({ code: "internal_error" })
  })
})
