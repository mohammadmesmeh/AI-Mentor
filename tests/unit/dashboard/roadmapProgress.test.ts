import { describe, expect, it } from "vitest"
import {
  findCurrentTask,
  focusTasks,
  orderedStages,
  roadmapProgress,
} from "@/features/dashboard/lib/roadmapProgress"
import { makeResource, makeRoadmap, makeStage, makeTask } from "./fixtures"

describe("orderedStages", () => {
  it("sorts stages, tasks and resources by position without mutating the input", () => {
    const roadmap = makeRoadmap({}, [
      makeStage({
        id: "s2",
        position: 2,
        tasks: [
          makeTask({ id: "t2b", position: 2 }),
          makeTask({
            id: "t2a",
            position: 1,
            resources: [
              makeResource({ id: "r2", position: 2 }),
              makeResource({ id: "r1", position: 1 }),
            ],
          }),
        ],
      }),
      makeStage({ id: "s1", position: 1 }),
    ])
    const snapshot = JSON.stringify(roadmap)

    const stages = orderedStages(roadmap.currentVersion)

    expect(stages.map((s) => s.id)).toEqual(["s1", "s2"])
    expect(stages[1].tasks.map((t) => t.id)).toEqual(["t2a", "t2b"])
    expect(stages[1].tasks[0].resources.map((r) => r.id)).toEqual(["r1", "r2"])
    expect(JSON.stringify(roadmap)).toBe(snapshot)
  })

  it("returns an empty list for a missing version", () => {
    expect(orderedStages(null)).toEqual([])
  })
})

describe("findCurrentTask", () => {
  it("returns the first task in roadmap order with status current", () => {
    const stages = [
      makeStage({
        id: "s1",
        position: 1,
        status: "active",
        tasks: [
          makeTask({ id: "a", position: 1, status: "available" }),
          makeTask({ id: "c1", position: 2, status: "current" }),
          makeTask({ id: "c2", position: 3, status: "current" }),
        ],
      }),
    ]
    const ref = findCurrentTask(stages)
    expect(ref?.task.id).toBe("c1")
    expect(ref?.stage.id).toBe("s1")
  })

  it("falls back to the first available task, searching the active stage first then later stages", () => {
    const stages = [
      makeStage({
        id: "s1",
        position: 1,
        status: "completed",
        tasks: [makeTask({ id: "early", status: "available" })],
      }),
      makeStage({
        id: "s2",
        position: 2,
        status: "active",
        tasks: [makeTask({ id: "done", status: "completed" })],
      }),
      makeStage({
        id: "s3",
        position: 3,
        status: "upcoming",
        tasks: [makeTask({ id: "later", status: "available" })],
      }),
    ]
    expect(findCurrentTask(stages)?.task.id).toBe("later")
  })

  it("returns null when nothing is current or available", () => {
    const stages = [
      makeStage({
        status: "active",
        tasks: ["upcoming", "completed", "skip_pending", "skipped", "replaced"].map((status, i) =>
          makeTask({ id: `t${i}`, position: i + 1, status: status as never })
        ),
      }),
    ]
    expect(findCurrentTask(stages)).toBeNull()
  })

  it("returns null for no stages", () => {
    expect(findCurrentTask([])).toBeNull()
  })
})

describe("focusTasks", () => {
  const stages = [
    makeStage({
      id: "s1",
      position: 1,
      status: "active",
      tasks: [
        makeTask({ id: "a1", position: 1, status: "available" }),
        makeTask({ id: "cur", position: 2, status: "current" }),
        makeTask({ id: "a2", position: 3, status: "available" }),
        makeTask({ id: "x", position: 4, status: "skipped" }),
      ],
    }),
    makeStage({
      id: "s2",
      position: 2,
      tasks: [
        makeTask({ id: "a3", position: 1, status: "available" }),
        makeTask({ id: "a4", position: 2, status: "available" }),
      ],
    }),
  ]

  it("lists at most 3 actionable tasks, current first, then roadmap order, without duplicates", () => {
    expect(focusTasks(stages).map((r) => r.task.id)).toEqual(["cur", "a1", "a2"])
  })

  it("respects a custom limit", () => {
    expect(focusTasks(stages, 5).map((r) => r.task.id)).toEqual(["cur", "a1", "a2", "a3", "a4"])
  })

  it("is empty when nothing is actionable", () => {
    expect(focusTasks([makeStage({ tasks: [makeTask({ status: "completed" })] })])).toEqual([])
  })
})

describe("roadmapProgress", () => {
  it("counts completed of counted tasks, excluding replaced, and floors the percent", () => {
    const stages = [
      makeStage({
        id: "s1",
        position: 1,
        status: "completed",
        tasks: [
          makeTask({ id: "1", status: "completed" }),
          makeTask({ id: "2", status: "completed" }),
          makeTask({ id: "3", status: "replaced" }),
        ],
      }),
      makeStage({
        id: "s2",
        position: 2,
        status: "active",
        tasks: [
          makeTask({ id: "4", status: "current" }),
          makeTask({ id: "5", status: "skipped" }),
        ],
      }),
      makeStage({
        id: "s3",
        position: 3,
        status: "upcoming",
        tasks: [makeTask({ id: "6", status: "upcoming" })],
      }),
    ]
    const p = roadmapProgress(stages)
    expect(p.stageCount).toBe(3)
    expect(p.stageNumber).toBe(2)
    expect(p.countedTasks).toBe(5)
    expect(p.completedTasks).toBe(2)
    expect(p.percent).toBe(40)
    expect(p.allCompleted).toBe(false)
    expect(p.stageStatuses).toEqual([
      { id: "s1", title: "Stage", status: "completed" },
      { id: "s2", title: "Stage", status: "active" },
      { id: "s3", title: "Stage", status: "upcoming" },
    ])
  })

  it("floors rather than rounds", () => {
    const tasks = [
      makeTask({ id: "1", status: "completed" }),
      makeTask({ id: "2" }),
      makeTask({ id: "3" }),
    ]
    expect(roadmapProgress([makeStage({ status: "active", tasks })]).percent).toBe(33)
  })

  it("is allCompleted when every counted task is completed or skipped", () => {
    const stages = [
      makeStage({
        status: "completed",
        tasks: [
          makeTask({ id: "1", status: "completed" }),
          makeTask({ id: "2", status: "skipped" }),
          makeTask({ id: "3", status: "replaced" }),
        ],
      }),
    ]
    const p = roadmapProgress(stages)
    expect(p.allCompleted).toBe(true)
    expect(p.percent).toBe(50)
  })

  it("uses the first non-completed stage when none is active, and the last stage when all are completed", () => {
    const withoutActive = [
      makeStage({ id: "a", position: 1, status: "completed" }),
      makeStage({ id: "b", position: 2, status: "upcoming" }),
    ]
    expect(roadmapProgress(withoutActive).stageNumber).toBe(2)

    const allDone = [
      makeStage({ id: "a", position: 1, status: "completed" }),
      makeStage({ id: "b", position: 2, status: "completed" }),
    ]
    expect(roadmapProgress(allDone).stageNumber).toBe(2)
  })

  it("handles an empty roadmap without throwing", () => {
    const p = roadmapProgress([])
    expect(p).toMatchObject({
      stageCount: 0,
      stageNumber: 0,
      countedTasks: 0,
      completedTasks: 0,
      percent: 0,
      allCompleted: false,
    })
  })
})
