import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import authReducer, { clearLocalSession, sessionEstablished } from "@/redux/slices/authSlice"
import generationReducer from "@/redux/slices/generationSlice"
import workspaceReducer from "@/redux/slices/workspaceSlice"
import onboardingReducer, { goToStep, updateForm } from "@/redux/slices/onboardingSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession, setSession } from "@/lib/api/auth"
import type { User } from "@/lib/api/types"
import { OnboardingPage } from "@/features/onboarding/components/pages/onboarding-page"
import enMessages from "../../../messages/en.json"

// Known bug: onboarding sent its calls without a session, and a 401 surfaced
// as a roadmap failure. Also the empty-dashboard root cause: finishing
// onboarding promised "we're creating your roadmap now" but never asked for one.

const replace = vi.fn()
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/onboarding",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const failure422 = (details: Record<string, string[]>) =>
  HttpResponse.json(
    { error: { code: "validation_failed", message: "x", details }, meta: { request_id: "t" } },
    { status: 422 }
  )
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

function makeStore({ signedIn }: { signedIn: boolean }) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      generation: generationReducer, workspace: workspaceReducer,
      onboarding: onboardingReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
  if (!signedIn) store.dispatch(clearLocalSession())
  if (signedIn) {
    setSession({ tokenType: "Bearer", accessToken: "acc", expiresAt: Date.now() + 900_000})
    store.dispatch(sessionEstablished({ id: "u1", name: "Learner", email: "l@example.com" } as User))
  }
  // A filled-in form on the review step.
  store.dispatch(
    updateForm({
      goal: "Learn Git",
      selfAssessedLevel: "complete_beginner",
      availableMinutesPerWeek: 120,
      desiredOutcome: "Use Git daily",
      preferredLearningMethods: ["reading_docs"],
    })
  )
  store.dispatch(goToStep(7))
  return store
}

function renderOnboarding(store: ReturnType<typeof makeStore>) {
  render(
    <Provider store={store}>
      <IntlWrapper messages={enMessages}>
        <OnboardingPage />
      </IntlWrapper>
    </Provider>
  )
}

/** Records every request to /me/* and /roadmap-generation-requests. */
function recordCalls() {
  const calls: string[] = []
  server.events.on("request:start", ({ request }) => {
    const path = new URL(request.url).pathname
    if (/\/me\b|roadmap-generation-requests/.test(path)) calls.push(`${request.method} ${path.replace(/^.*\/api\/v1/, "")}`)
  })
  return calls
}

const submit = async () =>
  fireEvent.click(await screen.findByRole("button", { name: enMessages.onboarding.submitOnboarding }))

describe("onboarding session handling", () => {
  beforeEach(() => {
    clearSession()
    replace.mockClear()
    server.events.removeAllListeners()
  })

  it("without a session: asks for sign-in and sends no request", async () => {
    const calls = recordCalls()
    renderOnboarding(makeStore({ signedIn: false }))

    expect(await screen.findByRole("heading", { level: 1, name: enMessages.dashboard.signedOutTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: enMessages.dashboard.signInAgain })).toHaveAttribute("href", "/auth")
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(calls).toEqual([])
  })

  it("a 401 on submit (refresh unavailable) is a session message — never a roadmap failure", async () => {
    server.use(
      http.put(`${API_BASE}/me/learning-profile`, () => failure("unauthenticated", 401)),
      http.post("*/api/session/refresh", () => failure("authentication_service_unavailable", 503))
    )
    renderOnboarding(makeStore({ signedIn: true }))

    await submit()

    expect(await screen.findByText(enMessages.onboarding.submitSessionExpired)).toBeInTheDocument()
    expect(screen.queryByText(enMessages.dashboard.generationFailedGeneric)).toBeNull()
    expect(screen.queryByText(enMessages.onboarding.stepSixSubmitFailed)).toBeNull()
  })

  it("a 401 whose refresh fails signs out and shows sign-in", async () => {
    server.use(
      http.put(`${API_BASE}/me/learning-profile`, () => failure("unauthenticated", 401)),
      http.post("*/api/session/refresh", () => failure("unauthenticated", 401))
    )
    renderOnboarding(makeStore({ signedIn: true }))

    await submit()

    expect(await screen.findByRole("heading", { level: 1, name: enMessages.dashboard.signedOutTitle })).toBeInTheDocument()
    expect(screen.queryByText(enMessages.dashboard.generationFailedGeneric)).toBeNull()
  })

  it("sends the five contract fields — never preferred_resource_sources — and the contract mock accepts them", async () => {
    // The default handler validates like the backend (tests/msw/contract.ts):
    // extra or missing fields would come back as a 422.
    let body: Record<string, unknown> = {}
    let status = 0
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "PUT" && request.url.endsWith("/me/learning-profile")) body = await request.clone().json()
    })
    server.events.on("response:mocked", ({ request, response }) => {
      if (request.method === "PUT" && request.url.endsWith("/me/learning-profile")) status = response.status
    })
    renderOnboarding(makeStore({ signedIn: true }))
    await submit()
    await waitFor(() => expect(status).toBe(201))
    expect(Object.keys(body).sort()).toEqual([
      "available_minutes_per_week",
      "desired_outcome",
      "goal",
      "preferred_learning_methods",
      "self_assessed_level",
    ])
    expect(body).not.toHaveProperty("preferred_resource_sources")
    // The time step's 2 hours, in minutes.
    expect(body.available_minutes_per_week).toBe(120)
    expect(await screen.findByText(enMessages.onboarding.stepSixSuccessTitle)).toBeInTheDocument()
  })

  it("a 422 flags the rejected answer on its review row, with what the contract allows", async () => {
    server.use(
      http.put(`${API_BASE}/me/learning-profile`, () =>
        failure422({ available_minutes_per_week: ["must be at least 15"], "preferred_learning_methods.0": ["invalid"] })
      )
    )
    renderOnboarding(makeStore({ signedIn: true }))
    await submit()
    expect(await screen.findByText(enMessages.onboarding.reviewFieldsInvalid)).toBeInTheDocument()
    expect(screen.getByText(enMessages.onboarding.fieldError.available_minutes_per_week)).toBeInTheDocument()
    expect(screen.getByText(enMessages.onboarding.fieldError.preferred_learning_methods)).toBeInTheDocument()
    expect(screen.queryByText(enMessages.onboarding.stepSixSubmitFailed)).toBeNull()
  })

  it("root cause fix: completing onboarding requests roadmap generation, then goes to the dashboard", async () => {
    const calls = recordCalls()
    const store = makeStore({ signedIn: true })
    renderOnboarding(store)

    await submit()

    await waitFor(() => expect(store.getState().generation.requestId).toBe("gen-test-id"))
    expect(calls).toContain("POST /roadmap-generation-requests")
    // The active roadmap is checked first: one roadmap per learner.
    expect(calls.indexOf("GET /me/active-roadmap")).toBeLessThan(calls.indexOf("POST /roadmap-generation-requests"))
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"), { timeout: 4000 })
  })
})
