import { http, HttpResponse } from "msw"
import type { User } from "@/lib/api/types"
import { deriveSources, errorBody, missingFields, validateLearningProfilePut, validatePreferencesPatch } from "./contract"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

const TEST_USER: User = {
  id: "01h8p2q34r5t6v7w8x9y0z1a2b",
  name: "Test User",
  email: "test@example.com",
  status: "active",
  emailVerifiedAt: null,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
}

function jsonBody(data: unknown, init?: ResponseInit) {
  return HttpResponse.json(
    { data, meta: { request_id: crypto.randomUUID() } },
    init
  )
}

function errorResponse(code: string, message: string, status = 400) {
  return HttpResponse.json(
    { error: { code, message }, meta: { request_id: crypto.randomUUID() } },
    { status }
  )
}

/**
 * What the mocked backend has stored. Starts empty for every test (reset in
 * tests/setup.ts): no learning profile yet, the default preferences of §6.
 */
export const mockState: {
  profile: Record<string, unknown> | null
  preferences: { ui_locale: string; resource_language: string; updated_at: string }
} = { profile: null, preferences: defaultPreferences() }

function defaultPreferences() {
  return { ui_locale: "en", resource_language: "both", updated_at: new Date().toISOString() }
}

export function resetMockState() {
  mockState.profile = null
  mockState.preferences = defaultPreferences()
}

/**
 * Our own session route (src/app/api/session). Default: storing works, there
 * is no cookie session to restore, logout succeeds.
 */
const sessionRouteHandlers = [
  http.post("*/api/session/store", () => new HttpResponse(null, { status: 204 })),
  http.post("*/api/session/refresh", () => errorResponse("unauthenticated", "No session.", 401)),
  http.post("*/api/session/logout", () => new HttpResponse(null, { status: 204 })),
]

export const handlers = [
  ...sessionRouteHandlers,

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (!body.name || !body.email || !body.password || !body.password_confirmation) {
      return errorResponse("validation_failed", "Validation failed", 422)
    }
    return jsonBody({
      token_type: "Bearer",
      access_token: "test-access-token",
      expires_in: 900,
      refresh_token: "test-refresh-token",
      refresh_expires_in: 2592000,
      user: TEST_USER,
    })
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (body.email === "bad@example.com") {
      return errorResponse("invalid_credentials", "Invalid credentials", 401)
    }
    return jsonBody({
      token_type: "Bearer",
      access_token: "test-access-token",
      expires_in: 900,
      refresh_token: "test-refresh-token",
      refresh_expires_in: 2592000,
      user: TEST_USER,
    })
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API_BASE}/me`, () => {
    return jsonBody(TEST_USER)
  }),

  http.get(`${API_BASE}/me/preferences`, () => jsonBody(mockState.preferences)),

  // §11: at least one of ui_locale / resource_language; a legacy timezone is
  // accepted and ignored; anything else is a 422.
  http.patch(`${API_BASE}/me/preferences`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    const details = validatePreferencesPatch(body)
    if (details) return HttpResponse.json(errorBody("validation_failed", "The given data was invalid.", details), { status: 422 })
    mockState.preferences = {
      ui_locale: body.ui_locale ?? mockState.preferences.ui_locale,
      resource_language: body.resource_language ?? mockState.preferences.resource_language,
      updated_at: new Date().toISOString(),
    }
    return jsonBody(mockState.preferences)
  }),

  http.get(`${API_BASE}/me/learning-profile`, () =>
    mockState.profile
      ? jsonBody(mockState.profile)
      : HttpResponse.json(errorBody("learning_profile_not_found", "Learning profile not found."), { status: 404 })
  ),

  // §12: create-or-replace with the five request fields; sources are derived
  // by the server (a legacy client's sources are validated, then ignored).
  http.put(`${API_BASE}/me/learning-profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const details = validateLearningProfilePut(body)
    if (details) return HttpResponse.json(errorBody("validation_failed", "The given data was invalid.", details), { status: 422 })
    const created = mockState.profile === null
    const now = new Date().toISOString()
    const methods = body.preferred_learning_methods as string[]
    mockState.profile = {
      id: "lp-test-id",
      goal: body.goal,
      self_assessed_level: body.self_assessed_level,
      desired_outcome: body.desired_outcome,
      available_minutes_per_week: body.available_minutes_per_week,
      preferred_learning_methods: methods,
      preferred_resource_sources: deriveSources(methods),
      created_at: (mockState.profile?.created_at as string | undefined) ?? now,
      updated_at: now,
    }
    return jsonBody(mockState.profile, { status: created ? 201 : 200 })
  }),

  // §13: derived from the stored profile and preferences.
  http.get(`${API_BASE}/me/onboarding-status`, () => {
    const missing = missingFields(mockState.profile, mockState.preferences)
    return jsonBody({ completed: missing.length === 0, missing_fields: missing })
  }),

  // Contract §17: no roadmap owns the active slot yet.
  http.get(`${API_BASE}/me/active-roadmap`, () => {
    return errorResponse("active_roadmap_not_found", "No active roadmap.", 404)
  }),

  http.post(`${API_BASE}/roadmap-generation-requests`, async ({ request }) => {
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? "test-key"
    return jsonBody(
      {
        id: "gen-test-id",
        status: "queued",
        roadmap_id: null,
        failure_code: null,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        idempotency_key: idempotencyKey,
        status_url: `${API_BASE}/roadmap-generation-requests/gen-test-id`,
        roadmap_url: null,
      },
      { status: 202 }
    )
  }),

  http.get(`${API_BASE}/roadmap-generation-requests/:id`, ({ params }) => {
    return jsonBody({
      id: params.id,
      status: "succeeded",
      roadmap_id: "roadmap-test-id",
      failure_code: null,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      status_url: `${API_BASE}/roadmap-generation-requests/${params.id}`,
      roadmap_url: `${API_BASE}/roadmaps/roadmap-test-id`,
    })
  }),

  http.get(`${API_BASE}/roadmaps/:id`, ({ params }) => {
    return jsonBody({
      id: params.id,
      goal: "Learn React",
      status: "ready",
      activated_at: new Date().toISOString(),
      current_version: {
        id: "version-test-id",
        version_number: 1,
        source: "generated",
        status: "current",
        stages: [
          {
            id: "stage-1",
            title: "React Fundamentals",
            description: "Learn the basics of React",
            position: 1,
            status: "active",
            estimated_minutes: 120,
            tasks: [
              {
                id: "task-1",
                type: "read",
                title: "React Docs Introduction",
                instructions: "Read the official React docs",
                position: 1,
                status: "current",
                is_required: true,
                estimated_minutes: 30,
                depends_on_task_ids: [],
                resources: [],
              },
            ],
          },
        ],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),
]