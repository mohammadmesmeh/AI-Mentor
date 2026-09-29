"use client"

import { useCallback, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import { useCompleteTaskMutation, useGetLearningProfileQuery } from "@/lib/api/apiSlice"
import type { Roadmap } from "@/lib/api/types"
import { asApiError } from "@/lib/api/errors"
import { OnboardingIncomplete } from "@/features/onboarding/components/OnboardingIncomplete"
import { useDashboardRoadmap } from "../../hooks/useDashboardRoadmap"
import { findCurrentTask, focusTasks, orderedStages, roadmapProgress } from "../../lib/roadmapProgress"
import { RoadmapView, type TaskCompletion } from "../RoadmapView"
import { RoadmapGenerationFailure } from "../RoadmapGenerationFailure"
import { RoadmapGenerating } from "../RoadmapGenerating"
import { WelcomeSection } from "../sections/WelcomeSection"
import { ContinueLearningSection } from "../sections/ContinueLearningSection"
import { ProgressSection } from "../sections/ProgressSection"
import { TodayFocusSection } from "../sections/TodayFocusSection"
import { MentorInsightSection } from "../sections/MentorInsightSection"
import { RecentActivitySection } from "../sections/RecentActivitySection"

/** Centered title + description + one action, shared by the non-workspace states. */
function DashboardNotice({
  title,
  description,
  actionLabel,
  onAction,
  href,
}: {
  title: string
  description: string
  actionLabel: string
  onAction?: () => void
  href?: string
}) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-2 text-heading-md font-semibold text-foreground">{title}</h1>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <Button variant="primary" onClick={onAction} href={href}>
        {actionLabel}
      </Button>
    </div>
  )
}

function DashboardPage() {
  const t = useT("dashboard")
  const {
    view,
    generate,
    retryGeneration,
    checkAgain,
    retryLoad,
    refetchRoadmap,
    retryActivation,
    pinRoadmap,
  } = useDashboardRoadmap()

  switch (view.view) {
    case "signed-out":
      // Tokens live only in memory (FR-007): a reload or a typed URL starts
      // without a session, so ask for sign-in instead of firing calls that 401.
      return (
        <DashboardNotice
          title={t("signedOutTitle")}
          description={t("signedOutDescription")}
          actionLabel={t("signInAgain")}
          href="/auth"
        />
      )
    case "loading":
      return (
        <div className="py-16 text-center text-muted-foreground" aria-live="polite">
          {t("loadingWorkspace")}
        </div>
      )
    case "onboarding-incomplete":
      return <OnboardingIncomplete missingFields={view.missingFields} />
    case "start":
      return (
        <DashboardNotice
          title={t("roadmapGenerationTitle")}
          description={t("roadmapGenerationDescription")}
          actionLabel={t("generateRoadmap")}
          onAction={generate}
        />
      )
    case "start-error":
      return (
        <RoadmapGenerationFailure
          failureCode={null}
          messageKey={
            view.reason === "rate_limited"
              ? "startErrorRateLimited"
              : view.reason === "unavailable"
                ? "startErrorUnavailable"
                : undefined
          }
          onRetry={retryGeneration}
        />
      )
    case "failed":
      return <RoadmapGenerationFailure failureCode={view.failureCode} onRetry={retryGeneration} />
    case "generating":
    case "timed-out":
      return (
        <RoadmapGenerating timedOut={view.view === "timed-out"} onCheckAgain={checkAgain} />
      )
    case "roadmap-not-ready":
      return (
        <DashboardNotice
          title={t("roadmapNotReadyTitle")}
          description={t("roadmapNotReadyDescription")}
          actionLabel={t("checkAgain")}
          onAction={refetchRoadmap}
        />
      )
    case "roadmap-inactive":
      return (
        <DashboardNotice
          title={t("roadmapInactiveTitle")}
          description={t("roadmapInactiveDescription")}
          actionLabel={t("generateRoadmap")}
          onAction={retryGeneration}
        />
      )
    case "activating":
      return (
        <div className="mx-auto max-w-md py-16 text-center" aria-live="polite">
          <h1 className="mb-2 text-heading-md font-semibold text-foreground">{t("activatingTitle")}</h1>
          <p className="text-muted-foreground">{t("activatingDescription")}</p>
        </div>
      )
    case "activation-failed":
      return (
        <div role="alert">
          <DashboardNotice
            title={t("activationFailedTitle")}
            description={t(view.conflict ? "activationConflictDescription" : "activationFailedDescription")}
            actionLabel={t("retryActivation")}
            onAction={retryActivation}
          />
        </div>
      )
    case "load-error":
      return (
        <DashboardNotice
          title={t("dashboardLoadErrorTitle")}
          description={t("dashboardLoadErrorDescription")}
          actionLabel={t("retryLoad")}
          onAction={retryLoad}
        />
      )
    case "ready":
      return (
        <DashboardWorkspace
          roadmap={view.roadmap}
          onRoadmapUpdated={pinRoadmap}
          onStale={refetchRoadmap}
        />
      )
  }
}

