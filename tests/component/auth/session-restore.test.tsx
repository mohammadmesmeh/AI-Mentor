import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { Provider, useSelector } from "react-redux"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import { makeTestStore } from "@tests/helpers/store"
import { clearSession, getSession, parseRetryAfter, restoreSession, setSession } from "@/lib/api/auth"
import { apiSlice } from "@/lib/api/apiSlice"
import type { RootState } from "@/redux/store"
import { SessionRestorer } from "@/shared/components/providers/SessionRestorer"
import { SignedOutState } from "@/features/dashboard/components/learning/shared"
import enMessages from "../../../messages/en.json"

// A reload after the backend has been idle: the refresh waits for it to wake
// up (Render cold start) or fails for a moment. Only a credential failure may
// sign the learner out; anything temporary is retried, then offers a retry.

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}))

const d = enMessages.dashboard
const USER = { id: "u1", name: "Learner", email: "l@example.com", status: "active" }

const session = () =>
  HttpResponse.json({
    data: { token_type: "Bearer", access_token: "restored", expires_in: 900, user: USER },
    meta: { request_id: "t" },
  })
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })
const rateLimited = (retryAfter?: string) =>
  HttpResponse.json(
    { error: { code: "rate_limited", message: "Too many requests" }, meta: { request_id: "t" } },
    { status: 429, headers: retryAfter ? { "Retry-After": retryAfter } : {} }
  )
/** What the platform answers when the function times out: not JSON. */
const gatewayTimeout = () => new HttpResponse("An error occurred with your deployment", { status: 504 })

function Screen() {
  const auth = useSelector((state: RootState) => state.auth)
  if (auth.restoring) return <p>loading</p>
  if (auth.isAuthenticated) return <p>signed in as {auth.user?.name}</p>
  return <SignedOutState />
}

function renderApp(store = makeTestStore()) {
  const view = render(
    <Provider store={store}>
      <IntlWrapper locale="en" messages={enMessages}>
        <SessionRestorer />
        <Screen />
      </IntlWrapper>
    </Provider>
  )
  return { store, ...view }
}

/** Answers each refresh with the next response in the list (the last one repeats). */
function refreshSequence(...responses: Array<() => Response>) {
  let calls = 0
  server.use(
    http.post("*/api/session/refresh", () => {
      const respond = responses[Math.min(calls, responses.length - 1)]
      calls += 1
      return respond()
    })
  )
  return () => calls
}

describe("session restore on reload", () => {
  beforeEach(() => {
    clearSession()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => vi.useRealTimers())

  it("a temporary failure (backend waking up) is retried and the learner stays signed in", async () => {
    const calls = refreshSequence(() => failure("authentication_service_unavailable", 503), session)
    renderApp()

    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
    expect(screen.queryByText(d.signedOutTitle)).toBeNull()
    expect(calls()).toBe(2)
    expect(getSession()?.accessToken).toBe("restored")
  })

  it("a platform timeout that keeps failing offers a retry, never sign-in, and the retry restores", async () => {
    let backendUp = false
    const calls = refreshSequence(() => (backendUp ? session() : gatewayTimeout()))
    renderApp()

    await act(() => vi.advanceTimersByTimeAsync(2000 + 5000))

    expect(await screen.findByRole("heading", { name: d.sessionUnavailableTitle })).toBeInTheDocument()
    expect(screen.queryByText(d.signedOutTitle)).toBeNull()
    expect(screen.queryByRole("link", { name: d.signInAgain })).toBeNull()
    expect(calls()).toBe(3)

    backendUp = true
    fireEvent.click(screen.getByRole("button", { name: d.sessionUnavailableRetry }))

    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
  })

  it("an invalid or revoked token (401) signs out at once, without retrying", async () => {
    const calls = refreshSequence(() => failure("unauthenticated", 401))
    renderApp()

    expect(await screen.findByRole("heading", { name: d.signedOutTitle })).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(calls()).toBe(1)
  })
})

describe("rate-limited refresh (429)", () => {
  beforeEach(() => {
    clearSession()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => vi.useRealTimers())

  it("waits for Retry-After while showing loading, then retries once and stays signed in", async () => {
    const calls = refreshSequence(() => rateLimited("7"), session)
    renderApp()

    await act(() => vi.advanceTimersByTimeAsync(6000))
    // Still waiting: loading, not sign-in, and no early retry.
    expect(screen.getByText("loading")).toBeInTheDocument()
    expect(screen.queryByText(d.signedOutTitle)).toBeNull()
    expect(calls()).toBe(1)

    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
    expect(calls()).toBe(2)
  })

  it("a second 429 doesn't sign out and doesn't loop: one retry, then the retry screen", async () => {
    const calls = refreshSequence(() => rateLimited("3"))
    renderApp()

    await act(() => vi.advanceTimersByTimeAsync(4000))
    expect(await screen.findByRole("heading", { name: d.sessionUnavailableTitle })).toBeInTheDocument()
    expect(screen.queryByText(d.signedOutTitle)).toBeNull()

    await act(() => vi.advanceTimersByTimeAsync(120_000))
    expect(calls()).toBe(2)
  })

  it("without Retry-After it waits the default, never retrying immediately", async () => {
    const calls = refreshSequence(() => rateLimited(), session)
    renderApp()
    await act(() => vi.advanceTimersByTimeAsync(9000))
    expect(calls()).toBe(1)
    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
    expect(calls()).toBe(2)
  })

  it("a 429 while refreshing an expired access token keeps the existing token and the session", async () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
    refreshSequence(() => rateLimited("30"))
    server.use(http.get(`${API_BASE}/me`, () => failure("unauthenticated", 401)))
    const { store } = renderApp(makeTestStore())
    // Simulate a signed-in learner whose access token just expired.
    setSession({ tokenType: "Bearer", accessToken: "still-mine", expiresAt: Date.now() - 1 })
    act(() => {
      store.dispatch({ type: "auth/sessionEstablished", payload: USER })
    })
    await act(async () => {
      await store.dispatch(apiSlice.endpoints.getMe.initiate(undefined, { subscribe: false }))
    })
    expect(getSession()?.accessToken).toBe("still-mine")
    expect(store.getState().auth.isAuthenticated).toBe(true)
  })
})

describe("restore runs once per page load", () => {
  beforeEach(() => clearSession())

  it("remounting (navigation, a language switch) with the same store doesn't refresh again", async () => {
    const calls = refreshSequence(session)
    const { store, unmount } = renderApp()
    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
    unmount()
    renderApp(store).unmount()
    renderApp(store)
    expect(await screen.findByText("signed in as Learner")).toBeInTheDocument()
    expect(calls()).toBe(1)
  })

  it("concurrent restores share one request", async () => {
    let calls = 0
    server.use(
      http.post("*/api/session/refresh", async () => {
        calls += 1
        await new Promise((r) => setTimeout(r, 20))
        return session()
      })
    )
    const results = await Promise.all([restoreSession(), restoreSession(), restoreSession()])
    expect(results.every((r) => r.ok)).toBe(true)
    expect(calls).toBe(1)
  })
})

describe("parseRetryAfter", () => {
  it("reads seconds and HTTP dates, clamps, and falls back to a default", () => {
    expect(parseRetryAfter("7")).toBe(7000)
    expect(parseRetryAfter("0")).toBe(1000)
    expect(parseRetryAfter("3600")).toBe(60_000)
    expect(parseRetryAfter(new Date(1_000_000 + 12_000).toUTCString(), 1_000_000)).toBe(12_000)
    expect(parseRetryAfter(null)).toBe(10_000)
    expect(parseRetryAfter("soon")).toBe(10_000)
  })
})
