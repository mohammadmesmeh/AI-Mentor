import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import { makeTestStore } from "@tests/helpers/store"
import { clearSession, getSession } from "@/lib/api/auth"
import { ThemeProvider } from "@/shared/components/providers/ThemeProvider"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { RegisterForm } from "@/features/auth/components/RegisterForm"
import { resetGoogleIdentityForTests, type GoogleCredentialResponse } from "@/features/auth/lib/googleIdentity"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

// Contract §7, POST /auth/google: Google Identity Services hands back an ID
// token through its own button; the frontend exchanges it once for the standard
// auth response (same session handling as login) and never keeps it.

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/auth",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const CLIENT_ID = "1234567890-test.apps.googleusercontent.com"
const ID_TOKEN = "google-id-token-header.payload.signature"
const a = enMessages.auth

/** A stand-in for Google's script: records the setup and lets a test "click" the button. */
function fakeGoogle() {
  const calls = { initialize: [] as Record<string, unknown>[], render: [] as Record<string, unknown>[] }
  let callback: ((response: GoogleCredentialResponse) => void) | undefined
  window.google = {
    accounts: {
      id: {
        initialize: (config) => {
          calls.initialize.push(config)
          callback = config.callback
        },
        renderButton: (parent, options) => {
          calls.render.push(options as unknown as Record<string, unknown>)
          const button = document.createElement("div")
          button.setAttribute("role", "button")
          button.textContent = "Google button"
          parent.appendChild(button)
        },
      },
    },
  }
  return { calls, signIn: (credential = ID_TOKEN) => act(() => callback?.({ credential })) }
}

function authResponse() {
  return HttpResponse.json({
    data: {
      token_type: "Bearer",
      access_token: "access-from-google",
      expires_in: 900,
      refresh_token: "refresh-from-google-000000000001",
      refresh_expires_in: 2592000,
      user: { id: "u1", name: "Google Learner", email: "g@gmail.com", status: "active" },
    },
    meta: { request_id: "t" },
  })
}

const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

function renderForm(form: "login" | "register", locale: "en" | "ar" = "en") {
  const store = makeTestStore()
  render(
    <Provider store={store}>
      <ThemeProvider>
        <IntlWrapper locale={locale} messages={locale === "en" ? enMessages : arMessages}>
          {form === "login" ? <LoginForm /> : <RegisterForm />}
        </IntlWrapper>
      </ThemeProvider>
    </Provider>
  )
  return store
}

beforeEach(() => {
  clearSession()
  resetGoogleIdentityForTests()
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", CLIENT_ID)
})

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.google
})

describe("Continue with Google", () => {
  it.each(["login", "register"] as const)("%s: renders Google's button with our Client ID, in the page language", async (form) => {
    const google = fakeGoogle()
    renderForm(form, "ar")
    expect(await screen.findByRole("button", { name: "Google button" })).toBeInTheDocument()
    expect(google.calls.initialize[0]).toMatchObject({ client_id: CLIENT_ID, ux_mode: "popup", auto_select: false })
    expect(google.calls.render[0]).toMatchObject({ text: "continue_with", shape: "pill", locale: "ar", theme: "outline" })
    expect(screen.getByText(arMessages.auth.orContinueWith)).toBeInTheDocument()
  })

  it.each(["login", "register"] as const)(
    "%s: exchanges the ID token once and signs in — token in memory, refresh token to the cookie, nothing in storage",
    async (form) => {
      const sent: unknown[] = []
      let stored = 0
      server.use(
        http.post(`${API_BASE}/auth/google`, async ({ request }) => {
          sent.push(await request.json())
          return authResponse()
        }),
        http.post("*/api/session/store", () => {
          stored += 1
          return new HttpResponse(null, { status: 204 })
        })
      )
      const google = fakeGoogle()
      const store = renderForm(form)
      await screen.findByRole("button", { name: "Google button" })

      await google.signIn()

      await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true))
      expect(sent).toEqual([{ id_token: ID_TOKEN }])
      expect(stored).toBe(1)
      expect(getSession()?.accessToken).toBe("access-from-google")
      expect(store.getState().auth.user?.name).toBe("Google Learner")
      // The Google credential is never kept anywhere.
      expect(JSON.stringify(store.getState())).not.toContain(ID_TOKEN)
      expect(JSON.stringify({ ...localStorage })).not.toContain(ID_TOKEN)
      expect(JSON.stringify({ ...sessionStorage })).not.toContain(ID_TOKEN)
    }
  )

  it.each([
    ["invalid_google_token", 401, a.errors.googleFailed],
    ["google_account_conflict", 409, a.errors.googleAccountConflict],
    ["google_authentication_unavailable", 503, a.errors.googleServiceUnavailable],
    ["too_many_requests", 429, a.errors.tooManyRequests],
  ])("a %s (%i) shows its own message and stays signed out", async (code, status, message) => {
    server.use(http.post(`${API_BASE}/auth/google`, () => failure(code, status)))
    const google = fakeGoogle()
    const store = renderForm("login")
    await screen.findByRole("button", { name: "Google button" })

    await google.signIn()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(store.getState().auth.isAuthenticated).toBe(false)
    expect(getSession()).toBeNull()
  })

  it("without a Client ID the button says Google sign-in isn't available and loads nothing", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "")
    renderForm("register")
    const button = screen.getByRole("button", { name: a.signInWithGoogle })
    expect(button).toHaveAttribute("aria-disabled", "true")
    // No error before the learner tries it.
    expect(screen.queryByText(a.googleUnavailable)).toBeNull()
    fireEvent.click(button)
    expect(screen.getByText(a.googleUnavailable)).toBeInTheDocument()
    expect(document.querySelector('script[src*="accounts.google.com"]')).toBeNull()
  })
})
