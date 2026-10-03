import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { Provider } from "react-redux"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { deriveSources, errorBody, validateLearningProfilePut } from "@tests/msw/contract"
import { IntlWrapper } from "@tests/helpers/intl"
import { signedInStore, signedOutStore, type TestStore } from "@tests/helpers/store"
import { clearSession } from "@/lib/api/auth"
import { ThemeProvider } from "@/shared/components/providers/ThemeProvider"
import { ProfilePage } from "@/features/account/components/pages/profile-page"
import { SettingsPage } from "@/features/account/components/pages/settings-page"
import enMessages from "../../../messages/en.json"

const replace = vi.fn()
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/settings",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const a = enMessages.account
const o = enMessages.onboarding
const envelope = (data: unknown, status = 200) => HttpResponse.json({ data, meta: { request_id: "t" } }, { status })

const PROFILE = {
  id: "lp1",
  goal: "Learn Git",
  self_assessed_level: "complete_beginner",
  desired_outcome: "Use Git daily",
  available_minutes_per_week: 120,
  preferred_learning_methods: ["reading_docs", "quizzes_drills"],
  // Derived by the server from the methods (§12).
  preferred_resource_sources: ["official_documentation"],
  created_at: "2026-09-28T08:00:00Z",
  updated_at: "2026-09-28T08:00:00Z",
}

function backend() {
  const calls = {
    puts: [] as unknown[],
    patches: [] as unknown[],
    generation: 0,
  }
  server.use(
    http.get(`${API_BASE}/me`, () =>
      envelope({ id: "u1", name: "Mohammad", email: "m@example.com", status: "active", email_verified_at: null, last_login_at: null, created_at: "2026-09-01T10:00:00Z" })
    ),
    http.get(`${API_BASE}/me/learning-profile`, () => envelope(PROFILE)),
    http.put(`${API_BASE}/me/learning-profile`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      calls.puts.push(body)
      // Validated like the backend: a body Render would reject is a 422 here.
      const details = validateLearningProfilePut(body)
      if (details) return HttpResponse.json(errorBody("validation_failed", "x", details), { status: 422 })
      return envelope({
        ...PROFILE,
        ...body,
        preferred_resource_sources: deriveSources(body.preferred_learning_methods as string[]),
      })
    }),
    http.get(`${API_BASE}/me/preferences`, () =>
      envelope({ ui_locale: "en", resource_language: "both", updated_at: "2026-09-28T08:00:00Z" })
    ),
    http.patch(`${API_BASE}/me/preferences`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      calls.patches.push(body)
      return envelope({ ui_locale: "en", resource_language: "both", updated_at: "x", ...body })
    }),
    http.post(`${API_BASE}/roadmap-generation-requests`, () => {
      calls.generation += 1
      return envelope({ id: "g" }, 202)
    })
  )
  return calls
}

function renderPage(store: TestStore, ui: React.ReactNode) {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <IntlWrapper locale="en" messages={enMessages}>
          {ui}
        </IntlWrapper>
      </ThemeProvider>
    </Provider>
  )
}

