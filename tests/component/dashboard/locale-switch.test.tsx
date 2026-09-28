import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import authReducer, { sessionEstablished } from "@/redux/slices/authSlice"
import generationReducer, { generationAccepted } from "@/redux/slices/generationSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, setSession } from "@/lib/api/auth"
import type { User } from "@/lib/api/types"
import { DashboardPage } from "@/features/dashboard/components/pages/dashboard-page"
import { SessionRestorer, resetSessionRestorerForTests } from "@/shared/components/providers/SessionRestorer"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

// Phase 1 bugs: a language switch remounts everything under [locale]; it must
// keep the session and the cached roadmap and never request a generation. And
// leftover generation state must never hide the active roadmap.

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const envelope = (data: unknown) => HttpResponse.json({ data, meta: { request_id: "t" } })

const ACTIVE = {
  id: "r1",
  goal: "Learn Git",
  status: "active",
  activated_at: "2026-09-28T08:00:00Z",
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
        status: "active",
        estimated_minutes: 30,
        tasks: [
          {
            id: "t1",
            type: "read",
            title: "Read the Git book",
            instructions: "",
            position: 1,
            status: "available",
            is_required: true,
            estimated_minutes: 30,
            depends_on_task_ids: [],
            resources: [],
          },
        ],
      },
    ],
  },
  created_at: "2026-09-28T08:00:00Z",
  updated_at: "2026-09-28T08:00:00Z",
}

function counters() {
  const calls = { generationPosts: 0, activeGets: 0, refreshes: 0, statusGets: 0 }
  server.use(
    http.get(`${API_BASE}/me/onboarding-status`, () => envelope({ completed: true, missing_fields: [] })),
    http.get(`${API_BASE}/me/active-roadmap`, () => {
      calls.activeGets += 1
      return envelope(ACTIVE)
    }),
    http.post(`${API_BASE}/roadmap-generation-requests`, () => {
      calls.generationPosts += 1
      return envelope({ id: "gen-new", status: "queued", roadmap_id: null, failure_code: null })
    }),
    http.get(`${API_BASE}/roadmap-generation-requests/:id`, () => {
      calls.statusGets += 1
      return envelope({ id: "gen-old", status: "running", roadmap_id: null, failure_code: null })
    }),
    http.post("*/api/session/refresh", () => {
      calls.refreshes += 1
      return HttpResponse.json({
        data: { token_type: "Bearer", access_token: "acc", expires_in: 900, user: { id: "u1", name: "Learner" } },
        meta: { request_id: "t" },
      })
    })
  )
  return calls
}

function signedInStore() {
  const store = configureStore({
    reducer: { auth: authReducer, generation: generationReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
  setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: Date.now() + 900_000 })
  store.dispatch(sessionEstablished({ id: "u1", name: "Learner", email: "l@example.com" } as User))
  return store
}

function renderIn(store: ReturnType<typeof signedInStore>, locale: "en" | "ar") {
  return render(
    <Provider store={store}>
      <IntlWrapper locale={locale} messages={locale === "en" ? enMessages : arMessages}>
        <SessionRestorer />
        <DashboardPage />
      </IntlWrapper>
    </Provider>
  )
}

describe("language switch and leftover generation state", () => {
  beforeEach(() => {
    clearSession()
    resetSessionRestorerForTests()
  })

  it("switching en → ar → en keeps the session and the cached roadmap and sends no generation request", async () => {
    const calls = counters()
    const store = signedInStore()

    const first = renderIn(store, "en")
    expect(await screen.findByRole("heading", { level: 2, name: "Learn Git" })).toBeInTheDocument()
    first.unmount() // what a [locale] change does to the tree

    const second = renderIn(store, "ar")
    expect(await screen.findByRole("heading", { level: 1, name: /أهلًا بعودتك/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Learn Git" })).toBeInTheDocument()
    second.unmount()

    renderIn(store, "en")
    expect(await screen.findByRole("heading", { level: 2, name: "Learn Git" })).toBeInTheDocument()

    expect(calls.generationPosts).toBe(0)
    expect(calls.activeGets).toBe(1) // served from the cache after the first load
    expect(calls.refreshes).toBe(1) // restored once per page load, not per remount
    expect(store.getState().auth.isAuthenticated).toBe(true)
  })

  it("leftover generation state (a request still 'running') never hides the active roadmap, and is cleared", async () => {
    const calls = counters()
    const store = signedInStore()
    store.dispatch(generationAccepted("gen-old"))

    renderIn(store, "en")

    expect(await screen.findByRole("heading", { level: 2, name: "Learn Git" })).toBeInTheDocument()
    expect(screen.queryByText(enMessages.dashboard.pollingTimedOut)).toBeNull()
    expect(screen.queryByRole("heading", { name: enMessages.dashboard.generatingTitle })).toBeNull()
    expect(store.getState().generation.requestId).toBeNull()
    expect(calls.generationPosts).toBe(0)
  })
})
