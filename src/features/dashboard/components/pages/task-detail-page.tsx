"use client"

import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { CheckCircle2, FileQuestion, Library, ListChecks, Lock, Map as MapIcon } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import type { RootState } from "@/redux/store"
import { useGetTaskQuery } from "@/lib/api/apiSlice"
import type { TaskDetail, TaskStatus } from "@/lib/api/types"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { findCurrentTask, orderedStages } from "../../lib/roadmapProgress"
import type { TaskDisplayStatus } from "../../lib/learningItems"
import {
  CompletionAnnouncer,
  ErrorState,
  MarkCompleteButton,
  ResourceLink,
  SignedOutState,
  TaskMeta,
} from "../learning/shared"
import {
  BackLink,
  IconBox,
  LinkButton,
  LoadingRegion,
  PageHeader,
  PageState,
  Panel,
  PanelHeader,
  Skeleton,
  TaskStatusChip,
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

function TaskDetailPage({ taskId }: { taskId: string }) {
  const t = useT("workspace")
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const query = useGetTaskQuery(authenticated ? taskId : skipToken)
  const completion = useTaskCompletion()
  // "Up next" comes from the roadmap the other pages already cached.
  const learner = useLearnerRoadmap()
  const currentTaskId =
    learner.status === "ready" ? findCurrentTask(orderedStages(learner.roadmap.currentVersion))?.task.id ?? null : null

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
  return <TaskDetailContent task={query.data} completion={completion} currentTaskId={currentTaskId} />
}

function TaskDetailContent({
  task,
  completion,
  currentTaskId,
}: {
  task: TaskDetail
  completion: TaskCompletionState
  currentTaskId: string | null
}) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()
  const status = detailStatus(task, currentTaskId)
  const percent = (value: number) => new Intl.NumberFormat(locale, { style: "percent" }).format(value / 100)

  return (
    <div className="animate-fade-in space-y-6">
      <BackLink href={WORKSPACE_ROUTES.tasks} label={t("backToTasks")} />
      <PageHeader eyebrow={t("taskEyebrow")} title={task.title} titleDir="auto" />
      <div className="flex flex-wrap items-center gap-3">
        <TaskStatusChip status={status} label={t(`status.${status}`)} />
        <TaskMeta type={task.type} minutes={task.estimatedMinutes} required={task.isRequired} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel aria-labelledby="task-instructions">
            <PanelHeader id="task-instructions" icon={ListChecks} title={t("instructionsTitle")} />
            <div className="p-5">
              {task.instructions.trim() ? (
                <p dir="auto" className="whitespace-pre-line leading-relaxed text-foreground wrap-break-word">
                  {task.instructions}
                </p>
              ) : (
                <p className="text-muted-foreground">{t("noInstructions")}</p>
              )}
            </div>
          </Panel>

          <Panel aria-labelledby="task-resources">
            <PanelHeader id="task-resources" icon={Library} title={t("resourcesTitle")} />
            {task.resources.length === 0 ? (
              <p className="p-5 text-muted-foreground">{t("noTaskResources")}</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {[...task.resources]
                  .sort((a, b) => a.position - b.position)
                  .map((resource) => (
                    <li key={resource.id} className="px-5 py-3">
                      <ResourceLink resource={resource} t={t} />
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <CompletionPanel task={task} completion={completion} />

          <Panel aria-labelledby="task-part-of" className="space-y-4 p-5">
            <h2 id="task-part-of" className="font-display text-heading-sm font-semibold text-foreground">
              {t("partOf")}
            </h2>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("stageHeading", undefined, { position: task.stage.position })}
              </p>
              <p dir="auto" className="font-medium text-foreground wrap-break-word">
                {task.stage.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("stageTasksProgress", undefined, {
                  done: task.stage.progress.completedTasks,
                  total: task.stage.progress.totalTasks,
                })}
              </p>
            </div>
            <div className="space-y-2 border-t border-border/50 pt-4">
              <Link
                href={WORKSPACE_ROUTES.roadmap}
                dir="auto"
                className="inline-flex min-h-11 items-center gap-2 rounded-md font-medium text-secondary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
              >
                <MapIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="wrap-break-word">{task.roadmap.goal}</span>
              </Link>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={task.roadmap.progress.percentage}
                aria-valuetext={percent(task.roadmap.progress.percentage)}
                aria-label={td("progressBarLabel")}
              >
                <div className="progress-fill" style={{ width: `${task.roadmap.progress.percentage}%` }} />
              </div>
            </div>
          </Panel>

          {task.dependencies.length > 0 && (
            <Panel aria-labelledby="task-dependencies" className="p-5">
              <h2 id="task-dependencies" className="mb-3 font-display text-heading-sm font-semibold text-foreground">
                {t("dependenciesTitle")}
              </h2>
              <ul className="space-y-2">
                {task.dependencies.map((dep) => {
                  const depStatus = dependencyStatus(dep.status)
                  return (
                    <li key={dep.id} className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={taskPath(dep.id)}
                        dir="auto"
                        className="inline-flex min-h-11 min-w-0 items-center rounded-md text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="wrap-break-word">{dep.title}</span>
                      </Link>
                      <TaskStatusChip status={depStatus} label={t(`status.${depStatus}`)} />
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}
        </div>
      </div>
      <CompletionAnnouncer completion={completion} />
    </div>
  )
}

/** The page's main action: Mark complete when the server says it can be (§19 can_complete). */
function CompletionPanel({ task, completion }: { task: TaskDetail; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()

  if (task.status === "completed") {
    const date = task.completedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(task.completedAt))
      : null
    return (
      <Panel className="flex items-start gap-3 p-5">
        <IconBox icon={CheckCircle2} tone="success" />
        <div className="space-y-1">
          <h2 className="font-display text-heading-sm font-semibold text-foreground">{t("taskDoneTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {date ? t("completedOn", undefined, { date }) : t("taskDoneHint")}
          </p>
        </div>
      </Panel>
    )
  }

  if (task.canComplete) {
    return (
      <Panel className="space-y-4 p-5">
        <div className="space-y-1">
          <h2 className="font-display text-heading-sm font-semibold text-foreground">{t("markCompleteTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("markCompleteHint")}</p>
        </div>
        <MarkCompleteButton taskId={task.id} canComplete completion={completion} className="sm:items-stretch" />
      </Panel>
    )
  }

  return (
    <Panel className="flex items-start gap-3 p-5">
      <IconBox icon={Lock} tone="muted" />
      <p className="pt-2 text-sm text-muted-foreground">
        {task.roadmap.active ? td("taskCompleteLocked") : td("taskCompleteNeedsActive")}
      </p>
    </Panel>
  )
}

function TaskDetailSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-96 max-w-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-40 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export { TaskDetailPage }