describe("Profile", () => {
  beforeEach(() => {
    clearSession()
    replace.mockClear()
  })

  it("shows the account (read-only) and the learning profile from the contract", async () => {
    backend()
    renderPage(signedInStore(), <ProfilePage />)
    expect(await screen.findByRole("heading", { level: 1, name: a.profileTitle })).toBeInTheDocument()
    expect(screen.getByText("Mohammad")).toBeInTheDocument()
    expect(screen.getByText("m@example.com")).toBeInTheDocument()
    expect(screen.getByText(a.accountReadOnly)).toBeInTheDocument()
    expect(screen.getByText("Learn Git")).toBeInTheDocument()
    expect(screen.getByText(o.beginner)).toBeInTheDocument()
    expect(screen.getByText("2 hours per week")).toBeInTheDocument()
    expect(screen.getByText(`${o.reading} and ${o.quizzes}`)).toBeInTheDocument()
    expect(screen.getByText(o.prefBoth)).toBeInTheDocument()
    // No controls for what the contract can't change.
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("offers only the learning methods: sources are derived by the server, not a second choice", async () => {
    backend()
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))
    const boxes = screen.getAllByRole("checkbox")
    expect(boxes.map((box) => box.closest("label")?.textContent)).toEqual([o.handsOn, o.reading, o.video, o.quizzes])
  })

  it("edits the learning profile with one PUT of the five fields (no sources), and never generates a roadmap", async () => {
    const calls = backend()
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))

    fireEvent.change(screen.getByLabelText(a.goal), { target: { value: "Learn Git branching" } })
    // The stored 120 minutes opens as the "2 hours" preset.
    expect(screen.getByRole("radio", { name: "2 hours" })).toBeChecked()
    // "Other" in hours (the default unit): 4 hours go out as 240 minutes.
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(o.timeOther) }))
    fireEvent.change(screen.getByLabelText(o.customTimeLabel), { target: { value: "4" } })
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(o.intermediate) }))
    fireEvent.click(screen.getByRole("button", { name: a.save }))

    expect(await screen.findByText(a.saved)).toBeInTheDocument()
    expect(calls.puts).toEqual([
      {
        goal: "Learn Git branching",
        self_assessed_level: "intermediate",
        desired_outcome: "Use Git daily",
        available_minutes_per_week: 240,
        preferred_learning_methods: ["reading_docs", "quizzes_drills"],
      },
    ])
    expect(calls.puts[0]).not.toHaveProperty("preferred_resource_sources")
    expect(calls.generation).toBe(0)
  })

  it("validates like the contract before sending anything", async () => {
    const calls = backend()
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))
    fireEvent.click(screen.getByRole("radio", { name: new RegExp(o.timeOther) }))
    // 0.1 hours = 6 minutes, under the contract's 15.
    fireEvent.change(screen.getByLabelText(o.customTimeLabel), { target: { value: "0.1" } })
    for (const box of screen.getAllByRole("checkbox")) if ((box as HTMLInputElement).checked) fireEvent.click(box)
    fireEvent.click(screen.getByRole("button", { name: a.save }))

    expect(await screen.findByText(o.timeErrorTooLow)).toBeInTheDocument()
    expect(screen.getByText(a.methodsRequired)).toBeInTheDocument()
    expect(screen.getByLabelText(o.customTimeLabel)).toHaveAttribute("aria-invalid", "true")
    expect(calls.puts).toHaveLength(0)
  })

  it("a stored time that isn't a preset opens as Other in the clearest unit", async () => {
    const calls = backend()
    server.use(http.get(`${API_BASE}/me/learning-profile`, () => envelope({ ...PROFILE, available_minutes_per_week: 90 })))
    renderPage(signedInStore(), <ProfilePage />)
    expect(await screen.findByText("1.5 hours per week")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: a.edit }))
    expect(screen.getByRole("radio", { name: new RegExp(o.timeOther) })).toBeChecked()
    expect(screen.getByLabelText(o.customTimeLabel)).toHaveValue("1.5")
    fireEvent.click(screen.getByRole("button", { name: a.save }))
    await waitFor(() => expect(calls.puts).toHaveLength(1))
    expect((calls.puts[0] as { available_minutes_per_week: number }).available_minutes_per_week).toBe(90)
  })

  it("a legacy profile without methods must pick one before saving; the PUT never carries sources", async () => {
    const calls = backend()
    server.use(
      http.get(`${API_BASE}/me/learning-profile`, () =>
        envelope({ ...PROFILE, preferred_learning_methods: null, preferred_resource_sources: null })
      )
    )
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))
    fireEvent.click(screen.getByRole("button", { name: a.save }))
    expect(await screen.findByText(a.methodsRequired)).toBeInTheDocument()
    expect(calls.puts).toHaveLength(0)

    fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(o.video) }))
    fireEvent.click(screen.getByRole("button", { name: a.save }))
    await waitFor(() => expect(calls.puts).toHaveLength(1))
    expect(calls.puts[0]).toMatchObject({ preferred_learning_methods: ["video_walkthroughs"] })
    expect(calls.puts[0]).not.toHaveProperty("preferred_resource_sources")
  })

  it("a 422 on an array item (preferred_learning_methods.0) shows the methods error next to that field", async () => {
    backend()
    server.use(
      http.put(`${API_BASE}/me/learning-profile`, () =>
        HttpResponse.json(
          {
            error: {
              code: "validation_failed",
              message: "The selected preferred_learning_methods.0 is invalid.",
              details: { "preferred_learning_methods.0": ["The selected preferred_learning_methods.0 is invalid."] },
            },
            meta: { request_id: "t" },
          },
          { status: 422 }
        )
      )
    )
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))
    fireEvent.click(screen.getByRole("button", { name: a.save }))
    expect(await screen.findByText(o.fieldError.preferred_learning_methods)).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(a.saveFailed)
    // The server's English message is never shown.
    expect(screen.queryByText(/is invalid/)).toBeNull()
  })

  it("a 422 marks the rejected field and shows a failure message", async () => {
    backend()
    server.use(
      http.put(`${API_BASE}/me/learning-profile`, () =>
        HttpResponse.json(
          { error: { code: "validation_failed", message: "x", details: { goal: ["too long"] } }, meta: { request_id: "t" } },
          { status: 422 }
        )
      )
    )
    renderPage(signedInStore(), <ProfilePage />)
    fireEvent.click(await screen.findByRole("button", { name: a.edit }))
    fireEvent.click(screen.getByRole("button", { name: a.save }))
    expect(await screen.findByRole("alert")).toHaveTextContent(a.saveFailed)
    expect(screen.getByLabelText(a.goal)).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText(o.fieldError.goal)).toBeInTheDocument()
  })

  it("signed out: asks for sign-in", async () => {
    backend()
    renderPage(signedOutStore(), <ProfilePage />)
    expect(await screen.findByRole("heading", { level: 1, name: enMessages.dashboard.signedOutTitle })).toBeInTheDocument()
  })
})

