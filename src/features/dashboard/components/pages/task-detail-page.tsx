"use client"

import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { CircleCheck, FileQuestion, Lock, Map as MapIcon } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Card, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProgressBar } from "@/shared/components/ui/ProgressBar"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import type { RootState } from "@/redux/store"
import { useGetTaskQuery } from "@/lib/api/apiSlice"
import type { Roadmap, TaskDetail, TaskStatus } from "@/lib/api/types"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { findCurrentTask, orderedStages } from "../../lib/roadmapProgress"
import { taskItems, type TaskDisplayStatus, type TaskItem } from "../../lib/learningItems"
import { formatPercent } from "../../lib/format"
import { TASK_STATUS_STYLE } from "../../lib/statusStyles"
import { RESOURCE_TYPE_ICON } from "../../lib/typeIcons"
import {
  CompletionAnnouncer,
  ErrorState,
  MarkCompleteButton,
  ResourceOpenLink,
  ResourceSource,
  SignedOutState,
  TaskMeta,
} from "../learning/shared"
import {
  BackLink,
  CardSkeleton,
  IconBox,
  LinkButton,
  LoadingRegion,
  PageState,
  Skeleton,
  TaskStatusMark,
  WorkspaceCard,
} from "../ui/workspace"

/** The server's status, shown with the same vocabulary as the lists. */
function detailStatus(task: Pick<TaskDetail, "id" | "status" | "dependencies">, currentTaskId: string | null): TaskDisplayStatus {
  if (task.id === currentTaskId) return "current"
  switch (task.status) {
    case "available":
    case "current":
      return "available"
    case "upcoming":
      return task.dependencies.some((d) => d.status !== "completed") ? "locked" : "upcoming"
    default:
      return task.status
  }
}

function dependencyStatus(status: TaskStatus): TaskDisplayStatus {
  return status === "current" ? "available" : status === "upcoming" ? "upcoming" : status
}

/** The task after this one in roadmap order, from the roadmap the other pages cached. */
function nextTaskAfter(roadmap: Roadmap | null, taskId: string): TaskItem | null {
  if (!roadmap) return null
  const items = taskItems(roadmap).filter((item) => item.status !== "replaced")
  const index = items.findIndex((item) => item.task.id === taskId)
  return index >= 0 ? (items[index + 1] ?? null) : null
}

function TaskDetailPage({ taskId }: { taskId: string }) {
  const t = useT("workspace")
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const query = useGetTaskQuery(authenticated ? taskId : skipToken)
  const completion = useTaskCompletion()
  // "Up next" and the next task come from the roadmap the other pages already cached.
  const learner = useLearnerRoadmap()
  const roadmap = learner.status === "ready" ? learner.roadmap : null
  const currentTaskId = roadmap ? (findCurrentTask(orderedStages(roadmap.currentVersion))?.task.id ?? null) : null

  if (restoring || (authenticated && query.isLoading)) return <TaskDetailSkeleton />
  if (!authenticated) return <SignedOutState />
  if (query.isError) {
    const code = (query.error as { code?: string } | undefined)?.code
    if (code === "task_not_found") {
      return (
        <PageState
          icon={FileQuestion}
          tone="muted"
          title={t("taskNotFoundTitle")}
          description={t("taskNotFoundDescription")}
          action={<LinkButton href={WORKSPACE_ROUTES.tasks}>{t("backToTasks")}</LinkButton>}
        />
      )
    }
    return <ErrorState onRetry={() => void query.refetch()} />
  }
  if (!query.data) return <TaskDetailSkeleton />
  return (
    <TaskDetailContent
      task={query.data}
      completion={completion}
      status={detailStatus(query.data, currentTaskId)}
      next={nextTaskAfter(roadmap, query.data.id)}
    />
  )
}

