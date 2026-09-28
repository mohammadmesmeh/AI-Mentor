"use client"

import { CheckCircle2, ExternalLink, PlayCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useT, type TranslateFn } from "@/shared/hooks/useT"
import type { Resource, Roadmap, RoadmapStage, RoadmapTask, StageStatus, TaskStatus } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { canCompleteTask, orderedStages } from "../lib/roadmapProgress"
import { safeExternalUrl } from "../lib/safeExternalUrl"
import { taskAnchorId } from "../lib/focusTask"
import { taskIcon } from "../lib/taskIcon"

function stageBadge(status: StageStatus, t: TranslateFn) {
  if (status === "completed") {
    return (
      <span className="badge-base bg-primary/10 text-primary">
        {t("stageCompleted", "Completed")}
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="badge-base bg-primary/10 text-xs text-primary">
        {t("stageActive", "In Progress")}
      </span>
    )
  }
  return (
    <span className="badge-base bg-muted text-muted-foreground">
      {t("stageUpcoming", "Upcoming")}
    </span>
  )
}

function taskStatusBadge(status: TaskStatus, t: TranslateFn) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("taskCompleted", "Completed")}
      </span>
    )
  }
  if (status === "current" || status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {t("taskAvailable", "Available")}
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">{t("taskUpcoming", "Upcoming")}</span>
}

/**
 * Mark-complete wiring (contract §20). The server owns every state change: the
 * page passes the pending task and the last failure, and the tree re-renders
 * from the roadmap the server returns — nothing is toggled locally.
 */
export interface TaskCompletion {
  pendingTaskId: string | null
  error: { taskId: string; kind: "conflict" | "failed" } | null
  onComplete: (taskId: string) => void
}

interface RoadmapViewProps {
  roadmap: Roadmap
  completion?: TaskCompletion
}

interface RowContext {
  roadmap: Roadmap
  completion?: TaskCompletion
  t: TranslateFn
}

function RoadmapStageView({ stage, ctx }: { stage: RoadmapStage; ctx: RowContext }) {
  const { t } = ctx
  return (
    <Card>
      {/* flex-wrap: on narrow screens the badge drops under the title rather
          than squeezing it into mid-word breaks. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-5">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="font-display text-sm font-bold text-primary">
              {String(stage.position).padStart(2, "0")}
            </span>
          </div>
          <div className="min-w-0">
            <h3 dir="auto" className="wrap-break-word text-heading-sm font-semibold text-foreground">
              {stage.title}
            </h3>
            {stage.description && (
              <p dir="auto" className="text-sm text-muted-foreground">{stage.description}</p>
            )}
          </div>
        </div>
        {stageBadge(stage.status, t)}
      </div>
      <CardContent className="divide-y divide-border/50 p-0">
        {stage.tasks.map((task) => (
          <TaskRow key={task.id} task={task} ctx={ctx} />
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * AI-found resources are untrusted: only http(s) URLs become links, and they
 * open in a new tab without handing the page an opener (spec 007 FR-017).
 */
function ResourceItem({ resource, t }: { resource: Resource; t: TranslateFn }) {
  const href = safeExternalUrl(resource.url)
  if (!href) {
    return (
      <li className="text-xs text-muted-foreground">
        <span dir="auto" className="wrap-break-word">{resource.title}</span>{" "}
        <span className="italic">({t("resourceLinkUnavailable")})</span>
      </li>
    )
  }
  return (
    <li className="text-xs">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-sm text-secondary-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span dir="auto" className="wrap-break-word">{resource.title}</span>
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only"> {t("resourceOpensNewTab")}</span>
      </a>
    </li>
  )
}

function TaskRow({ task, ctx }: { task: RoadmapTask; ctx: RowContext }) {
  const { roadmap, completion, t } = ctx
  const actionable = task.status === "available" || task.status === "current"
  const anchor = taskAnchorId(task.id)
  const completeNoteId = `${anchor}-complete-note`

  const canComplete = !!completion && canCompleteTask(roadmap, task)
  const pending = completion?.pendingTaskId === task.id
  const busy = completion?.pendingTaskId != null
  const error = completion?.error?.taskId === task.id ? completion.error.kind : null
  // Why "Mark complete" is unavailable, when it is.
  const lockedReason = canComplete
    ? null
    : roadmap.status !== "active"
      ? t("taskCompleteNeedsActive")
      : t("taskCompleteLocked")

  return (
    <div
      id={taskAnchorId(task.id)}
      tabIndex={-1}
      className="flex scroll-mt-24 flex-wrap items-center gap-3 px-5 py-4 outline-none transition-colors duration-200 target:bg-primary/5 target:ring-2 target:ring-inset target:ring-primary/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      aria-disabled={task.status === "upcoming"}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          task.status === "upcoming" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        )}
      >
        {taskIcon(task.type)}
      </div>
      {/* basis-56: on narrow screens the actions wrap below instead of squeezing the title. */}
      <div className="min-w-0 flex-1 basis-56">
        <p
          dir="auto"
          className={cn(
            "wrap-break-word text-sm font-medium",
            task.status === "upcoming" && "text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t(`taskType.${task.type}`, task.type)}</span>
          {task.estimatedMinutes > 0 && (
            <span>· {t("taskMinutes", undefined, { count: task.estimatedMinutes })}</span>
          )}
          {task.resources.length > 0 && (
            <span>
              · {t("taskResources", undefined, { count: task.resources.length })}
            </span>
          )}
        </div>
        {task.resources.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {task.resources.map((resource) => (
              <ResourceItem key={resource.id} resource={resource} t={t} />
            ))}
          </ul>
        )}
      </div>
      {taskStatusBadge(task.status, t)}
      {actionable ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canComplete || busy}
              aria-describedby={error || lockedReason ? completeNoteId : undefined}
              onClick={() => completion?.onComplete(task.id)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                canComplete
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  : "text-muted-foreground ring-1 ring-border disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {pending ? t("taskCompleting") : t("taskComplete", "Mark Complete")}
            </button>
          </div>
          {error ? (
            <span id={completeNoteId} role="alert" className="text-xs text-danger-500">
              {t(error === "conflict" ? "taskCompleteConflict" : "taskCompleteFailed")}
            </span>
          ) : lockedReason ? (
            <span id={completeNoteId} className="text-xs text-muted-foreground">
              {lockedReason}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function RoadmapView({ roadmap, completion }: RoadmapViewProps) {
  const t = useT("dashboard")
  const ctx: RowContext = { roadmap, completion, t }
  const stages = orderedStages(roadmap.currentVersion)

  if (stages.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">{t("roadmapNotFound")}</p>
    )
  }

  return (
    <section id="roadmap" aria-labelledby="roadmap-heading" className="scroll-mt-20 space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          {t("yourRoadmap", "Your Learning Roadmap")}
        </p>
        <h2
          id="roadmap-heading"
          dir="auto"
          className="wrap-break-word text-heading-md font-semibold text-foreground"
        >
          {roadmap.goal}
        </h2>
      </header>
      {stages.map((stage) => (
        <RoadmapStageView key={stage.id} stage={stage} ctx={ctx} />
      ))}
    </section>
  )
}

export { RoadmapView }
