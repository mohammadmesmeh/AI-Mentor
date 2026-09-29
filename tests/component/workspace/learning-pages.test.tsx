import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { Provider } from "react-redux"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { IntlWrapper } from "@tests/helpers/intl"
import { signedInStore, signedOutStore, type TestStore } from "@tests/helpers/store"
import { clearSession } from "@/lib/api/auth"
import { RoadmapPage } from "@/features/dashboard/components/pages/roadmap-page"
import { TasksPage } from "@/features/dashboard/components/pages/tasks-page"
import { ResourcesPage } from "@/features/dashboard/components/pages/resources-page"
import { TaskDetailPage } from "@/features/dashboard/components/pages/task-detail-page"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/roadmap",
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const w = enMessages.workspace
const d = enMessages.dashboard
const envelope = (data: unknown, status = 200) => HttpResponse.json({ data, meta: { request_id: "t" } }, { status })
const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

const task = (id: string, position: number, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: "read",
  title: `Task ${id}`,
  instructions: "",
  position,
  status,
  is_required: true,
  estimated_minutes: 20,
  depends_on_task_ids: [],
  resources: [],
  ...extra,
})

const ROADMAP = {
  id: "r1",
  goal: "Learn Git",
  status: "active",
  activated_at: "2026-09-28T08:00:00Z",
  completed_at: null,
  progress: { completed_tasks: 1, total_tasks: 4, percentage: 25 },
  current_version: {
    id: "v1",
    version_number: 1,
    source: "generated",
    status: "current",
    stages: [
      {
        id: "s1",
        title: "Basics",
        description: "Start here",
        position: 1,
        status: "active",
        estimated_minutes: 60,
        progress: { completed_tasks: 1, total_tasks: 3, percentage: 33 },
        tasks: [
          task("t1", 1, "completed"),
          task("t2", 2, "available", {
            resources: [
              { id: "res-doc", title: "Git docs", url: "https://git-scm.com/doc", type: "documentation", position: 1 },
              { id: "res-art", title: "Git article", url: "https://example.com/git", type: "article", position: 2 },
            ],
          }),
          task("t3", 3, "upcoming", { depends_on_task_ids: ["t2"] }),
        ],
      },
      {
        id: "s2",
        title: "Remotes",
        description: "",
        position: 2,
        status: "upcoming",
        estimated_minutes: 30,
        progress: { completed_tasks: 0, total_tasks: 1, percentage: 0 },
        tasks: [task("t4", 1, "upcoming", { resources: [{ id: "res-bad", title: "Bad link", url: "javascript:alert(1)", type: "course", position: 1 }] })],
      },
    ],
  },
  created_at: "2026-09-28T08:00:00Z",
  updated_at: "2026-09-28T08:00:00Z",
}

function backend() {
  const calls = { active: 0, complete: 0, generation: 0 }
  server.use(
    http.get(`${API_BASE}/me/onboarding-status`, () => envelope({ completed: true, missing_fields: [] })),
    http.get(`${API_BASE}/me/active-roadmap`, () => {
      calls.active += 1
      return envelope(ROADMAP)
    }),
    http.post(`${API_BASE}/roadmap-generation-requests`, () => {
      calls.generation += 1
      return envelope({ id: "g" }, 202)
    })
  )
  return calls
}

function renderPage(store: TestStore, ui: React.ReactNode, locale: "en" | "ar" = "en") {
  return render(
    <Provider store={store}>
      <IntlWrapper locale={locale} messages={locale === "en" ? enMessages : arMessages}>
        {ui}
      </IntlWrapper>
    </Provider>
  )
}

