import type {
  RoadmapStage,
  RoadmapTask,
  RoadmapVersion,
  StageStatus,
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
  stageStatuses: { id: string; title: string; status: StageStatus }[]
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

/** FR-009: counts exclude `replaced` tasks; skipped tasks count toward the total, not as completed. */
export function roadmapProgress(stages: RoadmapStage[]): RoadmapProgress {
  const counted = stages.flatMap((s) => s.tasks).filter((t) => t.status !== "replaced")
  const completedTasks = counted.filter((t) => t.status === "completed").length
  const countedTasks = counted.length

  const activeIndex = stages.findIndex((s) => s.status === "active")
  const openIndex = stages.findIndex((s) => s.status !== "completed")
  const stageNumber =
    activeIndex >= 0 ? activeIndex + 1 : openIndex >= 0 ? openIndex + 1 : stages.length

  return {
    stageNumber,
    stageCount: stages.length,
    completedTasks,
    countedTasks,
    percent: countedTasks === 0 ? 0 : Math.floor((completedTasks / countedTasks) * 100),
    allCompleted:
      countedTasks > 0 && counted.every((t) => t.status === "completed" || t.status === "skipped"),
    stageStatuses: stages.map(({ id, title, status }) => ({ id, title, status })),
  }
}