describe("Settings", () => {
  beforeEach(() => {
    clearSession()
    replace.mockClear()
  })

  it("resource language saves only that field with PATCH and says so", async () => {
    const calls = backend()
    renderPage(signedInStore(), <SettingsPage />)
    const tabs = await screen.findByRole("tablist", { name: a.resourceLanguage })
    fireEvent.click(within(tabs).getByRole("tab", { name: o.prefArabic }))

    await waitFor(() => expect(calls.patches).toEqual([{ resource_language: "ar" }]))
    expect(await screen.findByText(a.savedShort)).toBeInTheDocument()
    expect(calls.generation).toBe(0)
  })

  it("interface language switches the route locale and saves ui_locale — no generation", async () => {
    const calls = backend()
    renderPage(signedInStore(), <SettingsPage />)
    const tabs = await screen.findByRole("tablist", { name: a.interfaceLanguage })
    fireEvent.click(within(tabs).getByRole("tab", { name: "العربية" }))

    expect(replace).toHaveBeenCalledWith("/settings", { locale: "ar" })
    await waitFor(() => expect(calls.patches).toEqual([{ ui_locale: "ar" }]))
    expect(calls.generation).toBe(0)
  })

  it("has no time zone control: it is no longer a learner setting (§11)", async () => {
    backend()
    renderPage(signedInStore(), <SettingsPage />)
    expect(await screen.findByRole("tablist", { name: a.resourceLanguage })).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.queryByText(/time ?zone/i)).toBeNull()
  })

  it("theme is a local choice", async () => {
    backend()
    renderPage(signedInStore(), <SettingsPage />)
    const tabs = await screen.findByRole("tablist", { name: a.theme })
    fireEvent.click(within(tabs).getByRole("tab", { name: a.themeDark }))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    fireEvent.click(within(tabs).getByRole("tab", { name: a.themeLight }))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("offers only what the contract supports: no password change, no account deletion", async () => {
    backend()
    renderPage(signedInStore(), <SettingsPage />)
    await screen.findByRole("heading", { level: 1, name: a.settingsTitle })
    expect(screen.queryByText(/password/i)).toBeNull()
    expect(screen.queryByText(/delete/i)).toBeNull()
    expect(screen.getByRole("button", { name: enMessages.nav.logout })).toBeInTheDocument()
  })
})
