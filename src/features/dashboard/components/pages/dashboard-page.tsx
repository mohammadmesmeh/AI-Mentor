"use client"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import { useGetLearningProfileQuery } from "@/lib/api/apiSlice"
import type { Roadmap } from "@/lib/api/types"
import { OnboardingIncomplete } from "@/features/onboarding/components/OnboardingIncomplete"
import { useDashboardRoadmap } from "../../hooks/useDashboardRoadmap"
import { findCurrentTask, focusTasks, orderedStages, roadmapProgress } from "../../lib/roadmapProgress"
import { RoadmapView } from "../RoadmapView"
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
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-2 text-heading-md font-semibold text-foreground">{title}</h1>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <Button variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

function DashboardPage() {
  const t = useT("dashboard")
  const { view, generate, retryGeneration, checkAgain, reset, retryLoad, refetchRoadmap } =
    useDashboardRoadmap()

  switch (view.view) {
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
      return <RoadmapGenerationFailure failureCode={null} onRetry={retryGeneration} />
    case "failed":
      return <RoadmapGenerationFailure failureCode={view.failureCode} onRetry={retryGeneration} />
    case "generating":
    case "timed-out":
      return (
        <RoadmapGenerating
          timedOut={view.view === "timed-out"}
          onCheckAgain={checkAgain}
          onReset={reset}
        />
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
      return <DashboardWorkspace roadmap={view.roadmap} />
  }
}

/**
 * spec 007 FR-015 order: greeting (the page's only h1) → Continue Learning →
 * Today's Focus / Progress grid → the full roadmap, whose stage titles are the
 * only visible stage listing.
 */
function DashboardWorkspace({ roadmap }: { roadmap: Roadmap }) {
  const t = useT("dashboard")
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)
  const { data: profile } = useGetLearningProfileQuery()

  const { current, focus, progress } = useMemo(() => {
    const stages = orderedStages(roadmap.currentVersion)
    return {
      current: findCurrentTask(stages),
      focus: focusTasks(stages),
      progress: roadmapProgress(stages),
    }
  }, [roadmap])

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
      <RoadmapView roadmap={roadmap} />
      <span className="sr-only">{t("roadmapReady")}</span>
    </div>
  )
}

export { DashboardPage }
