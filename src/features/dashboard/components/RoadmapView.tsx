"use client"

import { CheckCircle2, ExternalLink, PlayCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useT, type TranslateFn } from "@/shared/hooks/useT"
import type { Resource, Roadmap, RoadmapStage, RoadmapTask, StageStatus, TaskStatus } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { orderedStages } from "../lib/roadmapProgress"
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

interface RoadmapViewProps {
  roadmap: Roadmap
}

function RoadmapStageView({ stage, t }: { stage: RoadmapStage; t: TranslateFn }) {
  return (
    <Card>
      {/* flex-wrap: on narrow screens the badge drops under the title rather
          than squeezing it into mid-word breaks. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-5">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
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
          <TaskRow key={task.id} task={task} t={t} />
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

function TaskRow({ task, t }: { task: RoadmapTask; t: TranslateFn }) {
  const actionable = task.status === "available" || task.status === "current"
  const actionsNoteId = `${taskAnchorId(task.id)}-actions-note`

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
      <div className="min-w-0 flex-1">
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
              · {task.resources.length} {t("taskResources", "resources")}
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
        // Task actions have no backend endpoint yet (spec 007 FR-014): the
        // controls stay disabled and say so — no handler, no local change.
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              aria-describedby={actionsNoteId}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("taskComplete", "Mark Complete")}
            </button>
            <button
              type="button"
              disabled
              aria-describedby={actionsNoteId}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("taskSkip", "Skip")}
            </button>
          </div>
          <span id={actionsNoteId} className="text-xs text-muted-foreground">
            {t("taskActionUnavailable")}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function RoadmapView({ roadmap }: RoadmapViewProps) {
  const t = useT("dashboard")
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
        <RoadmapStageView key={stage.id} stage={stage} t={t} />
      ))}
    </section>
  )
}

export { RoadmapView }