/**
 * spec 007 FR-015 order: greeting (the page's only h1) → Continue Learning →
 * Today's Focus / Progress grid → the full roadmap, whose stage titles are the
 * only visible stage listing.
 */
function DashboardWorkspace({
  roadmap,
  onRoadmapUpdated,
  onStale,
}: {
  roadmap: Roadmap
  /** Called with the roadmap id the server returned after a completion. */
  onRoadmapUpdated: (roadmapId: string) => void
  /** Called when the server says the tree on screen is out of date (409). */
  onStale: () => void
}) {
  const t = useT("dashboard")
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)
  const { data: profile } = useGetLearningProfileQuery()

  const { current, focus, progress } = useMemo(() => {
    const stages = orderedStages(roadmap.currentVersion)
    return {
      current: findCurrentTask(stages),
      focus: focusTasks(stages),
      progress: roadmapProgress(stages, roadmap.progress),
    }
  }, [roadmap])

  // Contract §20: the server re-checks eligibility and returns the updated
  // roadmap, which the mutation writes into the cache — the page only shows it.
  const [completeTask] = useCompleteTaskMutation()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [completionError, setCompletionError] = useState<TaskCompletion["error"]>(null)
  const [announcement, setAnnouncement] = useState("")

  const onComplete = useCallback(
    async (taskId: string) => {
      if (pendingTaskId) return
      setPendingTaskId(taskId)
      setCompletionError(null)
      setAnnouncement("")
      try {
        const updated = await completeTask(taskId).unwrap()
        onRoadmapUpdated(updated.id)
        setAnnouncement(t("taskCompletedAnnouncement"))
      } catch (error) {
        const conflict = asApiError(error).code === "task_completion_conflict"
        setCompletionError({ taskId, kind: conflict ? "conflict" : "failed" })
        // The tree on screen disagrees with the server — re-read it.
        if (conflict) onStale()
      } finally {
        setPendingTaskId(null)
      }
    },
    [pendingTaskId, completeTask, onRoadmapUpdated, onStale, t]
  )

  return (
    <div className="space-y-8">
      <WelcomeSection learnerName={learnerName} learningGoal={profile?.goal} />
      <ContinueLearningSection current={current} allCompleted={progress.allCompleted} />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <TodayFocusSection tasks={focus} />
          <MentorInsightSection status="unavailable" />
        </div>
        <div className="space-y-6 md:col-span-2">
          <ProgressSection progress={progress} />
          <RecentActivitySection status="unavailable" />
        </div>
      </div>
      <RoadmapView
        roadmap={roadmap}
        completion={{ pendingTaskId, error: completionError, onComplete: (id) => void onComplete(id) }}
      />
      <span className="sr-only">{t("roadmapReady")}</span>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export { DashboardPage }
