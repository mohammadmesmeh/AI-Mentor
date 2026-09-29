import { describe, expect, it } from "vitest"
import { progressStats } from "@/features/dashboard/lib/progressStats"
import { makeRoadmap, makeStage, makeTask } from "./fixtures"

const roadmap = makeRoadmap({ progress: { completedTasks: 2, totalTasks: 5, percentage: 40 } }, [
  // Out of order on purpose: the stats follow `position`.
  makeStage({
    id: "s2",
    title: "Second",
    position: 2,
    status: "active",
    tasks: [
      makeTask({ id: "b1", position: 1, status: "current", estimatedMinutes: 40 }),
      makeTask({ id: "b2", position: 2, status: "upcoming", estimatedMinutes: 30, dependsOnTaskIds: ["b1"] }),
      makeTask({ id: "b3", position: 3, status: "replaced", estimatedMinutes: 99 }),
    ],
  }),
  makeStage({
    id: "s1",
    title: "First",
    position: 1,
    status: "completed",
    tasks: [
      makeTask({ id: "a1", position: 1, status: "completed", estimatedMinutes: 20, completedAt: "2026-09-01T10:00:00Z" }),
      makeTask({ id: "a2", position: 2, status: "completed", estimatedMinutes: 25, completedAt: "2026-09-03T10:00:00Z" }),
      makeTask({ id: "a3", position: 3, status: "skipped", estimatedMinutes: 15 }),
    ],
  }),
  makeStage({
    id: "s3",
    title: "Third",
    position: 3,
    status: "upcoming",
    tasks: [makeTask({ id: "c1", position: 1, status: "upcoming", estimatedMinutes: 50 })],
  }),
])

describe("progressStats", () => {
  const stats = progressStats(roadmap)

  it("uses the server's progress for the overall figures", () => {
    expect(stats).toMatchObject({ percent: 40, completedTasks: 2, totalTasks: 5, remainingTasks: 3 })
  })

  it("sums estimated time, leaving out replaced and skipped tasks", () => {
    expect(stats.completedMinutes).toBe(45)
    expect(stats.remainingMinutes).toBe(120)
  })

  it("places the learner in the active stage", () => {
    expect(stats.stageNumber).toBe(2)
    expect(stats.stageCount).toBe(3)
  })

  it("counts completed vs remaining tasks per stage, in roadmap order", () => {
    expect(stats.byStage).toEqual([
      { id: "s1", title: "First", position: 1, status: "completed", completed: 2, remaining: 0 },
      { id: "s2", title: "Second", position: 2, status: "active", completed: 0, remaining: 2 },
      { id: "s3", title: "Third", position: 3, status: "upcoming", completed: 0, remaining: 1 },
    ])
  })

  it("buckets every task (except replaced) by its display status, zeros included", () => {
    expect(stats.byStatus).toEqual([
      { bucket: "completed", count: 2 },
      { bucket: "current", count: 1 },
      { bucket: "available", count: 0 },
      { bucket: "locked", count: 1 },
      { bucket: "upcoming", count: 1 },
      { bucket: "other", count: 1 },
    ])
  })

  it("lists completed tasks newest first", () => {
    expect(stats.completedItems.map((item) => item.task.id)).toEqual(["a2", "a1"])
  })

  it("falls back to counting the tasks when the server sent no progress", () => {
    const local = progressStats({ ...roadmap, progress: undefined })
    // 5 counted tasks (replaced excluded, skipped counted), 2 completed.
    expect(local).toMatchObject({ completedTasks: 2, totalTasks: 6, percent: 33 })
  })

  it("is all zeros for a roadmap without a version", () => {
    const empty = progressStats(makeRoadmap({ currentVersion: null }))
    expect(empty).toMatchObject({
      percent: 0,
      totalTasks: 0,
      remainingTasks: 0,
      completedMinutes: 0,
      remainingMinutes: 0,
      stageCount: 0,
      byStage: [],
      completedItems: [],
    })
  })
})
