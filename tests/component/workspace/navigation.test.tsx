import "@testing-library/jest-dom/vitest"
import { useSyncExternalStore } from "react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { act, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import authReducer from "@/redux/slices/authSlice"
import generationReducer from "@/redux/slices/generationSlice"
import workspaceReducer from "@/redux/slices/workspaceSlice"
import onboardingReducer from "@/redux/slices/onboardingSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { clearSession } from "@/lib/api/auth"
import { SessionRestorer } from "@/shared/components/providers/SessionRestorer"
import { ThemeProvider } from "@/shared/components/providers/ThemeProvider"
import { DashboardShell } from "@/features/dashboard/components/app-shell/DashboardShell"
import { DashboardPage } from "@/features/dashboard/components/pages/dashboard-page"
import { RoadmapPage } from "@/features/dashboard/components/pages/roadmap-page"
import { TasksPage } from "@/features/dashboard/components/pages/tasks-page"
import { ResourcesPage } from "@/features/dashboard/components/pages/resources-page"
import { ProgressPage } from "@/features/dashboard/components/pages/progress-page"
import { ProfilePage } from "@/features/account/components/pages/profile-page"
import { SettingsPage } from "@/features/account/components/pages/settings-page"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

// The signed-in workspace as the app renders it: the real store shape, the
// SessionRestorer, the sidebar shell and each page — navigated client-side
// through the sidebar links, never reloaded.

const router = vi.hoisted(() => {
  let path = "/dashboard"
  const listeners = new Set<() => void>()
  return {
    get path() {
      return path
    },
    go(next: string) {
      path = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
})

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, onClick, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        event.preventDefault()
        router.go(href)
      }}
    >
      {children}
    </a>
  ),
  useRouter: () => ({ push: (href: string) => router.go(href), replace: (href: string) => router.go(href) }),
  usePathname: () => useSyncExternalStore(router.subscribe, () => router.path),
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const w = enMessages.workspace
const a = enMessages.account
const d = enMessages.dashboard
const envelope = (data: unknown, status = 200) => HttpResponse.json({ data, meta: { request_id: "t" } }, { status })
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

function wireRoadmap() {
  return {
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
          progress: { completed_tasks: 0, total_tasks: 1, percentage: 0 },
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
              resources: [{ id: "res1", title: "Pro Git", url: "https://git-scm.com/book", type: "documentation", position: 1 }],
            },
          ],
        },
      ],
    },
    created_at: "2026-09-28T08:00:00Z",
    updated_at: "2026-09-28T08:00:00Z",
  }
}

/**
 * The backend, with a counter per request. With `hasRoadmap: false` the learner
 * has none yet; generation succeeds and the backend activates the new roadmap
 * itself (what Render does for a first roadmap).
 */
