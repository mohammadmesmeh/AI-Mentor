"use client"

import { AlertTriangle, ClipboardList, ExternalLink, LogIn, Map as MapIcon } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT, type TranslateFn } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import type { Resource, Roadmap } from "@/lib/api/types"
import type { LearnerRoadmapState } from "../../hooks/useLearnerRoadmap"
import type { TaskCompletionState } from "../../hooks/useTaskCompletion"
import type { TaskItem } from "../../lib/learningItems"
import { canCompleteTask } from "../../lib/roadmapProgress"
import { safeExternalUrl } from "../../lib/safeExternalUrl"
import { resourceHost } from "../../lib/learningItems"
import { taskIcon } from "../../lib/taskIcon"
import { LinkButton, LiveMessage, MetaChip, PageState, TaskStatusChip } from "../ui/workspace"

/**
 * Renders every non-ready state of a workspace page the same way — loading
 * (the page's own skeleton), signed out, onboarding unfinished, no roadmap,
 * error — and the page itself once the roadmap is there.
 */
export function RoadmapGate({
  state,
  skeleton,
  children,
}: {
  state: LearnerRoadmapState
  skeleton: React.ReactNode
  children: (roadmap: Roadmap) => React.ReactNode
}) {
  const t = useT("workspace")

  switch (state.status) {
    case "loading":
      return <>{skeleton}</>
    case "signed-out":
      return <SignedOutState />
    case "onboarding-incomplete":
      return (
        <PageState
          icon={ClipboardList}
          title={t("onboardingTitle")}
          description={t("onboardingDescription")}
          action={<LinkButton href="/onboarding">{t("continueOnboarding")}</LinkButton>}
        />
      )
    case "no-roadmap":
      return (
        <PageState
          icon={MapIcon}
          title={t("noRoadmapTitle")}
          description={t("noRoadmapDescription")}
          action={<LinkButton href={WORKSPACE_ROUTES.overview}>{t("goToOverview")}</LinkButton>}
        />
      )
    case "error":
      return <ErrorState onRetry={state.retry} />
    case "ready":
      return <div className="animate-fade-in space-y-8">{children(state.roadmap)}</div>
  }
}

export function SignedOutState() {
  const td = useT("dashboard")
  return (
    <PageState
      icon={LogIn}
      title={td("signedOutTitle")}
      description={td("signedOutDescription")}
      action={<LinkButton href="/auth">{td("signInAgain")}</LinkButton>}
    />
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT("workspace")
  return (
    <PageState
      role="alert"
      icon={AlertTriangle}
      tone="muted"
      title={t("errorTitle")}
      description={t("errorDescription")}
      action={
        <Button variant="primary" size="lg" className="min-h-11" onClick={onRetry}>
          {t("retry")}
        </Button>
      }
    />
  )
}

/** Duration + type + optional, as muted metadata. */
export function TaskMeta({
  type,
  minutes,
  required,
  className,
}: {
  type: TaskItem["task"]["type"]
  minutes: number
  required: boolean
  className?: string
}) {
  const td = useT("dashboard")
  const t = useT("workspace")
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      <span>{td(`taskType.${type}`, type)}</span>
      {minutes > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span>{td("taskMinutes", undefined, { count: minutes })}</span>
        </>
      )}
      {!required && (
        <>
          <span aria-hidden="true">·</span>
          <span>{t("optional")}</span>
        </>
      )}
    </span>
  )
}

/**
 * Mark complete (contract §20). Offered only when the server's rules allow it
 * (the list pages derive them from the roadmap tree; the task page uses
 * `can_complete`). Pending state, one request at a time, errors as alerts.
 */