function TaskDetailContent({
  task,
  completion,
  status,
  next,
}: {
  task: TaskDetail
  completion: TaskCompletionState
  status: TaskDisplayStatus
  next: TaskItem | null
}) {
  const t = useT("workspace")
  const style = TASK_STATUS_STYLE[status]
  const resources = [...task.resources].sort((a, b) => a.position - b.position)

  return (
    <div className="animate-fade-in grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <BackLink href={WORKSPACE_ROUTES.tasks} label={t("backToTasks")} />

        <Card variant="glass" className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatusDot tone={style.tone} label={t(style.labelKey)} />
            <span dir="auto" className="text-xs font-semibold text-muted-foreground">
              {t("stageLabel", undefined, { position: task.stage.position, title: task.stage.title })}
            </span>
          </div>
          <h1
            dir="auto"
            className="m-0 wrap-break-word font-display text-[1.75rem] leading-snug font-extrabold text-ink sm:text-[2.125rem]"
          >
            {task.title}
          </h1>
          <TaskMeta type={task.type} minutes={task.estimatedMinutes} required={task.isRequired} />
        </Card>

        <WorkspaceCard titleId="task-instructions" title={t("instructionsTitle")}>
          {task.instructions.trim() ? (
            <p dir="auto" className="m-0 whitespace-pre-line leading-relaxed wrap-break-word text-foreground">
              {task.instructions}
            </p>
          ) : (
            <p className="m-0 text-muted-foreground">{t("noInstructions")}</p>
          )}
        </WorkspaceCard>

        <WorkspaceCard titleId="task-resources" title={t("resourcesTitle")}>
          {resources.length === 0 ? (
            <p className="m-0 text-muted-foreground">{t("noTaskResources")}</p>
          ) : (
            <ul className="m-0 list-none space-y-3 p-0">
              {resources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-icon border border-line p-4"
                >
                  <IconBox icon={RESOURCE_TYPE_ICON[resource.type]} tone={resource.type === "video" ? "navy" : "soft"} />
                  <div className="min-w-0 flex-1 basis-40">
                    <p dir="auto" className="m-0 font-semibold wrap-break-word text-ink">
                      {resource.title}
                    </p>
                    <ResourceSource resource={resource} />
                  </div>
                  <ResourceOpenLink resource={resource} label={t("openResource")} />
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>
      </div>

      <aside className="flex flex-col gap-5 lg:pt-16">
        <StatusCard task={task} status={status} completion={completion} />
        {next && <NextTaskCard next={next} />}
        {task.dependencies.length > 0 && (
          <WorkspaceCard titleId="task-dependencies" title={t("dependenciesTitle")}>
            <ul className="m-0 list-none space-y-1 p-0">
              {task.dependencies.map((dep) => {
                const depStyle = TASK_STATUS_STYLE[dependencyStatus(dep.status)]
                return (
                  <li key={dep.id} className="flex flex-wrap items-center justify-between gap-x-3">
                    <Link
                      href={taskPath(dep.id)}
                      dir="auto"
                      className="inline-flex min-h-11 min-w-0 items-center rounded-md text-sm font-semibold text-ink no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="wrap-break-word">{dep.title}</span>
                    </Link>
                    <StatusDot tone={depStyle.tone} label={t(depStyle.labelKey)} />
                  </li>
                )
              })}
            </ul>
          </WorkspaceCard>
        )}
      </aside>
      <CompletionAnnouncer completion={completion} />
    </div>
  )
}

/** Status, stage, time and the page's main action (§19 can_complete). */
function StatusCard({
  task,
  status,
  completion,
}: {
  task: TaskDetail
  status: TaskDisplayStatus
  completion: TaskCompletionState
}) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()
  const style = TASK_STATUS_STYLE[status]
  const row = "flex items-baseline justify-between gap-4"

  return (
    <WorkspaceCard titleId="task-status-heading" title={t("taskStatusTitle")}>
      <dl className="m-0 flex flex-col gap-3 text-sm">
        <div className={row}>
          <dt className="text-muted-foreground">{t("columnStatus")}</dt>
          <dd className="m-0">
            <StatusDot tone={style.tone} label={t(style.labelKey)} />
          </dd>
        </div>
        <div className={row}>
          <dt className="shrink-0 text-muted-foreground">{t("columnStage")}</dt>
          <dd dir="auto" className="m-0 text-end font-semibold wrap-break-word text-ink">
            {task.stage.title}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted-foreground">{t("stageProgressLabel")}</dt>
          <dd className="m-0 font-semibold text-ink">
            {t("stageTasksProgress", undefined, {
              done: task.stage.progress.completedTasks,
              total: task.stage.progress.totalTasks,
            })}
          </dd>
        </div>
        {task.estimatedMinutes > 0 && (
          <div className={row}>
            <dt className="text-muted-foreground">{t("expectedTime")}</dt>
            <dd className="m-0 font-semibold text-ink">
              {td("taskMinutes", undefined, { count: task.estimatedMinutes })}
            </dd>
          </div>
        )}
      </dl>

      <Separator className="my-4 bg-line" />
      <div className="space-y-2">
        <Link
          href={WORKSPACE_ROUTES.roadmap}
          dir="auto"
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-secondary-700 no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
        >
          <MapIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="wrap-break-word">{task.roadmap.goal}</span>
        </Link>
        <ProgressBar
          value={task.roadmap.progress.percentage}
          size="sm"
          label={td("progressBarLabel")}
          valueText={formatPercent(locale, task.roadmap.progress.percentage)}
        />
      </div>

      <div className="mt-5">
        <CompletionAction task={task} completion={completion} />
      </div>
    </WorkspaceCard>
  )
}

function CompletionAction({ task, completion }: { task: TaskDetail; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()

  if (task.status === "completed") {
    const date = task.completedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(task.completedAt))
      : null
    return (
      <div className="flex items-start gap-3 rounded-icon bg-secondary-100/60 p-4 dark:bg-secondary-300/10">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-status-completed" aria-hidden="true" />
        <div className="space-y-0.5">
          <h3 className="m-0 font-sans text-sm font-semibold text-ink">{t("taskDoneTitle")}</h3>
          <p className="m-0 text-[0.8125rem] text-muted-foreground">
            {date ? t("completedOn", undefined, { date }) : t("taskDoneHint")}
          </p>
        </div>
      </div>
    )
  }

  if (task.canComplete) {
    return (
      <div className="space-y-3">
        <MarkCompleteButton taskId={task.id} canComplete completion={completion} size="lg" />
        <p className="m-0 text-[0.8125rem] text-muted-foreground">{t("markCompleteHint")}</p>
      </div>
    )
  }

  return (
    <p className="m-0 flex items-start gap-2.5 rounded-icon bg-segment p-4 text-[0.8125rem] text-muted-foreground">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {task.roadmap.active ? td("taskCompleteLocked") : td("taskCompleteNeedsActive")}
    </p>
  )
}

function NextTaskCard({ next }: { next: TaskItem }) {
  const t = useT("workspace")
  const style = TASK_STATUS_STYLE[next.status]
  const waiting = next.status === "locked" || next.status === "upcoming"
  return (
    <Card as="section" variant="glass" aria-labelledby="next-task-heading" className="flex flex-col gap-3 p-5">
      <CardTitle as="h2" id="next-task-heading" className="text-[0.8125rem] font-bold text-muted-foreground sm:text-[0.8125rem]">
        {t("nextTaskTitle")}
      </CardTitle>
      <div className="flex items-center gap-3">
        <TaskStatusMark status={next.status} label={t(style.labelKey)} size="sm" />
        <div className="min-w-0">
          <Link
            href={taskPath(next.task.id)}
            dir="auto"
            className="block rounded-sm text-sm font-semibold wrap-break-word text-ink no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {next.task.title}
          </Link>
          <p className="m-0 text-xs text-muted-foreground">{waiting ? t("nextTaskUnlocks") : t(style.labelKey)}</p>
        </div>
      </div>
    </Card>
  )
}

function TaskDetailSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21.25rem]">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-11 w-32" />
          <CardSkeleton className="space-y-4 sm:p-7">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-96 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </CardSkeleton>
          <CardSkeleton className="h-40" />
          <CardSkeleton className="h-36" />
        </div>
        <div className="flex flex-col gap-5 lg:pt-16">
          <CardSkeleton className="h-96" />
          <CardSkeleton className="h-28" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export { TaskDetailPage }
