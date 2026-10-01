import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { Provider, useSelector } from "react-redux"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import { makeTestStore } from "@tests/helpers/store"
import { clearSession, getSession } from "@/lib/api/auth"
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
/** What the platform answers when the function times out: not JSON. */
const gatewayTimeout = () => new HttpResponse("An error occurred with your deployment", { status: 504 })

function Screen() {
  const auth = useSelector((state: RootState) => state.auth)
  if (auth.restoring) return <p>loading</p>
  if (auth.isAuthenticated) return <p>signed in as {auth.user?.name}</p>
  return <SignedOutState />
}

function renderApp() {
  const store = makeTestStore()
  render(
    <Provider store={store}>
      <IntlWrapper locale="en" messages={enMessages}>
        <SessionRestorer />
        <Screen />
      </IntlWrapper>
    </Provider>
  )
  return store
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
