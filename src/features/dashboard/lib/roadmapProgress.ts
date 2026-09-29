import type {
  Progress,
  Roadmap,
  RoadmapStage,
  RoadmapTask,
  RoadmapVersion,
} from "@/lib/api/types"

/**
 * Display derivations over the server's roadmap statuses (spec 007 FR-005,
 * FR-008, FR-009). The backend decides which tasks are current/available and
 * which stage is active; these helpers only select and count from that — they
 * never infer new state. Pure: no React, no i18n.
 */

export interface CurrentTaskRef {
  task: RoadmapTask
  stage: RoadmapStage
}

export interface RoadmapProgress {
  stageNumber: number
  stageCount: number
  completedTasks: number
  countedTasks: number
  percent: number
  allCompleted: boolean
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

/** Stages, their tasks and each task's resources sorted by `position` (FR-016). */
export function orderedStages(version: RoadmapVersion | null): RoadmapStage[] {
  if (!version) return []
  return [...version.stages].sort(byPosition).map((stage) => ({
    ...stage,
    tasks: [...stage.tasks].sort(byPosition).map((task) => ({
      ...task,
      resources: [...task.resources].sort(byPosition),
    })),
  }))
}

function firstWithStatus(
  stages: RoadmapStage[],
  status: RoadmapTask["status"]
): CurrentTaskRef | null {
  for (const stage of stages) {
    const task = stage.tasks.find((t) => t.status === status)
    if (task) return { task, stage }
  }
  return null
}

/**
 * FR-005: the first `current` task in roadmap order; otherwise the first
 * `available` task, searching the active stage first and then later stages;
 * otherwise null.
 */
export function findCurrentTask(stages: RoadmapStage[]): CurrentTaskRef | null {
  const current = firstWithStatus(stages, "current")
  if (current) return current

  const activeIndex = stages.findIndex((s) => s.status === "active")
  return firstWithStatus(activeIndex >= 0 ? stages.slice(activeIndex) : stages, "available")
}

const isActionable = (task: RoadmapTask) => task.status === "current" || task.status === "available"

/** FR-008: up to `limit` actionable tasks — the current task first, then roadmap order. */
export function focusTasks(stages: RoadmapStage[], limit = 3): CurrentTaskRef[] {
  const current = findCurrentTask(stages)
  const refs: CurrentTaskRef[] = current ? [current] : []
  for (const stage of stages) {
    for (const task of stage.tasks) {
      if (refs.length >= limit) return refs
      if (isActionable(task) && task.id !== current?.task.id) refs.push({ task, stage })
    }
  }
  return refs.slice(0, limit)
}

/**
 * FR-009. When the roadmap carries the server's `progress` (contract §16 —
 * required tasks only, floored percentage) those figures are used as-is: the
 * server owns progress. The local count (all tasks except `replaced`; skipped
 * counts toward the total, not as completed) is only a fallback for a payload
 * without it.
 */
export function roadmapProgress(stages: RoadmapStage[], server?: Progress): RoadmapProgress {
  const counted = stages.flatMap((s) => s.tasks).filter((t) => t.status !== "replaced")
  const completedTasks = server ? server.completedTasks : counted.filter((t) => t.status === "completed").length
  const countedTasks = server ? server.totalTasks : counted.length

  const activeIndex = stages.findIndex((s) => s.status === "active")
  const openIndex = stages.findIndex((s) => s.status !== "completed")
  const stageNumber =
    activeIndex >= 0 ? activeIndex + 1 : openIndex >= 0 ? openIndex + 1 : stages.length

  return {
    stageNumber,
    stageCount: stages.length,
    completedTasks,
    countedTasks,
    percent: server ? server.percentage : countedTasks === 0 ? 0 : Math.floor((completedTasks / countedTasks) * 100),
    allCompleted: server
      ? server.totalTasks > 0 && server.completedTasks >= server.totalTasks
      : countedTasks > 0 && counted.every((t) => t.status === "completed" || t.status === "skipped"),
  }
}

/**
 * Contract §19/§20 `can_complete`, derived from the roadmap tree the dashboard
 * already holds: the roadmap is active (the active status and the active slot
 * go together, §18), the task is `available` or `current`, and every task it
 * depends on is completed. The server re-checks and answers 409
 * task_completion_conflict otherwise, so this only decides whether to offer
 * the action.
 */
export function canCompleteTask(roadmap: Roadmap, task: RoadmapTask): boolean {
  if (roadmap.status !== "active") return false
  if (task.status !== "available" && task.status !== "current") return false
  const completed = new Set(
    (roadmap.currentVersion?.stages ?? []).flatMap((s) => s.tasks).filter((t) => t.status === "completed").map((t) => t.id)
  )
  return task.dependsOnTaskIds.every((id) => completed.has(id))
}
