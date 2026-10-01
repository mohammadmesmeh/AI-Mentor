"use client"

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
import { progressStats } from "../../lib/progressStats"
import { resourceItems } from "../../lib/learningItems"
import { RoadmapGenerationFailure } from "../RoadmapGenerationFailure"
import { RoadmapGenerating } from "../RoadmapGenerating"
import { WelcomeSection } from "../sections/WelcomeSection"
import { ContinueLearningSection } from "../sections/ContinueLearningSection"
import { PlanStagesSection } from "../sections/PlanStagesSection"
import { OverviewStats } from "../sections/OverviewStats"
import { TodayFocusSection } from "../sections/TodayFocusSection"
import { MentorInsightSection } from "../sections/MentorInsightSection"
import { SignedOutState } from "../learning/shared"
import { CardSkeleton, LoadingRegion, PageState, Skeleton } from "../ui/workspace"
import { StatCardSkeleton } from "../ui/StatCard"

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
 * The Overview: greeting (the page's only h1) → key figures → Continue
 * learning (the main action) and Today's focus → plan stages and the mentor
 * card. Everything comes from the cached roadmap and learning profile.
 */
function Overview({ roadmap }: { roadmap: Roadmap }) {
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)
  const { data: profile } = useGetLearningProfileQuery()
  const stages = orderedStages(roadmap.currentVersion)
  const summary = roadmapProgress(stages, roadmap.progress)
  const stats = progressStats(roadmap)

  return (
    <div className="animate-fade-in space-y-6">
      <WelcomeSection
        learnerName={learnerName}
        learningGoal={profile?.goal ?? roadmap.goal}
        level={profile?.selfAssessedLevel}
        minutesPerWeek={profile?.availableMinutesPerWeek}
      />
      <OverviewStats stats={stats} resources={resourceItems(roadmap)} />
      {/* Cards side by side share their row's height. */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ContinueLearningSection current={findCurrentTask(stages)} allCompleted={summary.allCompleted} />
        <TodayFocusSection tasks={focusTasks(stages)} />
        <PlanStagesSection stages={stats.byStage} />
        <MentorInsightSection />
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton className="h-80" />
        <CardSkeleton className="h-80" />
        <CardSkeleton className="h-60" />
        <CardSkeleton className="h-60" />
      </div>
    </LoadingRegion>
  )
}

export { DashboardPage, OverviewSkeleton }
