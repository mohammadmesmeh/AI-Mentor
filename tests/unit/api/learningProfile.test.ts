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

describe("learning profile contract (§12: five fields, sources derived by the server)", () => {
  // Uses the default MSW handlers, which enforce the contract's validation
  // (tests/msw/contract.ts): a body Render would reject is rejected here too.
  it("PUT sends exactly the five request fields — never preferred_resource_sources — with minutes as an integer", async () => {
    clearSession()
    let body: Record<string, unknown> = {}
    let status = 0
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT" && request.url.endsWith("/me/learning-profile")) body = await request.clone().json()
    })
    server.events.on("response:mocked", ({ request, response }) => {
      if (request.method === "PUT" && request.url.endsWith("/me/learning-profile")) status = response.status
    })
    const store = makeStore()
    const saved = await store
      .dispatch(
        apiSlice.endpoints.putLearningProfile.initiate({
          goal: "Learn React",
          selfAssessedLevel: "some_experience",
          desiredOutcome: "Ship an app",
          availableMinutesPerWeek: 180,
          preferredLearningMethods: ["video_walkthroughs", "hands_on_projects"],
        })
      )
      .unwrap()
    server.events.removeAllListeners()

    // "Extra fields are rejected" — nothing more, nothing less.
    expect(Object.keys(body).sort()).toEqual([
      "available_minutes_per_week",
      "desired_outcome",
      "goal",
      "preferred_learning_methods",
      "self_assessed_level",
    ])
    expect(body).not.toHaveProperty("preferred_resource_sources")
    expect(body.available_minutes_per_week).toBe(180)
    expect(Number.isInteger(body.available_minutes_per_week)).toBe(true)
    expect(status).toBe(201)
    // GET/PUT still expose the derived sources as output.
    expect(saved.preferredResourceSources).toEqual(["youtube"])
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("the contract mock rejects a body without the learning methods (422 with details)", async () => {
    clearSession()
    const store = makeStore()
    const result = await store.dispatch(
      apiSlice.endpoints.putLearningProfile.initiate({
        goal: "Learn React",
        selfAssessedLevel: "some_experience",
        desiredOutcome: "Ship an app",
        availableMinutesPerWeek: 10,
        preferredLearningMethods: [],
      })
    )
    expect(result.error).toMatchObject({ code: "validation_failed", category: "invalid_input" })
    expect(Object.keys((result.error as { details: Record<string, unknown> }).details).sort()).toEqual([
      "available_minutes_per_week",
      "preferred_learning_methods",
    ])
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("GET reads the derived preferred_resource_sources, null for a legacy record without methods", async () => {
    clearSession()
    server.use(
      http.get(`${API_BASE}/me/learning-profile`, () =>
        HttpResponse.json({
          data: {
            id: "lp",
            goal: "Git",
            self_assessed_level: "complete_beginner",
            desired_outcome: "Use Git",
            available_minutes_per_week: 120,
            preferred_learning_methods: null,
            preferred_resource_sources: null,
          },
          meta: { request_id: "r" },
        })
      )
    )
    const store = makeStore()
    const profile = await store.dispatch(apiSlice.endpoints.getLearningProfile.initiate()).unwrap()
    expect(profile?.preferredResourceSources).toBeNull()
    store.dispatch(apiSlice.util.resetApiState())
  })

  it("GET 404 learning_profile_not_found is an empty profile (null), not an error", async () => {
    clearSession()
    const store = makeStore()
    const result = await store.dispatch(apiSlice.endpoints.getLearningProfile.initiate())
    expect(result.error).toBeUndefined()
    expect(result.data).toBeNull()
    store.dispatch(apiSlice.util.resetApiState())
  })
})