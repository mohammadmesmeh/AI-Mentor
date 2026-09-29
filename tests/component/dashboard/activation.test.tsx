import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import authReducer, { sessionEstablished } from "@/redux/slices/authSlice"
import generationReducer from "@/redux/slices/generationSlice"
import workspaceReducer from "@/redux/slices/workspaceSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, setSession } from "@/lib/api/auth"
import type { User } from "@/lib/api/types"
import { DashboardPage } from "@/features/dashboard/components/pages/dashboard-page"
import enMessages from "../../../messages/en.json"

// Phase 3: a learner has one roadmap and it must be active. A generated
// roadmap that comes back `ready` is activated automatically (contract §18),
// then the dashboard loads GET /me/active-roadmap.

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const t = enMessages.dashboard

const envelope = (data: unknown, status = 200) => HttpResponse.json({ data, meta: { request_id: "t" } }, { status })
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

function wireRoadmap(status: "ready" | "active") {
  return {
    id: "r1",
    goal: "Learn Git",
    status,
    activated_at: status === "active" ? "2026-09-28T08:07:07Z" : null,
    completed_at: null,
    progress: { completed_tasks: 0, total_tasks: 1, percentage: 0 },
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
          status: status === "active" ? "active" : "upcoming",
          estimated_minutes: 30,
          progress: { completed_tasks: 0, total_tasks: 1, percentage: 0 },
          tasks: [
            {
              id: "t1",
              type: "read",
              title: "Read the Git book",
              instructions: "",
              position: 1,
              status: status === "active" ? "available" : "upcoming",
              is_required: true,
              estimated_minutes: 30,
              depends_on_task_ids: [],
              resources: [{ id: "res1", title: "Pro Git", url: "https://git-scm.com/book", type: "documentation", position: 1 }],
            },
          ],
        },
      ],
    },
    created_at: "2026-09-28T08:07:07Z",
    updated_at: "2026-09-28T08:07:07Z",
  }
}

function signedInStore() {
  const store = configureStore({
    reducer: { auth: authReducer, generation: generationReducer, workspace: workspaceReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
  setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: Date.now() + 900_000})
  store.dispatch(sessionEstablished({ id: "u1", name: "Learner", email: "l@example.com" } as User))
  return store
}

/**
 * Generation succeeds with roadmap r1. With `autoActivated` the backend makes it
 * active itself (what Render does for a first roadmap); otherwise it stays
 * `ready` until activated. Activation is scripted per test.
 */
function backend(generatedStatus: "ready" | "active", activate: () => Response) {
  let isActive = false
  const calls = { activate: 0 }
  server.use(
    http.get(`${API_BASE}/me/onboarding-status`, () => envelope({ completed: true, missing_fields: [] })),
    http.get(`${API_BASE}/me/active-roadmap`, () =>
      isActive ? envelope(wireRoadmap("active")) : failure("active_roadmap_not_found", 404)
    ),
    http.post(`${API_BASE}/roadmap-generation-requests`, () =>
      envelope({ id: "gen-1", status: "queued", roadmap_id: null, failure_code: null }, 202)
    ),
    http.get(`${API_BASE}/roadmap-generation-requests/:id`, () => {
      if (generatedStatus === "active") isActive = true
      return envelope({ id: "gen-1", status: "succeeded", roadmap_id: "r1", failure_code: null })
    }),
    http.get(`${API_BASE}/roadmaps/:id`, () => envelope(wireRoadmap(isActive ? "active" : "ready"))),
    http.post(`${API_BASE}/roadmaps/:id/activate`, () => {
      calls.activate += 1
      const response = activate()
      if (response.status === 200) isActive = true
      return response
    })
  )
  return calls
}

function renderDashboard(store: ReturnType<typeof signedInStore>) {
  render(
    <Provider store={store}>
      <IntlWrapper messages={enMessages}>
        <DashboardPage />
      </IntlWrapper>
    </Provider>
  )
}

async function generate() {
  fireEvent.click(await screen.findByRole("button", { name: t.generateRoadmap }))
}

// The Overview is up when its main action points at the task to do next.
const workspace = () => screen.findByRole("link", { name: enMessages.workspace.openTask }, { timeout: 6000 })

describe("first roadmap activation (contract §18, §22)", () => {
  beforeEach(() => clearSession())

  it("activates a `ready` roadmap automatically, then shows it with its tasks and resources", async () => {
    const calls = backend("ready", () => envelope(wireRoadmap("active")))
    renderDashboard(signedInStore())

    await generate()

    expect(await workspace()).toBeInTheDocument()
    expect(calls.activate).toBe(1)
    expect(screen.getByRole("link", { name: enMessages.workspace.openTask })).toHaveAttribute("href", "/tasks/t1")
    expect(screen.getAllByText("Read the Git book").length).toBeGreaterThan(0)
    // No activation control is ever shown to the learner.
    expect(screen.queryByRole("button", { name: /activate/i })).toBeNull()
  })

  it("does nothing when the backend already activated the first roadmap", async () => {
    const calls = backend("active", () => envelope(wireRoadmap("active")))
    renderDashboard(signedInStore())

    await generate()

    expect(await workspace()).toBeInTheDocument()
    expect(calls.activate).toBe(0)
  })

  it("409 roadmap_activation_conflict shows a clear error with a retry that recovers", async () => {
    let fail = true
    const calls = backend("ready", () => (fail ? failure("roadmap_activation_conflict", 409) : envelope(wireRoadmap("active"))))
    renderDashboard(signedInStore())

    await generate()

    const alert = await screen.findByRole("alert", {}, { timeout: 6000 })
    expect(alert).toHaveTextContent(t.activationConflictDescription)
    expect(screen.queryByText(t.generationFailedGeneric)).toBeNull()

    fail = false
    fireEvent.click(screen.getByRole("button", { name: t.retryActivation }))
    expect(await workspace()).toBeInTheDocument()
    expect(calls.activate).toBe(2)
  })

  it("a failed activation (500) is an error with retry, not the start screen", async () => {
    backend("ready", () => failure("internal_error", 500))
    renderDashboard(signedInStore())

    await generate()

    expect(await screen.findByRole("alert", {}, { timeout: 6000 })).toHaveTextContent(t.activationFailedDescription)
    expect(screen.queryByRole("button", { name: t.generateRoadmap })).toBeNull()
  })
})