describe("learning pages", () => {
  beforeEach(() => clearSession())

  describe("Roadmap", () => {
    it("shows the goal as the only h1, stages as h2 with progress, and each task linking to its page", async () => {
      backend()
      const { container } = renderPage(signedInStore(), <RoadmapPage />)

      expect(await screen.findByRole("heading", { level: 1, name: "Learn Git" })).toBeInTheDocument()
      expect(container.querySelectorAll("h1")).toHaveLength(1)
      expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(
        expect.arrayContaining(["Basics", "Remotes"])
      )
      expect(screen.getByText("1 of 4 required tasks completed")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Task t2" })).toHaveAttribute("href", "/tasks/t2")
      // The next task is marked "Up next"; the dependent task is locked.
      const row = (name: string) => screen.getByRole("link", { name }).closest("li") as HTMLElement
      expect(within(row("Task t2")).getByText(w.status.current)).toBeInTheDocument()
      expect(within(row("Task t3")).getByText(w.status.locked)).toBeInTheDocument()
      // Only the eligible task offers Mark complete.
      expect(screen.getAllByRole("button", { name: d.taskComplete })).toHaveLength(1)
    })

    it("Mark complete sends one request, shows the pending state, and announces the result", async () => {
      const calls = backend()
      let release!: () => void
      server.use(
        http.post(`${API_BASE}/tasks/:id/complete`, async () => {
          calls.complete += 1
          await new Promise<void>((resolve) => (release = resolve))
          return envelope(ROADMAP)
        })
      )
      renderPage(signedInStore(), <RoadmapPage />)
      const button = await screen.findByRole("button", { name: d.taskComplete })

      fireEvent.click(button)
      fireEvent.click(button) // double click
      expect(await screen.findByRole("button", { name: d.taskCompleting })).toBeDisabled()
      await waitFor(() => expect(calls.complete).toBe(1))
      release()
      expect(await screen.findByText(d.taskCompletedAnnouncement)).toBeInTheDocument()
      expect(calls.complete).toBe(1)
    })
  })

  describe("Tasks", () => {
    it("filters by status and offers a way back from an empty filter", async () => {
      backend()
      renderPage(signedInStore(), <TasksPage />)
      const tabs = await screen.findByRole("tablist", { name: w.filterLabel })
      const chip = (label: string) => within(tabs).getByRole("tab", { name: new RegExp(`^${label}`) })

      // One header row + one row per task.
      expect(within(screen.getByRole("table", { name: w.tasksTitle })).getAllByRole("row")).toHaveLength(5)
      fireEvent.click(chip(w.filter.completed))
      expect(chip(w.filter.completed)).toHaveAttribute("aria-selected", "true")
      expect(screen.getByRole("link", { name: "Task t1" })).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Task t2" })).toBeNull()

      fireEvent.click(chip(w.filter.locked))
      expect(screen.getByRole("link", { name: "Task t3" })).toBeInTheDocument()

      fireEvent.click(chip(w.filter.upcoming))
      expect(screen.getByRole("link", { name: "Task t4" })).toBeInTheDocument()
      expect(screen.getByText("Stage 2 · Remotes")).toBeInTheDocument()
    })

    it("moving between pages reuses the cached roadmap — no refetch, never a generation request", async () => {
      const calls = backend()
      const store = signedInStore()
      const first = renderPage(store, <RoadmapPage />)
      await screen.findByRole("heading", { level: 1, name: "Learn Git" })
      first.unmount()
      const second = renderPage(store, <TasksPage />)
      await screen.findByRole("heading", { level: 1, name: w.tasksTitle })
      second.unmount()
      renderPage(store, <ResourcesPage />)
      await screen.findByRole("heading", { level: 1, name: w.resourcesPageTitle })
      expect(calls.active).toBe(1)
      expect(calls.generation).toBe(0)
    })
  })

  describe("Resources", () => {
    it("lists every resource with its task, filters by the contract's types, and says honestly when a type has none", async () => {
      backend()
      renderPage(signedInStore(), <ResourcesPage />)
      const tabs = await screen.findByRole("tablist", { name: w.resourceFilterLabel })
      const chip = (label: string) => within(tabs).getByRole("tab", { name: new RegExp(`^${label}`) })

      const doc = screen.getByRole("link", { name: /Git docs/ })
      expect(doc).toHaveAttribute("href", "https://git-scm.com/doc")
      expect(doc).toHaveAttribute("target", "_blank")
      expect(doc).toHaveAttribute("rel", "noopener noreferrer")
      // An unsafe URL is never a link.
      expect(screen.queryByRole("link", { name: /Bad link/ })).toBeNull()
      expect(screen.getByText("Bad link")).toBeInTheDocument()
      expect(screen.getAllByRole("link", { name: "Task: Task t2" })[0]).toHaveAttribute("href", "/tasks/t2")

      fireEvent.click(chip(w.resourceType.article))
      expect(screen.getByRole("link", { name: /Git article/ })).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: /Git docs/ })).toBeNull()

      fireEvent.click(chip(w.resourceType.video))
      expect(screen.getByRole("heading", { name: w.resourcesEmptyTitle })).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: w.showAllResources }))
      expect(screen.getByRole("link", { name: /Git docs/ })).toBeInTheDocument()
    })
  })

  describe("Task detail", () => {
    const DETAIL = {
      ...task("t2", 2, "available"),
      instructions: "Read chapter 2.\nThen try the commands.",
      completed_at: null,
      can_complete: true,
      depends_on_task_ids: ["t1"],
      dependencies: [{ id: "t1", title: "Task t1", status: "completed" }],
      resources: [{ id: "res-doc", title: "Git docs", url: "https://git-scm.com/doc", type: "documentation", position: 1 }],
      stage: { id: "s1", title: "Basics", position: 1, status: "active", progress: { completed_tasks: 1, total_tasks: 3, percentage: 33 } },
      roadmap: { id: "r1", goal: "Learn Git", status: "active", active: true, progress: { completed_tasks: 1, total_tasks: 4, percentage: 25 } },
    }

    it("shows the task from GET /tasks/{id} with instructions, resources, stage, dependencies and Mark complete", async () => {
      let detail: Record<string, unknown> = DETAIL
      server.use(
        http.get(`${API_BASE}/tasks/:id`, () => envelope(detail)),
        http.post(`${API_BASE}/tasks/:id/complete`, () => {
          detail = { ...DETAIL, status: "completed", can_complete: false, completed_at: "2026-09-28T10:00:00Z" }
          return envelope(ROADMAP)
        })
      )
      renderPage(signedInStore(), <TaskDetailPage taskId="t2" />)

      expect(await screen.findByRole("heading", { level: 1, name: "Task t2" })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: w.backToTasks })).toHaveAttribute("href", "/tasks")
      expect(screen.getByText(/Read chapter 2\./)).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /Git docs/ })).toHaveAttribute("target", "_blank")
      expect(screen.getByText("Basics")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Task t1" })).toHaveAttribute("href", "/tasks/t1")

      fireEvent.click(screen.getByRole("button", { name: d.taskComplete }))
      expect(await screen.findByRole("heading", { name: w.taskDoneTitle })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: d.taskComplete })).toBeNull()
    })

    it("a locked task explains why instead of offering the action", async () => {
      server.use(
        http.get(`${API_BASE}/tasks/:id`, () =>
          envelope({ ...DETAIL, status: "upcoming", can_complete: false, dependencies: [{ id: "t1", title: "Task t1", status: "available" }] })
        )
      )
      renderPage(signedInStore(), <TaskDetailPage taskId="t2" />)
      expect(await screen.findByText(d.taskCompleteLocked)).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: d.taskComplete })).toBeNull()
      expect(screen.getAllByText(w.status.locked).length).toBeGreaterThan(0)
    })

    it("404 task_not_found is an honest not-found page with a way back", async () => {
      server.use(http.get(`${API_BASE}/tasks/:id`, () => failure("task_not_found", 404)))
      renderPage(signedInStore(), <TaskDetailPage taskId="nope" />)
      expect(await screen.findByRole("heading", { level: 1, name: w.taskNotFoundTitle })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: w.backToTasks })).toHaveAttribute("href", "/tasks")
    })

    it("renders in Arabic", async () => {
      server.use(http.get(`${API_BASE}/tasks/:id`, () => envelope(DETAIL)))
      renderPage(signedInStore(), <TaskDetailPage taskId="t2" />, "ar")
      expect(await screen.findByRole("link", { name: arMessages.workspace.backToTasks })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: arMessages.dashboard.taskComplete })).toBeInTheDocument()
    })
  })

  describe("states", () => {
    it("signed out: asks for sign-in and sends nothing", async () => {
      const calls = backend()
      renderPage(signedOutStore(), <TasksPage />)
      expect(await screen.findByRole("heading", { level: 1, name: d.signedOutTitle })).toBeInTheDocument()
      expect(calls.active).toBe(0)
    })

    it("no roadmap: points to the overview instead of generating one", async () => {
      const calls = backend()
      server.use(http.get(`${API_BASE}/me/active-roadmap`, () => failure("active_roadmap_not_found", 404)))
      renderPage(signedInStore(), <RoadmapPage />)
      expect(await screen.findByRole("heading", { level: 1, name: w.noRoadmapTitle })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: w.goToOverview })).toHaveAttribute("href", "/dashboard")
      expect(calls.generation).toBe(0)
    })

    it("a failed load is an error with a retry", async () => {
      server.use(
        http.get(`${API_BASE}/me/onboarding-status`, () => envelope({ completed: true, missing_fields: [] })),
        http.get(`${API_BASE}/me/active-roadmap`, () => failure("internal_error", 500))
      )
      renderPage(signedInStore(), <ResourcesPage />)
      expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent(w.errorTitle)
      expect(screen.getByRole("button", { name: w.retry })).toBeInTheDocument()
    })
  })
})