export function MarkCompleteButton({
  taskId,
  canComplete,
  completion,
  className,
}: {
  taskId: string
  canComplete: boolean
  completion: TaskCompletionState
  className?: string
}) {
  const td = useT("dashboard")
  if (!canComplete) return null
  const pending = completion.pendingTaskId === taskId
  const error = completion.error?.taskId === taskId ? completion.error.kind : null
  return (
    <span className={cn("flex flex-col items-stretch gap-1 sm:items-end", className)}>
      <Button
        variant="primary"
        className="min-h-11 px-4"
        disabled={completion.pendingTaskId !== null}
        aria-busy={pending || undefined}
        onClick={() => void completion.complete(taskId)}
      >
        {pending ? td("taskCompleting") : td("taskComplete")}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-500">
          {td(error === "conflict" ? "taskCompleteConflict" : "taskCompleteFailed")}
        </span>
      )}
    </span>
  )
}

/** Announces the last completion result to screen readers. */
export function CompletionAnnouncer({ completion }: { completion: TaskCompletionState }) {
  const td = useT("dashboard")
  const message =
    completion.announcement === "completed"
      ? td("taskCompletedAnnouncement")
      : completion.announcement === "failed"
        ? td("taskCompleteFailed")
        : ""
  return <LiveMessage message={message} />
}

/** One task in a list (Roadmap and Tasks pages): title links to its page. */
export function TaskListRow({
  item,
  roadmap,
  completion,
  showStage = false,
}: {
  item: TaskItem
  roadmap: Roadmap
  completion: TaskCompletionState
  showStage?: boolean
}) {
  const t = useT("workspace")
  const { task, stage, status } = item
  const muted = status === "locked" || status === "upcoming"
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-5",
        status === "current" && "bg-accent-700/[0.04]"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
          status === "current"
            ? "bg-accent-700/10 text-accent-700 dark:text-accent-300"
            : muted
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary dark:text-primary-200"
        )}
      >
        {taskIcon(task.type, "h-5 w-5")}
      </span>
      <span className="min-w-0 flex-1 basis-48 space-y-1">
        <Link
          href={taskPath(task.id)}
          dir="auto"
          className={cn(
            "block rounded-sm font-medium wrap-break-word underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            muted ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {task.title}
        </Link>
        {showStage && (
          <span dir="auto" className="block text-xs text-muted-foreground wrap-break-word">
            {t("stageLabel", undefined, { position: stage.position, title: stage.title })}
          </span>
        )}
        <TaskMeta type={task.type} minutes={task.estimatedMinutes} required={task.isRequired} />
      </span>
      <span className="flex flex-wrap items-center gap-3 sm:justify-end">
        <TaskStatusChip status={status} label={t(`status.${status}`)} />
        <MarkCompleteButton
          taskId={task.id}
          canComplete={canCompleteTask(roadmap, task)}
          completion={completion}
        />
      </span>
    </li>
  )
}

/**
 * An AI-found resource is untrusted: only an http(s) URL becomes a link, opened
 * in a new tab without an opener (spec 007 FR-017). Shows its real type and
 * site so the learner knows what opens.
 */
export function ResourceLink({ resource, t }: { resource: Resource; t: TranslateFn }) {
  const td = useT("dashboard")
  const href = safeExternalUrl(resource.url)
  const host = resourceHost(resource.url)
  const typeLabel = t(`resourceType.${resource.type}`, resource.type)
  if (!href) {
    return (
      <span className="flex flex-col gap-1">
        <span dir="auto" className="font-medium text-muted-foreground wrap-break-word">
          {resource.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {typeLabel} · {td("resourceLinkUnavailable")}
        </span>
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-11 flex-col justify-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="inline-flex items-start gap-1.5 font-medium text-secondary-700 group-hover:underline underline-offset-4 dark:text-secondary-300">
        <span dir="auto" className="wrap-break-word">
          {resource.title}
        </span>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
        <span className="sr-only"> {td("resourceOpensNewTab")}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <MetaChip>{typeLabel}</MetaChip>
        {host && (
          <span dir="ltr" className="text-xs text-muted-foreground">
            {host}
          </span>
        )}
      </span>
    </a>
  )
}
