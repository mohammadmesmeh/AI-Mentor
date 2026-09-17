"use client"

import { BookOpen, CheckCircle2, GraduationCap, PlayCircle, PencilRuler, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useT, type TranslateFn } from "@/shared/hooks/useT"
import type { Roadmap, RoadmapStage, RoadmapTask, StageStatus, TaskStatus, TaskType } from "@/lib/api/types"
import { cn } from "@/lib/utils"

function taskIcon(type: TaskType) {
  switch (type) {
    case "read":
      return <BookOpen className="h-4 w-4" aria-hidden="true" />
    case "watch":
      return <Video className="h-4 w-4" aria-hidden="true" />
    case "project":
    case "coding_challenge":
    case "assignment":
      return <PencilRuler className="h-4 w-4" aria-hidden="true" />
    case "quiz":
      return <GraduationCap className="h-4 w-4" aria-hidden="true" />
  }
}

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
      <div className="flex items-center justify-between gap-3 border-b border-border/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <span className="font-display text-sm font-bold text-primary">
              {String(stage.position).padStart(2, "0")}
            </span>
          </div>
          <div>
            <h2 className="text-heading-sm font-semibold text-foreground">{stage.title}</h2>
            {stage.description && (
              <p className="text-sm text-muted-foreground">{stage.description}</p>
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

function TaskRow({ task, t }: { task: RoadmapTask; t: TranslateFn }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4" aria-disabled={task.status === "upcoming"}>
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
          className={cn(
            "text-sm font-medium",
            task.status === "upcoming" && "text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t(`taskType.${task.type}`, task.type)}</span>
          {task.estimatedMinutes > 0 && <span>· {task.estimatedMinutes} min</span>}
          {task.resources.length > 0 && (
            <span aria-label={`resources: ${task.resources.length}`}>
              · {task.resources.length} {t("taskResources", "resources")}
            </span>
          )}
        </div>
        {task.resources.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {task.resources.map((resource) => (
              <li key={resource.url} className="text-xs text-muted-foreground">
                {resource.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      {taskStatusBadge(task.status, t)}
      {task.status === "available" || task.status === "current" ? (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ring-1 ring-border"
          >
            {t("taskComplete", "Mark Complete")}
          </button>
          <button
            type="button"
            disabled
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ring-1 ring-border"
          >
            {t("taskSkip", "Skip")}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function RoadmapView({ roadmap }: RoadmapViewProps) {
  const t = useT("dashboard")
  const version = roadmap.currentVersion

  if (!version || version.stages.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">{t("roadmapNotFound")}</p>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          {t("roadmapReady")}
        </p>
        <h1 className="text-heading-md font-semibold text-foreground">{roadmap.goal}</h1>
      </header>
      {version.stages.map((stage) => (
        <RoadmapStageView key={stage.id} stage={stage} t={t} />
      ))}
    </div>
  )
}

export { RoadmapView, type RoadmapViewProps }