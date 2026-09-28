import type { Resource, ResourceType, Roadmap, RoadmapStage, RoadmapTask } from "@/lib/api/types"
import { findCurrentTask, orderedStages } from "./roadmapProgress"

/**
 * How a task is shown. Only `locked` and `current` are derived, both from the
 * server's own data — nothing here invents state:
 * - `current`: the one task the learner should do next (findCurrentTask) —
 *   the only task drawn in the accent purple.
 * - `locked`: `upcoming` and waiting on a task it depends on (contract §20
 *   "all prerequisites are completed").
 * - `upcoming`: `upcoming` with nothing blocking it (its stage hasn't started).
 */
export type TaskDisplayStatus =
  | "current"
  | "available"
  | "completed"
  | "locked"
  | "upcoming"
  | "skip_pending"
  | "skipped"
  | "replaced"

/** Filters offered on the Tasks page. */
export const TASK_FILTERS = ["all", "available", "completed", "locked", "upcoming"] as const
export type TaskFilter = (typeof TASK_FILTERS)[number]

/** The contract's resource types (§16), in the order the Resources page offers them. */
export const RESOURCE_TYPES: readonly ResourceType[] = ["video", "article", "documentation", "course"]

export interface TaskItem {
  task: RoadmapTask
  stage: RoadmapStage
  status: TaskDisplayStatus
}

export interface ResourceItem {
  resource: Resource
  task: RoadmapTask
  stage: RoadmapStage
}

export function taskDisplayStatus(
  task: RoadmapTask,
  completedIds: ReadonlySet<string>,
  currentTaskId: string | null
): TaskDisplayStatus {
  if (task.id === currentTaskId) return "current"
  switch (task.status) {
    case "available":
    case "current":
      return "available"
    case "upcoming":
      return task.dependsOnTaskIds.some((id) => !completedIds.has(id)) ? "locked" : "upcoming"
    default:
      return task.status
  }
}

/** Every task in roadmap order with its stage and display status. */
export function taskItems(roadmap: Roadmap): TaskItem[] {
  const stages = orderedStages(roadmap.currentVersion)
  const completedIds = new Set(
    stages.flatMap((s) => s.tasks).filter((t) => t.status === "completed").map((t) => t.id)
  )
  const currentTaskId = findCurrentTask(stages)?.task.id ?? null
  return stages.flatMap((stage) =>
    stage.tasks.map((task) => ({ task, stage, status: taskDisplayStatus(task, completedIds, currentTaskId) }))
  )
}

export function matchesTaskFilter(status: TaskDisplayStatus, filter: TaskFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "available":
      return status === "available" || status === "current"
    default:
      return status === filter
  }
}

/** Every resource in roadmap order, with the task it belongs to. */
export function resourceItems(roadmap: Roadmap): ResourceItem[] {
  return orderedStages(roadmap.currentVersion).flatMap((stage) =>
    stage.tasks.flatMap((task) => task.resources.map((resource) => ({ resource, task, stage })))
  )
}

/** The site a resource points to, for display ("git-scm.com"); null when unparsable. */
export function resourceHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
