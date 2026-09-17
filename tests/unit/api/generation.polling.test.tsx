import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import type { ReactNode } from "react"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
import { useRoadmapGenerationPolling } from "@/features/dashboard/hooks/useRoadmapGenerationPolling"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

function wrapper(store: ReturnType<typeof makeStore>) {
  return function W({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }
}

function statusResponse(status: string, roadmapId: string | null) {
  return HttpResponse.json(
    {
      data: {
        id: "gen-poll-id",
        status,
        roadmap_id: roadmapId,
        failure_code: null,
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status_url: `${API_BASE}/roadmap-generation-requests/gen-poll-id`,
        roadmap_url: roadmapId ? `${API_BASE}/roadmaps/${roadmapId}` : null,
      },
      meta: { request_id: "r-poll" },
    },
    { status: 200 }
  )
}

describe("roadmap generation polling (FR-014, FR-015)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearSession()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("T031: polling stops immediately on a terminal status and issues no further status requests", async () => {
    let statusRequests = 0
    server.use(
      http.get(`${API_BASE}/roadmap-generation-requests/gen-poll-id`, () => {
        statusRequests += 1
        return statusResponse("succeeded", "roadmap-ready-id")
      })
    )

    const store = makeStore()
    const { result } = renderHook(() => useRoadmapGenerationPolling("gen-poll-id"), {
      wrapper: wrapper(store),
    })

    expect(result.current.phase).toBe("starting")

    // Drive past the first fast poll (1000ms) so the single terminal response lands.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(result.current.phase).toBe("ready")
    expect(result.current.request?.roadmapId).toBe("roadmap-ready-id")
    expect(statusRequests).toBe(1)

    // Advance well beyond the slow interval: no further status requests.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000)
    })
    expect(statusRequests).toBe(1)
    expect(result.current.phase).toBe("ready")

    store.dispatch(apiSlice.util.resetApiState())
  })

  it("T037: bounded timeout surfaces timed_out and checkAgain resumes polling the same request", async () => {
    let statusRequests = 0
    let generationPosts = 0
    server.use(
      http.get(`${API_BASE}/roadmap-generation-requests/gen-poll-id`, () => {
        statusRequests += 1
        return statusResponse("running", null)
      }),
      http.post(`${API_BASE}/roadmap-generation-requests`, () => {
        generationPosts += 1
        return statusResponse("queued", null)
      })
    )

    const store = makeStore()
    const { result } = renderHook(() => useRoadmapGenerationPolling("gen-poll-id", 5000), {
      wrapper: wrapper(store),
    })

    // Single fast poll happens; status stays non-terminal.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(result.current.phase).toBe("in_progress")

    // Timeout elapses -> timed_out.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    expect(result.current.phase).toBe("timed_out")
    const requestsBeforeCheckAgain = statusRequests

    // "Check again" resumes polling the SAME request id (no new generation POST).
    await act(async () => {
      result.current.checkAgain()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    expect(statusRequests).toBeGreaterThan(requestsBeforeCheckAgain)
    expect(generationPosts).toBe(0)

    store.dispatch(apiSlice.util.resetApiState())
  })
})