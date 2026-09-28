"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import { AlertTriangle, Hourglass, Map as MapIcon, RefreshCw, Sparkles } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import { useGetLearningProfileQuery } from "@/lib/api/apiSlice"
import type { Roadmap } from "@/lib/api/types"
import { OnboardingIncomplete } from "@/features/onboarding/components/OnboardingIncomplete"
import { useDashboardRoadmap } from "../../hooks/useDashboardRoadmap"
import { findCurrentTask, focusTasks, orderedStages, roadmapProgress } from "../../lib/roadmapProgress"
import { RoadmapGenerationFailure } from "../RoadmapGenerationFailure"
import { RoadmapGenerating } from "../RoadmapGenerating"
import { WelcomeSection } from "../sections/WelcomeSection"
import { ContinueLearningSection } from "../sections/ContinueLearningSection"
import { ProgressSection } from "../sections/ProgressSection"
import { TodayFocusSection } from "../sections/TodayFocusSection"
import { MentorInsightSection } from "../sections/MentorInsightSection"
import { RecentActivitySection } from "../sections/RecentActivitySection"
import { SignedOutState } from "../learning/shared"
import { LoadingRegion, PageState, Skeleton } from "../ui/workspace"

/** One primary action for a full-page state (a real <button>, 44px tall). */
function StateAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="primary" size="lg" className="min-h-11" onClick={onClick}>
      {label}
    </Button>
  )
}

function DashboardPage() {
  const t = useT("dashboard")
  const { view, generate, retryGeneration, checkAgain, retryLoad, refetchRoadmap, retryActivation } =
    useDashboardRoadmap()

  switch (view.view) {
    case "signed-out":
      return <SignedOutState />
    case "loading":
      return <OverviewSkeleton />
    case "onboarding-incomplete":
      return <OnboardingIncomplete missingFields={view.missingFields} />
    case "start":
      return (
        <PageState
          icon={Sparkles}
          title={t("roadmapGenerationTitle")}
          description={t("roadmapGenerationDescription")}
          action={<StateAction label={t("generateRoadmap")} onClick={generate} />}
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
      return <RoadmapGenerating timedOut={view.view === "timed-out"} onCheckAgain={checkAgain} />
    case "roadmap-not-ready":
      return (
        <PageState
          icon={Hourglass}
          title={t("roadmapNotReadyTitle")}
          description={t("roadmapNotReadyDescription")}
          action={<StateAction label={t("checkAgain")} onClick={refetchRoadmap} />}
        />
      )
    case "roadmap-inactive":
      return (
        <PageState
          icon={MapIcon}
          tone="muted"
          title={t("roadmapInactiveTitle")}
          description={t("roadmapInactiveDescription")}
          action={<StateAction label={t("generateRoadmap")} onClick={retryGeneration} />}
        />
      )
    case "activating":
      return (
        <PageState role="status" icon={RefreshCw} title={t("activatingTitle")} description={t("activatingDescription")} />
      )
    case "activation-failed":
      return (
        <PageState
          role="alert"
          icon={AlertTriangle}
          tone="muted"
          title={t("activationFailedTitle")}
          description={t(view.conflict ? "activationConflictDescription" : "activationFailedDescription")}
          action={<StateAction label={t("retryActivation")} onClick={retryActivation} />}
        />
      )
    case "load-error":
      return (
        <PageState
          role="alert"
          icon={AlertTriangle}
          tone="muted"
          title={t("dashboardLoadErrorTitle")}
          description={t("dashboardLoadErrorDescription")}
          action={<StateAction label={t("retryLoad")} onClick={retryLoad} />}
        />
      )
    case "ready":
      return <Overview roadmap={view.roadmap} />
  }
}

/**
 * The Overview: greeting (the page's only h1) → Continue learning (the main
 * action) → Today's focus / Progress → insight and activity. The full roadmap
 * lives on its own page (/roadmap), linked from Progress.
 */
function Overview({ roadmap }: { roadmap: Roadmap }) {
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

  return (
    <div className="animate-fade-in space-y-8">
      <WelcomeSection learnerName={learnerName} learningGoal={profile?.goal ?? roadmap.goal} />
      <ContinueLearningSection current={current} allCompleted={progress.allCompleted} />
      {/* Flat grid: on phones Progress comes right after Today's focus. */}
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TodayFocusSection tasks={focus} />
        </div>
        <div className="lg:col-span-2">
          <ProgressSection progress={progress} />
        </div>
        <div className="lg:col-span-3">
          <MentorInsightSection />
        </div>
        <div className="lg:col-span-2">
          <RecentActivitySection />
        </div>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-56 max-w-full" />
      </div>
      <Skeleton className="h-44 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export { DashboardPage, OverviewSkeleton }
