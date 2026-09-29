import { beforeEach, describe, expect, it } from "vitest"
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

const envelope = (data: unknown, status = 200) => HttpResponse.json({ data, meta: { request_id: "t" } }, { status })
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

function wireRoadmap(status: string, taskStatus: string, completed: number) {
  return {
    id: "r1",
    goal: "Learn Laravel",
    status,
    activated_at: "2026-09-10T09:47:00Z",
    completed_at: status === "completed" ? "2026-09-12T10:00:00Z" : null,
    progress: { completed_tasks: completed, total_tasks: 1, percentage: completed * 100 },
    current_version: {
      id: "v1",
      version_number: 1,
      source: "generated",
      status: "current",
      stages: [
        {
          id: "s1",
          title: "Basics",
          description: "",
          position: 1,
          status: status === "completed" ? "completed" : "active",
          estimated_minutes: 60,
          progress: { completed_tasks: completed, total_tasks: 1, percentage: completed * 100 },
          tasks: [
            {
              id: "t1",
              type: "read",
              title: "Read",
              instructions: "",
              position: 1,
              status: taskStatus,
              is_required: true,
              estimated_minutes: 30,
              depends_on_task_ids: [],
              resources: [],
            },
          ],
        },
      ],
    },
    created_at: "2026-09-10T09:47:00Z",
    updated_at: "2026-09-10T09:47:00Z",
  }
}

describe("active roadmap + task completion (contract §17, §20)", () => {
  beforeEach(() => clearSession())

  it("GET /me/active-roadmap: 404 active_roadmap_not_found is an empty state (null), not an error", async () => {
    const store = makeStore()
    const result = await store.dispatch(apiSlice.endpoints.getActiveRoadmap.initiate())
    expect(result.error).toBeUndefined()
    expect(result.data).toBeNull()
  })

  it("GET /me/active-roadmap: returns the roadmap with the server's progress", async () => {
    server.use(http.get(`${API_BASE}/me/active-roadmap`, () => envelope(wireRoadmap("active", "available", 0))))
    const store = makeStore()
    const result = await store.dispatch(apiSlice.endpoints.getActiveRoadmap.initiate())
    expect(result.data?.id).toBe("r1")
    expect(result.data?.progress).toEqual({ completedTasks: 0, totalTasks: 1, percentage: 0 })
  })

  it("POST /tasks/{id}/complete: sends an empty body and writes the returned roadmap into the cache", async () => {
    let body: unknown
    server.use(
      http.get(`${API_BASE}/me/active-roadmap`, () => envelope(wireRoadmap("active", "available", 0))),
      http.post(`${API_BASE}/tasks/:id/complete`, async ({ request, params }) => {
        body = await request.json()
        expect(params.id).toBe("t1")
        const updated = wireRoadmap("active", "completed", 1)
        return envelope(updated)
      })
    )
    const store = makeStore()
    await store.dispatch(apiSlice.endpoints.getActiveRoadmap.initiate())

    const done = await store.dispatch(apiSlice.endpoints.completeTask.initiate("t1")).unwrap()
    await new Promise((resolve) => setTimeout(resolve, 0)) // let the cache writes settle

    expect(body).toEqual({})
    expect(done.currentVersion?.stages[0].tasks[0].status).toBe("completed")
    const active = apiSlice.endpoints.getActiveRoadmap.select()(store.getState())
    expect(active.data?.currentVersion?.stages[0].tasks[0].status).toBe("completed")
    const byId = apiSlice.endpoints.getRoadmap.select("r1")(store.getState())
    expect(byId.data?.progress?.completedTasks).toBe(1)
  })

  it("POST /tasks/{id}/complete: 409 task_completion_conflict rejects with that code and changes nothing", async () => {
    server.use(
      http.get(`${API_BASE}/me/active-roadmap`, () => envelope(wireRoadmap("active", "available", 0))),
      http.post(`${API_BASE}/tasks/:id/complete`, () => failure("task_completion_conflict", 409))
    )
    const store = makeStore()
    await store.dispatch(apiSlice.endpoints.getActiveRoadmap.initiate())

    await expect(store.dispatch(apiSlice.endpoints.completeTask.initiate("t1")).unwrap()).rejects.toMatchObject({
      code: "task_completion_conflict",
    })
    const active = apiSlice.endpoints.getActiveRoadmap.select()(store.getState())
    expect(active.data?.currentVersion?.stages[0].tasks[0].status).toBe("available")
  })
})
