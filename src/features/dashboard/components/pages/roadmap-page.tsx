"use client"

import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Card, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/shared/components/ui/ProgressBar"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import { toneBox } from "@/shared/components/ui/status-tone"
import { cn } from "@/lib/utils"
import { taskPath } from "@/lib/workspaceRoutes"
import type { Roadmap, RoadmapStage } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { taskItems, type TaskItem } from "../../lib/learningItems"
import { canCompleteTask, orderedStages, roadmapProgress } from "../../lib/roadmapProgress"
import { formatPercent } from "../../lib/format"
import { STAGE_STATUS_STYLE, TASK_STATUS_STYLE } from "../../lib/statusStyles"
import { CompletionAnnouncer, MarkCompleteButton, RoadmapGate } from "../learning/shared"
import { CardSkeleton, LoadingRegion, Skeleton, TaskStatusMark } from "../ui/workspace"

function RoadmapPage() {
  const state = useLearnerRoadmap()
  const completion = useTaskCompletion()
  return (
    <RoadmapGate state={state} skeleton={<RoadmapSkeleton />}>
      {(roadmap) => <RoadmapContent roadmap={roadmap} completion={completion} />}
    </RoadmapGate>
  )
}

function RoadmapContent({ roadmap, completion }: { roadmap: Roadmap; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const locale = useLocale()
  const stages = orderedStages(roadmap.currentVersion)
  const progress = roadmapProgress(stages, roadmap.progress)
  const items = taskItems(roadmap)
  const percent = formatPercent(locale, progress.percent)
  const summary = [
    t("stageCount", undefined, { count: stages.length }),
    t("taskCount", undefined, { count: items.length }),
    ...(roadmap.status === "completed" ? [t("roadmapCompleted")] : []),
  ].join(" · ")

  return (
    <>
      <Card variant="glass" className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1
            dir="auto"
            className="m-0 wrap-break-word font-display text-[1.75rem] leading-snug font-extrabold text-ink sm:text-[2.125rem]"
          >
            {roadmap.goal}
          </h1>
          <p className="m-0 text-sm text-muted-foreground">{summary}</p>
        </div>
        <div className="w-full space-y-2 lg:w-85">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">
              {t("roadmapSummary", undefined, { done: progress.completedTasks, total: progress.countedTasks })}
            </span>
            <span className="font-bold tabular-nums text-ink">{percent}</span>
          </div>
          <ProgressBar value={progress.percent} label={t("statOverall")} valueText={percent} />
        </div>
      </Card>

      <ol className="m-0 list-none space-y-5 p-0">
        {stages.map((stage) => (
          <li key={stage.id}>
            <StageCard
              stage={stage}
              items={items.filter((item) => item.stage.id === stage.id)}
              roadmap={roadmap}
              completion={completion}
            />
          </li>
        ))}
      </ol>
      <CompletionAnnouncer completion={completion} />
    </>
  )
}

function StageCard({
  stage,
  items,
  roadmap,
  completion,
}: {
  stage: RoadmapStage
  items: TaskItem[]
  roadmap: Roadmap
  completion: TaskCompletionState
}) {
  const t = useT("workspace")
  const headingId = `stage-${stage.id}`
  const style = STAGE_STATUS_STYLE[stage.status]
  const done = stage.progress?.completedTasks ?? items.filter((item) => item.status === "completed").length
  const total = stage.progress?.totalTasks ?? items.length
  const stagePercent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <Card
      as="section"
      variant="glass"
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-3 px-4 py-5 sm:px-6", stage.status === "active" && "outline-2 -outline-offset-1 outline-status-current")}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span
          aria-hidden="true"
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-icon font-extrabold", toneBox[style.tone])}
        >
          {stage.position}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <CardTitle as="h2" id={headingId} dir="auto" className="wrap-break-word">
            {stage.title}
          </CardTitle>
          <p className="m-0 text-[0.8125rem] text-muted-foreground">
            {t("stageTasksProgress", undefined, { done, total })}
          </p>
        </div>
        <ProgressBar
          value={stagePercent}
          size="sm"
          label={stage.title}
          tone={style.tone}
          className="hidden w-44 md:flex"
        />
        <StatusDot tone={style.tone} label={t(style.labelKey)} />
      </div>
      {stage.description && (
        <p dir="auto" className="m-0 text-sm wrap-break-word text-muted-foreground">
          {stage.description}
        </p>
      )}
      <ul className="m-0 list-none space-y-0.5 p-0">
        {items.map((item) => (
          <StageTaskRow key={item.task.id} item={item} roadmap={roadmap} completion={completion} />
        ))}
      </ul>
    </Card>
  )
}

/** One task in a stage: status mark, title linking to its page, type · time, Mark complete. */
function StageTaskRow({ item, roadmap, completion }: { item: TaskItem; roadmap: Roadmap; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const { task, status } = item
  const muted = status !== "current" && status !== "available"
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-icon px-3 py-2.5 sm:px-3.5",
        status === "current" && "bg-status-current/6"
      )}
    >
      <TaskStatusMark status={status} label={t(TASK_STATUS_STYLE[status].labelKey)} size="sm" />
      <Link
        href={taskPath(task.id)}
        dir="auto"
        className={cn(
          "min-w-0 flex-1 basis-40 rounded-sm text-sm font-semibold wrap-break-word no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          muted ? "text-muted-foreground" : "text-ink"
        )}
      >
        {task.title}
      </Link>
      <span className="text-[0.8125rem] text-muted-foreground">
        {td(`taskType.${task.type}`, task.type)}
        {task.estimatedMinutes > 0 && ` · ${td("taskMinutes", undefined, { count: task.estimatedMinutes })}`}
        {!task.isRequired && ` · ${t("optional")}`}
      </span>
      <MarkCompleteButton
        taskId={task.id}
        canComplete={canCompleteTask(roadmap, task)}
        completion={completion}
        variant="circle"
      />
    </li>
  )
}

function RoadmapSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <CardSkeleton className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="w-full space-y-2 lg:w-85">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </CardSkeleton>
      {[0, 1].map((i) => (
        <CardSkeleton key={i} className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-icon" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-56 max-w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {[0, 1, 2].map((j) => (
            <Skeleton key={j} className="h-11 w-full rounded-icon opacity-60" />
          ))}
        </CardSkeleton>
      ))}
    </LoadingRegion>
  )
}

export { RoadmapPage }
