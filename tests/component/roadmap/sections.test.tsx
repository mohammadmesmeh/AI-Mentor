import "@testing-library/jest-dom/vitest"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { IntlWrapper } from "@tests/helpers/intl"
import { ContinueLearningSection } from "@/features/dashboard/components/sections/ContinueLearningSection"
import { TodayFocusSection } from "@/features/dashboard/components/sections/TodayFocusSection"
import { PlanStagesSection } from "@/features/dashboard/components/sections/PlanStagesSection"
import { focusTasks } from "@/features/dashboard/lib/roadmapProgress"
import { progressStats } from "@/features/dashboard/lib/progressStats"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"
import { makeRoadmap, makeStage, makeTask } from "@tests/unit/dashboard/fixtures"

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
  it("shows the current task's title, type, minutes and stage, linking to its page", () => {
    renderIn(<ContinueLearningSection current={{ task, stage }} allCompleted={false} />)
    expect(screen.getByText("Read the DOM guide")).toBeInTheDocument()
    expect(screen.getByText(enMessages.dashboard.taskType.read)).toBeInTheDocument()
    expect(screen.getByText("45 min")).toBeInTheDocument()
    expect(screen.getByText("Stage 1 · Frontend Basics")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: enMessages.workspace.openTask })).toHaveAttribute("href", "/tasks/t1")
  })

  it("shows the completion state with no task link when everything is done", () => {
    renderIn(<ContinueLearningSection current={null} allCompleted />)
    expect(screen.getByText(enMessages.dashboard.allTasksCompletedTitle)).toBeInTheDocument()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("shows the honest nothing-to-start state pointing at the roadmap otherwise", () => {
    renderIn(<ContinueLearningSection current={null} allCompleted={false} />)
    expect(screen.getByText(enMessages.dashboard.nothingToStartTitle)).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "/roadmap")
  })

  it("renders in Arabic", () => {
    renderIn(<ContinueLearningSection current={{ task, stage }} allCompleted={false} />, "ar")
    expect(screen.getByRole("link", { name: arMessages.workspace.openTask })).toHaveAttribute("href", "/tasks/t1")
    expect(screen.getByText("المرحلة 1 · Frontend Basics")).toBeInTheDocument()
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
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/tasks/c", "/tasks/a", "/tasks/b"])
  })

  it("shows the empty state when nothing is actionable", () => {
    renderIn(<TodayFocusSection tasks={[]} />)
    expect(screen.getByText(enMessages.dashboard.noFocusTasksTitle)).toBeInTheDocument()
    expect(screen.queryByRole("list")).toBeNull()
  })
})

describe("PlanStagesSection (spec 007 US3)", () => {
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

  it("lists every stage with its real task counts and an accessible progress bar", () => {
    const { byStage } = progressStats(makeRoadmap({}, stages))
    renderIn(<PlanStagesSection stages={byStage} />)
    expect(screen.getByText("2. Beta")).toBeInTheDocument()
    expect(screen.getByText(`4 of 4 done · ${enMessages.workspace.stageStatus.completed}`)).toBeInTheDocument()
    expect(screen.getByText(`0 of 3 done · ${enMessages.workspace.stageStatus.active}`)).toBeInTheDocument()
    const bars = screen.getAllByRole("progressbar")
    expect(bars.map((bar) => bar.getAttribute("aria-valuenow"))).toEqual(["100", "0", "0"])
    expect(bars[1]).toHaveAccessibleName("2. Beta")
  })
})
