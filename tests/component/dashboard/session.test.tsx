import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import authReducer from "@/redux/slices/authSlice"
import generationReducer from "@/redux/slices/generationSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
import { DashboardPage } from "@/features/dashboard/components/pages/dashboard-page"
import enMessages from "../../../messages/en.json"

// Regression for "fresh login → /dashboard → blank page" (onboarding-status 401).
// Root cause: tokens live only in memory (FR-007), so a full page load starts
// with no session and the gate call went out with no Authorization header.

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const TOKEN = "fresh-login-token"
const t = enMessages.dashboard

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, generation: generationReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

function envelope(data: unknown, status = 200) {
  return HttpResponse.json({ data, meta: { request_id: "t" } }, { status })
}

/** Records the Authorization header of every onboarding-status call. */
function onboardingStatusHandler(respond: () => Response) {
  const seen: (string | null)[] = []
  server.use(
    http.get(`${API_BASE}/me/onboarding-status`, ({ request }) => {
      const auth = request.headers.get("authorization")
      seen.push(auth)
      if (auth !== `Bearer ${TOKEN}`) {
        return HttpResponse.json(
          { error: { code: "unauthenticated", message: "Unauthenticated." }, meta: { request_id: "t" } },
          { status: 401 }
        )
      }
      return respond()
    })
  )
  return seen
}

async function freshLogin(store: ReturnType<typeof makeStore>) {
  server.use(
    http.post(`${API_BASE}/auth/login`, () =>
      envelope({
        token_type: "Bearer",
        access_token: TOKEN,
        expires_in: 900,
        refresh_token: "fresh-refresh-token",
        refresh_expires_in: 2592000,
        user: { id: "u1", name: "Test Learner", email: "t@example.com" },
      })
    )
  )
  await store.dispatch(apiSlice.endpoints.login.initiate({ email: "t@example.com", password: "secret123" }))
}

function renderDashboard(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <IntlWrapper messages={enMessages}>
        <DashboardPage />
      </IntlWrapper>
    </Provider>
  )
}

describe("dashboard onboarding-status gate (regression)", () => {
  beforeEach(() => {
    clearSession()
  })

  it("fresh login → dashboard: the gate call carries the Bearer token, succeeds, and the dashboard renders", async () => {
    const store = makeStore()
    const seen = onboardingStatusHandler(() => envelope({ completed: true, missing_fields: [] }))

    await freshLogin(store)
    renderDashboard(store)

    expect(
      await screen.findByRole("heading", { level: 1, name: t.roadmapGenerationTitle })
    ).toBeInTheDocument()
    expect(seen).toEqual([`Bearer ${TOKEN}`])
  })

  it("no in-memory session (full page load after login): no gate call is sent and a sign-in state is shown, not a blank page", async () => {
    const store = makeStore()
    const seen = onboardingStatusHandler(() => envelope({ completed: true, missing_fields: [] }))

    renderDashboard(store)

    expect(await screen.findByRole("heading", { level: 1, name: t.signedOutTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: t.signInAgain })).toHaveAttribute("href", "/auth")
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(seen).toEqual([])
  })

  it("a failed gate check shows an error with retry — never blank or the generation screen", async () => {
    const store = makeStore()
    let fail = true
    const seen = onboardingStatusHandler(() =>
      fail
        ? HttpResponse.json(
            { error: { code: "service_unavailable", message: "down" }, meta: { request_id: "t" } },
            { status: 503 }
          )
        : envelope({ completed: true, missing_fields: [] })
    )

    await freshLogin(store)
    renderDashboard(store)

    expect(
      await screen.findByRole("heading", { level: 1, name: t.dashboardLoadErrorTitle }, { timeout: 4000 })
    ).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: t.roadmapGenerationTitle })).toBeNull()
    expect(seen.every((h) => h === `Bearer ${TOKEN}`)).toBe(true)

    fail = false
    fireEvent.click(screen.getByRole("button", { name: t.retryLoad }))
    expect(
      await screen.findByRole("heading", { level: 1, name: t.roadmapGenerationTitle })
    ).toBeInTheDocument()
  })
})
