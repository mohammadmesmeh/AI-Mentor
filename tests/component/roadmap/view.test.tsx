import "@testing-library/jest-dom/vitest"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { IntlWrapper } from "@tests/helpers/intl"
import { RoadmapView } from "@/features/dashboard/components/RoadmapView"
import type { Roadmap } from "@/lib/api/types"

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

    // Goal header.
    expect(screen.getByRole("heading", { name: "Become a Full-Stack Developer" })).toBeInTheDocument()

    // Stage headings from the version's stage list.
    const stageHeadings = screen.getAllByRole("heading", { level: 2 })
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
    expect(screen.getByLabelText("resources: 2")).toBeInTheDocument()
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