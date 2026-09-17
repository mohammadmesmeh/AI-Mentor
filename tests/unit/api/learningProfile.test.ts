import { describe, expect, it } from "vitest"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { apiSlice, type LearningProfileInput } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

function makeStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

interface WireProfile {
  goal?: unknown
  self_assessed_level?: unknown
  desired_outcome?: unknown
  available_minutes_per_week?: unknown
  preferred_learning_methods?: unknown
}

describe("learning profile PUT replaces whole resource (FR-010)", () => {
  it("T023: a second PUT fully replaces the first save rather than merging", async () => {
    clearSession()

    let stored: WireProfile = {}

    server.use(
      http.put(`${API_BASE}/me/learning-profile`, async ({ request }) => {
        stored = (await request.json()) as WireProfile
        return HttpResponse.json(
          {
            data: {
              id: "lp-1",
              ...stored,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            meta: { request_id: "r-lp" },
          },
          { status: 200 }
        )
      })
    )

    const store = makeStore()
    const first: LearningProfileInput = {
      goal: "Learn React",
      selfAssessedLevel: "intermediate",
      desiredOutcome: "Build an app",
      availableMinutesPerWeek: 300,
      preferredLearningMethods: ["hands_on_projects", "reading_docs"],
    }
    const second: LearningProfileInput = {
      goal: "Learn Angular",
      selfAssessedLevel: "complete_beginner",
      desiredOutcome: "Refresh the goal entirely",
      availableMinutesPerWeek: 120,
      preferredLearningMethods: ["video_walkthroughs"],
    }

    await store.dispatch(apiSlice.endpoints.putLearningProfile.initiate(first)).unwrap()
    const replaced = await store.dispatch(apiSlice.endpoints.putLearningProfile.initiate(second)).unwrap()

    // The server-side resource reflects exactly the second payload — no merge,
    // no leftover first-save values.
    expect(stored).toEqual({
      goal: "Learn Angular",
      self_assessed_level: "complete_beginner",
      desired_outcome: "Refresh the goal entirely",
      available_minutes_per_week: 120,
      preferred_learning_methods: ["video_walkthroughs"],
    })
    expect(replaced).toMatchObject({
      goal: "Learn Angular",
      selfAssessedLevel: "complete_beginner",
      desiredOutcome: "Refresh the goal entirely",
      availableMinutesPerWeek: 120,
      preferredLearningMethods: ["video_walkthroughs"],
    })

    store.dispatch(apiSlice.util.resetApiState())
  })
})