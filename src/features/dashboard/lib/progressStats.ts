import type { Roadmap, StageStatus } from "@/lib/api/types"
import { taskItems, type TaskDisplayStatus, type TaskItem } from "./learningItems"
import { orderedStages, roadmapProgress } from "./roadmapProgress"

/**
 * Everything the Progress page shows, derived from the roadmap the workspace
 * already holds — no extra request and no invented figures:
 * - overall %, completed/total: the server's `progress` (required tasks only),
 *   via roadmapProgress;
 * - time: the tasks' own `estimated_minutes` (replaced and skipped tasks
 *   don't count — they will never be done);
 * - per stage and per status: counts of the roadmap's tasks.
 * Pure: no React, no i18n.
 */

export type StatusBucket = "completed" | "current" | "available" | "locked" | "upcoming" | "other"

export const STATUS_BUCKETS: readonly StatusBucket[] = ["completed", "current", "available", "locked", "upcoming", "other"]

export interface StageTaskCount {
  id: string
  title: string
  position: number
  status: StageStatus
  completed: number
  remaining: number
}

export interface ProgressStats {
  percent: number
  completedTasks: number
  totalTasks: number
  remainingTasks: number
  completedMinutes: number
  remainingMinutes: number
  stageNumber: number
  stageCount: number
  byStage: StageTaskCount[]
  /** Every bucket in STATUS_BUCKETS order, zeros included. */
  byStatus: { bucket: StatusBucket; count: number }[]
  /** Newest completion first when the server sent `completed_at`, else roadmap order. */
  completedItems: TaskItem[]
}

const willBeDone = (status: string) => status !== "replaced" && status !== "skipped"

function bucketOf(status: TaskDisplayStatus): StatusBucket {
  switch (status) {
    case "completed":
    case "current":
    case "available":
    case "locked":
    case "upcoming":
      return status
    default:
      return "other"
  }
}

export function progressStats(roadmap: Roadmap): ProgressStats {
  const stages = orderedStages(roadmap.currentVersion)
  const summary = roadmapProgress(stages, roadmap.progress)
  const tasks = stages.flatMap((stage) => stage.tasks).filter((task) => willBeDone(task.status))

  let completedMinutes = 0
  let remainingMinutes = 0
  for (const task of tasks) {
    if (task.status === "completed") completedMinutes += task.estimatedMinutes
    else remainingMinutes += task.estimatedMinutes
  }

  const items = taskItems(roadmap).filter((item) => item.status !== "replaced")
  const counts = new Map<StatusBucket, number>()
  for (const item of items) {
    const bucket = bucketOf(item.status)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }

  const completedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === "completed")
    .sort((a, b) => {
      const at = a.item.task.completedAt ? Date.parse(a.item.task.completedAt) : Number.NEGATIVE_INFINITY
      const bt = b.item.task.completedAt ? Date.parse(b.item.task.completedAt) : Number.NEGATIVE_INFINITY
      return bt - at || a.index - b.index
    })
    .map(({ item }) => item)

  return {
    percent: summary.percent,
    completedTasks: summary.completedTasks,
    totalTasks: summary.countedTasks,
    remainingTasks: Math.max(summary.countedTasks - summary.completedTasks, 0),
    completedMinutes,
    remainingMinutes,
    stageNumber: summary.stageNumber,
    stageCount: summary.stageCount,
    byStage: stages.map((stage) => {
      const counted = stage.tasks.filter((task) => willBeDone(task.status))
      const completed = counted.filter((task) => task.status === "completed").length
      return {
        id: stage.id,
        title: stage.title,
        position: stage.position,
        status: stage.status,
        completed,
        remaining: counted.length - completed,
      }
    }),
    byStatus: STATUS_BUCKETS.map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 })),
    completedItems,
  }
}
