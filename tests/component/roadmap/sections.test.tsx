import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { IntlWrapper } from "@tests/helpers/intl"
import { ContinueLearningSection } from "@/features/dashboard/components/sections/ContinueLearningSection"
import { TodayFocusSection } from "@/features/dashboard/components/sections/TodayFocusSection"
import { ProgressSection } from "@/features/dashboard/components/sections/ProgressSection"
import { focusTasks, roadmapProgress } from "@/features/dashboard/lib/roadmapProgress"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"
import { makeStage, makeTask } from "@tests/unit/dashboard/fixtures"

// Button (for buttonVariants) imports the locale-aware navigation helpers,
// which need Next's runtime — stub them as the other component tests do.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}))

function renderIn(ui: React.ReactNode, locale: "en" | "ar" = "en") {
  return render(
    <IntlWrapper locale={locale} messages={locale === "en" ? enMessages : arMessages}>
      {ui}
    </IntlWrapper>
  )
}

const stage = makeStage({ id: "s1", title: "Frontend Basics", status: "active" })
const task = makeTask({ id: "t1", title: "Read the DOM guide", type: "read", status: "current", estimatedMinutes: 45 })

describe("ContinueLearningSection (spec 007 US2)", () => {
  it("shows the current task's title, type, minutes and stage, linking to its anchor", () => {
    renderIn(<ContinueLearningSection current={{ task, stage }} allCompleted={false} />)
    expect(screen.getByText("Read the DOM guide")).toBeInTheDocument()
    expect(screen.getByText(enMessages.dashboard.taskType.read)).toBeInTheDocument()
    expect(screen.getByText("45 min")).toBeInTheDocument()
    expect(screen.getByText("Stage: Frontend Basics")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Go to task" })).toHaveAttribute("href", "#task-t1")
  })

  it("shows the completion state with no task link when everything is done", () => {
    renderIn(<ContinueLearningSection current={null} allCompleted />)
    expect(screen.getByText(enMessages.dashboard.allTasksCompletedTitle)).toBeInTheDocument()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("shows the honest nothing-to-start state pointing at the roadmap otherwise", () => {
    renderIn(<ContinueLearningSection current={null} allCompleted={false} />)
    expect(screen.getByText(enMessages.dashboard.nothingToStartTitle)).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "#roadmap")
  })

  it("renders in Arabic", () => {
    renderIn(<ContinueLearningSection current={{ task, stage }} allCompleted={false} />, "ar")
    expect(screen.getByRole("link", { name: arMessages.dashboard.goToTask })).toBeInTheDocument()
    expect(screen.getByText("المرحلة: Frontend Basics")).toBeInTheDocument()
  })
})

describe("TodayFocusSection (spec 007 US4)", () => {
  const stages = [
    makeStage({
      id: "s1",
      status: "active",
      tasks: [
        makeTask({ id: "a", title: "A", position: 1, status: "available" }),
        makeTask({ id: "c", title: "C", position: 2, status: "current" }),
        makeTask({ id: "b", title: "B", position: 3, status: "available" }),
        makeTask({ id: "d", title: "D", position: 4, status: "available" }),
      ],
    }),
  ]

  it("lists at most 3 tasks, current first, each linking to its task", () => {
    renderIn(<TodayFocusSection tasks={focusTasks(stages)} />)
    const links = within(screen.getByRole("list")).getAllByRole("link")
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["#task-c", "#task-a", "#task-b"])
  })

  it("shows the empty state when nothing is actionable", () => {
    renderIn(<TodayFocusSection tasks={[]} />)
    expect(screen.getByText(enMessages.dashboard.noFocusTasksTitle)).toBeInTheDocument()
    expect(screen.queryByRole("list")).toBeNull()
  })
})

describe("ProgressSection (spec 007 US3)", () => {
  const stages = [
    makeStage({
      id: "s1",
      title: "Alpha",
      position: 1,
      status: "completed",
      tasks: [1, 2, 3, 4].map((n) => makeTask({ id: `c${n}`, status: "completed" })),
    }),
    makeStage({
      id: "s2",
      title: "Beta",
      position: 2,
      status: "active",
      tasks: [5, 6, 7].map((n) => makeTask({ id: `a${n}`, status: "available" })),
    }),
    makeStage({
      id: "s3",
      title: "Gamma",
      position: 3,
      status: "upcoming",
      tasks: [8, 9, 10].map((n) => makeTask({ id: `u${n}`, status: "upcoming" })),
    }),
  ]

  it("shows real stage and task counts with an accessible progress bar", () => {
    renderIn(<ProgressSection progress={roadmapProgress(stages)} />)
    expect(screen.getByText("Stage 2 of 3")).toBeInTheDocument()
    expect(screen.getByText("4 of 10 tasks completed")).toBeInTheDocument()
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(bar).toHaveAccessibleName(enMessages.dashboard.progressBarLabel)
  })

  it("exposes stage titles only to assistive technology (not a second visible list)", () => {
    const { container } = renderIn(<ProgressSection progress={roadmapProgress(stages)} />)
    const list = container.querySelector("ul")
    expect(list).toHaveClass("sr-only")
    expect(list?.textContent).toContain("Beta")
  })
})