function backend({ hasRoadmap = true } = {}) {
  let isActive = hasRoadmap
  const calls = { refresh: 0, active: 0, me: 0, preferences: 0, learningProfile: 0, generation: 0 }
  server.use(
    http.post("*/api/session/refresh", () => {
      calls.refresh += 1
      return envelope({ token_type: "Bearer", access_token: "acc", expires_in: 900, user: { id: "u1", name: "Nav Learner", email: "n@example.com" } })
    }),
    http.get(`${API_BASE}/me`, () => {
      calls.me += 1
      return envelope({ id: "u1", name: "Nav Learner", email: "n@example.com", status: "active", email_verified_at: null, last_login_at: null, created_at: "2026-09-01T10:00:00Z" })
    }),
    http.get(`${API_BASE}/me/preferences`, () => {
      calls.preferences += 1
      return envelope({ ui_locale: "en", resource_language: "both", updated_at: "2026-09-28T08:00:00Z" })
    }),
    http.get(`${API_BASE}/me/learning-profile`, () => {
      calls.learningProfile += 1
      return envelope({
        id: "lp1",
        goal: "Use Git every day",
        self_assessed_level: "complete_beginner",
        desired_outcome: "Ship a project with Git",
        available_minutes_per_week: 120,
        preferred_learning_methods: ["reading_docs"],
        preferred_resource_sources: ["official_documentation"],
        created_at: "2026-09-28T08:00:00Z",
        updated_at: "2026-09-28T08:00:00Z",
      })
    }),
    http.get(`${API_BASE}/me/onboarding-status`, () => envelope({ completed: true, missing_fields: [] })),
    http.get(`${API_BASE}/me/active-roadmap`, () => {
      calls.active += 1
      return isActive ? envelope(wireRoadmap()) : failure("active_roadmap_not_found", 404)
    }),
    http.post(`${API_BASE}/roadmap-generation-requests`, () => {
      calls.generation += 1
      return envelope({ id: "gen-1", status: "queued", roadmap_id: null, failure_code: null }, 202)
    }),
    http.get(`${API_BASE}/roadmap-generation-requests/:id`, () => {
      isActive = true
      return envelope({ id: "gen-1", status: "succeeded", roadmap_id: "r1", failure_code: null })
    }),
    http.get(`${API_BASE}/roadmaps/:id`, () => envelope(wireRoadmap()))
  )
  return calls
}

/** A page load: the store is still restoring the cookie session. */
function pageLoadStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      generation: generationReducer,
      workspace: workspaceReducer,
      onboarding: onboardingReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

type Store = ReturnType<typeof pageLoadStore>

function CurrentPage() {
  const path = useSyncExternalStore(router.subscribe, () => router.path)
  switch (path) {
    case "/roadmap":
      return <RoadmapPage />
    case "/tasks":
      return <TasksPage />
    case "/resources":
      return <ResourcesPage />
    case "/progress":
      return <ProgressPage />
    case "/profile":
      return <ProfilePage />
    case "/settings":
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

function renderWorkspace(store: Store, start: string, locale: "en" | "ar" = "en") {
  router.go(start)
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <IntlWrapper locale={locale} messages={locale === "en" ? enMessages : arMessages}>
          <SessionRestorer />
          <DashboardShell>
            <CurrentPage />
          </DashboardShell>
        </IntlWrapper>
      </ThemeProvider>
    </Provider>
  )
}

/** Clicks a sidebar link, as a learner would. */
function goTo(label: string, messages = enMessages) {
  const sidebar = screen.getAllByRole("navigation", { name: messages.dashboard.navLabel })[0]
  act(() => {
    // Tasks carries a count badge after its label.
    fireEvent.click(within(sidebar).getByRole("link", { name: new RegExp(`^${label}`) }))
  })
}

/** What each page must show once its data is there, never a skeleton. */
const expectations: Record<string, () => Promise<void>> = {
  [w.navOverview]: async () => {
    expect(await screen.findByRole("link", { name: w.openTask })).toBeInTheDocument()
  },
  [w.navRoadmap]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: "Learn Git" })).toBeInTheDocument()
  },
  [w.navTasks]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: w.tasksTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Read the Git book" })).toBeInTheDocument()
  },
  [w.navResources]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: w.resourcesPageTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Pro Git/ })).toBeInTheDocument()
  },
  [w.navProgress]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: w.progressPageTitle })).toBeInTheDocument()
  },
  [w.navProfile]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: a.profileTitle })).toBeInTheDocument()
    expect(await screen.findByText("Use Git every day")).toBeInTheDocument()
  },
  [w.navSettings]: async () => {
    expect(await screen.findByRole("heading", { level: 1, name: a.settingsTitle })).toBeInTheDocument()
  },
}

async function expectPage(label: string) {
  await expectations[label]()
  await waitFor(() => expect(document.querySelector("[aria-busy=true]")).toBeNull())
  expect(screen.queryByRole("heading", { name: w.noRoadmapTitle })).toBeNull()
}

