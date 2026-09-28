import "@testing-library/jest-dom/vitest"
import { describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { IntlWrapper } from "@tests/helpers/intl"
import { RoadmapView } from "@/features/dashboard/components/RoadmapView"
import type { Roadmap } from "@/lib/api/types"
import enMessages from "../../../messages/en.json"
import arMessages from "../../../messages/ar.json"
import { makeResource, makeRoadmap, makeStage, makeTask } from "@tests/unit/dashboard/fixtures"

const FIXTURE: Roadmap = {
  id: "roadmap-1",
  goal: "Become a Full-Stack Developer",
  status: "ready",
  activatedAt: null,
  currentVersion: {
    id: "ver-1",
    versionNumber: 1,
    source: "generated",
    status: "current",
    stages: [
      {
        id: "stage-1",
        title: "Frontend Fundamentals",
        description: "Learn HTML, CSS, JavaScript",
        position: 1,
        status: "active",
        estimatedMinutes: 300,
        tasks: [
          {
            id: "task-1",
            type: "read",
            title: "Read JavaScript Basics",
            instructions: "Read the MDN guide",
            position: 1,
            status: "current",
            isRequired: true,
            estimatedMinutes: 45,
            dependsOnTaskIds: [],
            resources: [
              { id: "res-1", title: "MDN JavaScript Guide", url: "https://mdn.dev/js", type: "documentation", position: 1 },
              { id: "res-2", title: "Eloquent JavaScript", url: "https://eloquentjavascript.net", type: "article", position: 2 },
            ],
          },
          {
            id: "task-2",
            type: "project",
            title: "Build a Todo App",
            instructions: "Apply the basics",
            position: 2,
            status: "upcoming",
            isRequired: true,
            estimatedMinutes: 120,
            dependsOnTaskIds: ["task-1"],
            resources: [],
          },
        ],
      },
      {
        id: "stage-2",
        title: "Backend Fundamentals",
        description: "Learn APIs and databases",
        position: 2,
        status: "upcoming",
        estimatedMinutes: 300,
        tasks: [
          {
            id: "task-3",
            type: "watch",
            title: "Watch API Design",
            instructions: "Watch the course",
            position: 1,
            status: "upcoming",
            isRequired: false,
            estimatedMinutes: 60,
            dependsOnTaskIds: [],
            resources: [
              { id: "res-3", title: "REST API Course", url: "https://example.com/api-course", type: "course", position: 1 },
            ],
          },
        ],
      },
    ],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("roadmap view (FR-017)", () => {
  it("T033: renders stages and tasks in position order with each task's resources", () => {
    render(
      <IntlWrapper>
        <RoadmapView roadmap={FIXTURE} />
      </IntlWrapper>
    )

    // Goal header — an h2 under the dashboard's single h1 (spec 007 R-7).
    expect(
      screen.getByRole("heading", { level: 2, name: "Become a Full-Stack Developer" })
    ).toBeInTheDocument()

    // Stage headings from the version's stage list, one level below the goal.
    const stageHeadings = screen.getAllByRole("heading", { level: 3 })
    expect(stageHeadings.map((h) => h.textContent)).toEqual(["Frontend Fundamentals", "Backend Fundamentals"])

    // Tasks in position order.
    const taskElements = [
      screen.getByText("Read JavaScript Basics"),
      screen.getByText("Build a Todo App"),
      screen.getByText("Watch API Design"),
    ]
    expect(taskElements).toHaveLength(3)
    expect(screen.getByText("MDN JavaScript Guide")).toBeInTheDocument()
    expect(screen.getByText("Eloquent JavaScript")).toBeInTheDocument()
    expect(screen.getByText("REST API Course")).toBeInTheDocument()
    expect(screen.getByText("· 2 resources")).toBeInTheDocument()
  })

  it("T033b: every task-level action control renders disabled", () => {
    render(
      <IntlWrapper>
        <RoadmapView roadmap={FIXTURE} />
      </IntlWrapper>
    )

    const completeButtons = screen.getAllByRole("button", { name: "Mark Complete" })
    const skipButtons = screen.getAllByRole("button", { name: "Skip" })
    expect(completeButtons.length).toBeGreaterThan(0)
    expect(skipButtons.length).toBeGreaterThan(0)
    for (const button of [...completeButtons, ...skipButtons]) {
      expect(button).toBeDisabled()
    }
  })
})
describe("roadmap view — spec 007", () => {
  const LOCALES = [
    { locale: "en", messages: enMessages, linkUnavailable: "Link unavailable", soon: "Available soon" },
    { locale: "ar", messages: arMessages, linkUnavailable: "الرابط غير متاح", soon: "متاح قريبًا" },
  ] as const

  function renderIn(locale: string, messages: Record<string, unknown>, roadmap: Roadmap) {
    return render(
      <IntlWrapper locale={locale} messages={messages}>
        <RoadmapView roadmap={roadmap} />
      </IntlWrapper>
    )
  }

  const roadmap = makeRoadmap({ goal: "Goal" }, [
    makeStage({
      id: "s2",
      title: "Second stage",
      position: 2,
      tasks: [makeTask({ id: "t3", title: "Third", status: "upcoming" })],
    }),
    makeStage({
      id: "s1",
      title: "First stage",
      position: 1,
      status: "active",
      tasks: [
        makeTask({
          id: "t2",
          title: "Second",
          position: 2,
          status: "available",
          estimatedMinutes: 1,
          resources: [
            makeResource({ id: "bad", title: "Bad link", url: "javascript:alert(1)", position: 2 }),
            makeResource({ id: "good", title: "Good link", url: "https://example.com/good", position: 1 }),
          ],
        }),
        makeTask({ id: "t1", title: "First", position: 1, status: "current", estimatedMinutes: 45 }),
      ],
    }),
  ])

  for (const { locale, messages, linkUnavailable, soon } of LOCALES) {
    describe(locale, () => {
      it("has no h1 and titles the section with the goal as h2#roadmap-heading", () => {
        const { container } = renderIn(locale, messages, roadmap)
        expect(container.querySelector("h1")).toBeNull()
        expect(container.querySelector("section#roadmap h2#roadmap-heading")?.textContent).toBe("Goal")
      })

      it("renders stages and tasks sorted by position, each task anchored as task-<id>", () => {
        const { container } = renderIn(locale, messages, roadmap)
        expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
          "First stage",
          "Second stage",
        ])
        const anchors = [...container.querySelectorAll("[id^='task-']:not([id$='-actions-note'])")]
        expect(anchors.map((el) => el.id)).toEqual(["task-t1", "task-t2", "task-t3"])
        expect(anchors[0]).toHaveAttribute("tabindex", "-1")
      })

      it("links only safe resources, in a new tab without an opener", () => {
        renderIn(locale, messages, roadmap)
        const good = screen.getByRole("link", { name: /Good link/ })
        expect(good).toHaveAttribute("href", "https://example.com/good")
        expect(good).toHaveAttribute("target", "_blank")
        expect(good).toHaveAttribute("rel", "noopener noreferrer")

        expect(screen.queryByRole("link", { name: /Bad link/ })).toBeNull()
        expect(screen.getByText("Bad link")).toBeInTheDocument()
        expect(screen.getByText(`(${linkUnavailable})`)).toBeInTheDocument()
      })

      it("keeps complete/skip disabled and describes why", () => {
        renderIn(locale, messages, roadmap)
        const buttons = screen.getAllByRole("button")
        expect(buttons).toHaveLength(4) // 2 actionable tasks × (complete + skip)
        for (const button of buttons) {
          expect(button).toBeDisabled()
          const noteId = button.getAttribute("aria-describedby")
          expect(noteId && document.getElementById(noteId)?.textContent).toBe(soon)
        }
      })
    })
  }

  it("formats durations through the plural message", () => {
    renderIn("en", enMessages, roadmap)
    expect(screen.getByText("· 45 min")).toBeInTheDocument()
    expect(screen.getByText("· 1 min")).toBeInTheDocument()
    cleanup()
    renderIn("ar", arMessages, roadmap)
    expect(screen.getByText("· 45 دقيقة")).toBeInTheDocument()
    expect(screen.getByText("· دقيقة واحدة")).toBeInTheDocument()
  })
})
