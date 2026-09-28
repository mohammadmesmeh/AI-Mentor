import { http, HttpResponse } from "msw"
import type { User } from "@/lib/api/types"

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

  http.get(`${API_BASE}/me/preferences`, () => {
    return jsonBody({
      ui_locale: "en",
      resource_language: "both",
      timezone: "UTC",
      updatedAt: new Date().toISOString(),
    })
  }),

  http.patch(`${API_BASE}/me/preferences`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    return jsonBody({
      ui_locale: body.ui_locale ?? "en",
      resource_language: body.resource_language ?? "both",
      timezone: body.timezone ?? "UTC",
      updatedAt: new Date().toISOString(),
    })
  }),

  http.get(`${API_BASE}/me/learning-profile`, () => {
    return HttpResponse.json(
      { error: { code: "learning_profile_not_found", message: "Not found" }, meta: { request_id: crypto.randomUUID() } },
      { status: 404 }
    )
  }),

  http.put(`${API_BASE}/me/learning-profile`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return jsonBody({
      id: "lp-test-id",
      goal: body.goal,
      self_assessed_level: body.self_assessed_level,
      desired_outcome: body.desired_outcome,
      available_minutes_per_week: body.available_minutes_per_week,
      preferred_learning_methods: body.preferred_learning_methods,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  http.get(`${API_BASE}/me/onboarding-status`, () => {
    return jsonBody({ completed: false, missingFields: [] })
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