// Seven pages per test; the default 1s wait is too short when the whole suite runs in parallel.
configure({ asyncUtilTimeout: 5000 })

// jsdom has no IntersectionObserver / ResizeObserver; motion and the charts need them.
beforeAll(() => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", Observer)
  vi.stubGlobal("ResizeObserver", Observer)
})

describe("workspace navigation without a reload", () => {
  beforeEach(() => clearSession())

  it("Overview → Roadmap → Tasks → Resources → Progress → Profile → Settings: every page shows its data", async () => {
    const calls = backend()
    renderWorkspace(pageLoadStore(), "/dashboard")
    await expectPage(w.navOverview)

    for (const label of [w.navRoadmap, w.navTasks, w.navResources, w.navProgress, w.navProfile, w.navSettings]) {
      goTo(label)
      await expectPage(label)
    }

    // One session restore for the page load, one active-roadmap request shared by every page.
    expect(calls.refresh).toBe(1)
    expect(calls.active).toBe(1)
    expect(calls.generation).toBe(0)
  })

  it("opening Tasks by URL first, then moving to the other pages", async () => {
    const calls = backend()
    renderWorkspace(pageLoadStore(), "/tasks")
    await expectPage(w.navTasks)

    for (const label of [w.navOverview, w.navRoadmap, w.navResources, w.navProgress, w.navProfile, w.navSettings, w.navTasks]) {
      goTo(label)
      await expectPage(label)
    }

    expect(calls.refresh).toBe(1)
    expect(calls.active).toBe(1)
    expect(calls.generation).toBe(0)
  })

  it("in Arabic too", async () => {
    const calls = backend()
    renderWorkspace(pageLoadStore(), "/dashboard", "ar")
    expect(await screen.findByRole("link", { name: arMessages.workspace.openTask })).toBeInTheDocument()
    goTo(arMessages.workspace.navTasks, arMessages as typeof enMessages)
    expect(await screen.findByRole("heading", { level: 1, name: arMessages.workspace.tasksTitle })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Read the Git book" })).toBeInTheDocument()
    expect(calls.active).toBe(1)
  })

  it("a roadmap generated on the Overview shows on every other page, not only the Overview", async () => {
    const calls = backend({ hasRoadmap: false })
    renderWorkspace(pageLoadStore(), "/dashboard")

    fireEvent.click(await screen.findByRole("button", { name: d.generateRoadmap }))
    expect(await screen.findByRole("link", { name: w.openTask }, { timeout: 5000 })).toBeInTheDocument()

    for (const label of [w.navTasks, w.navRoadmap, w.navResources, w.navProgress]) {
      goTo(label)
      await expectPage(label)
    }
    expect(calls.generation).toBe(1)
    // Before generation (the page's read and the check before the POST), then
    // once more after the backend activated the new roadmap — not per page.
    expect(calls.active).toBe(3)
  })
})

describe("session restore", () => {
  beforeEach(() => clearSession())

  it("a store that is still restoring always gets a restore, even after an earlier one (a dev hot reload)", async () => {
    const calls = backend()
    const first = renderWorkspace(pageLoadStore(), "/tasks")
    await expectPage(w.navTasks)
    first.unmount()

    // A new store starts in `restoring`; before the fix it stayed there, with
    // every page on its skeleton, until a full reload.
    renderWorkspace(pageLoadStore(), "/tasks")
    await expectPage(w.navTasks)
    expect(calls.refresh).toBe(2)
  })

  it("remounting with the same store (a language switch) does not restore again", async () => {
    const calls = backend()
    const store = pageLoadStore()
    const first = renderWorkspace(store, "/tasks")
    await expectPage(w.navTasks)
    first.unmount()
    renderWorkspace(store, "/tasks", "ar")
    expect(await screen.findByRole("heading", { level: 1, name: arMessages.workspace.tasksTitle })).toBeInTheDocument()
    expect(calls.refresh).toBe(1)
  })
})
