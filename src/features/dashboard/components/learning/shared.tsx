"use client"

import { AlertTriangle, Check, CircleAlert, ClipboardList, Clock, ExternalLink, Loader2, LogIn, Map as MapIcon } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { MetaItem, MetaList } from "@/shared/components/ui/MetaItem"
import { cn } from "@/lib/utils"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import type { Resource, Roadmap, TaskType } from "@/lib/api/types"
import type { LearnerRoadmapState } from "../../hooks/useLearnerRoadmap"
import type { TaskCompletionState } from "../../hooks/useTaskCompletion"
import { safeExternalUrl } from "../../lib/safeExternalUrl"
import { resourceHost } from "../../lib/learningItems"
import { TASK_TYPE_ICON } from "../../lib/typeIcons"
import { LinkButton, LiveMessage, PageState } from "../ui/workspace"

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
      return <div className="animate-fade-in space-y-6">{children(state.roadmap)}</div>
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

/** A task's type, time and "Optional", as plain text with small icons. */
export function TaskMeta({
  type,
  minutes,
  required = true,
  className,
}: {
  type: TaskType
  minutes: number
  required?: boolean
  className?: string
}) {
  const td = useT("dashboard")
  const t = useT("workspace")
  return (
    <MetaList className={className}>
      <MetaItem icon={TASK_TYPE_ICON[type]}>{td(`taskType.${type}`, type)}</MetaItem>
      {minutes > 0 && <MetaItem icon={Clock}>{td("taskMinutes", undefined, { count: minutes })}</MetaItem>}
      {!required && <span className="text-sm text-muted-foreground">{t("optional")}</span>}
    </MetaList>
  )
}

/**
 * Mark complete (contract §20). Offered only when the server's rules allow it
 * (the list pages derive them from the roadmap tree; the task page uses
 * `can_complete`). Pending state, one request at a time, errors as alerts.
 *
 * `circle` is the compact form for task lists: an outlined check that fills
 * like the completed mark on hover/focus (a 44px target around a 32px circle).
 */
export function MarkCompleteButton({
  taskId,
  canComplete,
  completion,
  size = "default",
  variant = "button",
  className,
}: {
  taskId: string
  canComplete: boolean
  completion: TaskCompletionState
  size?: "default" | "lg"
  variant?: "button" | "circle"
  className?: string
}) {
  const td = useT("dashboard")
  if (!canComplete) return null
  const pending = completion.pendingTaskId === taskId
  const error = completion.error?.taskId === taskId ? completion.error.kind : null
  const label = pending ? td("taskCompleting") : td("taskComplete")
  const disabled = completion.pendingTaskId !== null
  const onClick = () => void completion.complete(taskId)
  return (
    <span className={cn("flex flex-col items-stretch gap-1.5", className)}>
      {variant === "circle" ? (
        <button
          type="button"
          aria-label={label}
          title={label}
          disabled={disabled}
          aria-busy={pending || undefined}
          onClick={onClick}
          className="group/check inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 transition-colors duration-200 motion-reduce:transition-none",
              "group-focus-visible/check:ring-3 group-focus-visible/check:ring-ring/50",
              pending
                ? "border-status-completed bg-status-completed text-background"
                : "border-status-completed/35 bg-card text-status-completed/45 group-hover/check:border-status-completed group-hover/check:bg-status-completed group-hover/check:text-background group-focus-visible/check:border-status-completed group-focus-visible/check:bg-status-completed group-focus-visible/check:text-background group-disabled/check:opacity-50"
            )}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <Check className="size-4" strokeWidth={2.6} />
            )}
          </span>
        </button>
      ) : (
        <Button
          variant="primary"
          size={size}
          className={cn("min-h-11 px-4", size === "lg" && "min-h-12")}
          disabled={disabled}
          aria-busy={pending || undefined}
          onClick={onClick}
        >
          {label}
        </Button>
      )}
      {error && (
        <span role="alert" className="flex items-start gap-1.5 text-xs font-medium text-ink">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
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

/** The site a resource opens, optionally with its type: "Video · youtube.com". */
export function ResourceSource({ resource, showType = true }: { resource: Resource; showType?: boolean }) {
  const t = useT("workspace")
  const host = resourceHost(resource.url)
  const parts = [showType ? t(`resourceType.${resource.type}`, resource.type) : null, host].filter(Boolean)
  if (parts.length === 0) return null
  return (
    <span dir="auto" className="block text-[0.8125rem] text-muted-foreground">
      {parts.join(" · ")}
    </span>
  )
}

/**
 * An AI-found resource is untrusted: only an http(s) URL becomes a link, opened
 * in a new tab without an opener (spec 007 FR-017). The link is named after the
 * resource for assistive technology; otherwise "Link unavailable" is shown.
 */
export function ResourceOpenLink({
  resource,
  label,
  size = "md",
}: {
  resource: Resource
  label: string
  size?: "sm" | "md"
}) {
  const td = useT("dashboard")
  const href = safeExternalUrl(resource.url)
  if (!href) {
    return <span className="shrink-0 text-xs text-muted-foreground">{td("resourceLinkUnavailable")}</span>
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md border border-line bg-glass-strong font-semibold text-ink no-underline transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        size === "sm" ? "min-h-11 px-3 text-[0.8125rem] sm:min-h-9" : "min-h-11 px-4 text-sm"
      )}
    >
      {label}
      <span className="sr-only">
        {" "}
        <span dir="auto">{resource.title}</span> {td("resourceOpensNewTab")}
      </span>
      <ExternalLink className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </a>
  )
}
