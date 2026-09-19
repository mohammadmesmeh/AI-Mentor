"use client"

import { useCallback, useEffect } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useSelector } from "react-redux"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import {
  useGetOnboardingStatusQuery,
  useGetLearningProfileQuery,
  useGetRoadmapQuery,
} from "@/lib/api/apiSlice"
import type { Roadmap } from "@/lib/api/types"
import { OnboardingIncomplete } from "@/features/onboarding/components/OnboardingIncomplete"
import { useGenerateRoadmap } from "../../hooks/useGenerateRoadmap"
import { useRoadmapGenerationPolling } from "../../hooks/useRoadmapGenerationPolling"
import { RoadmapView } from "../RoadmapView"
import { RoadmapGenerationFailure } from "../RoadmapGenerationFailure"
import { RoadmapGenerating } from "../RoadmapGenerating"
import { WelcomeSection } from "../sections/WelcomeSection"
import { ContinueLearningSection } from "../sections/ContinueLearningSection"
import { ProgressSection } from "../sections/ProgressSection"
import { TodayFocusSection } from "../sections/TodayFocusSection"
import { MentorInsightSection } from "../sections/MentorInsightSection"
import { RecentActivitySection } from "../sections/RecentActivitySection"

function RoadmapGenerationStart({ onGenerate }: { onGenerate: () => void }) {
  const t = useT("dashboard")
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="mb-2 text-heading-md font-semibold text-foreground">
        {t("roadmapGenerationTitle")}
      </h1>
      <p className="mb-6 text-muted-foreground">{t("roadmapGenerationDescription")}</p>
      <Button variant="primary" onClick={onGenerate}>
        {t("generateRoadmap")}
      </Button>
    </div>
  )
}

function DashboardPage() {
  const t = useT("dashboard")
  const auth = useSelector((state: RootState) => state.auth)

  const { data: onboardingStatus, isLoading: statusLoading } = useGetOnboardingStatusQuery()
  const { data: profile } = useGetLearningProfileQuery()

  const { requestId, startError, generate, reset } = useGenerateRoadmap()
  const { phase, request, checkAgain } = useRoadmapGenerationPolling(requestId)

  const roadmapId = phase === "ready" || phase === "failed" ? request?.roadmapId ?? null : null
  const { data: roadmap, isLoading: roadmapLoading, isError } = useGetRoadmapQuery(
    roadmapId ?? skipToken
  )

  // A cancelled generation returns the user to the generation screen (contract
  // §15) — clear the local request so the effect can restart cleanly.
  useEffect(() => {
    if (phase === "cancelled") {
      reset()
    }
  }, [phase, reset])

  const handleRetry = useCallback(() => {
    reset()
    void generate()
  }, [reset, generate])

  if (statusLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (onboardingStatus && !onboardingStatus.completed) {
    return <OnboardingIncomplete missingFields={onboardingStatus.missingFields} />
  }

  if (startError) {
    return <RoadmapGenerationFailure failureCode={null} onRetry={handleRetry} />
  }

  if (phase === "starting" || phase === "in_progress" || phase === "timed_out") {
    return (
      <RoadmapGenerating
        timedOut={phase === "timed_out"}
        onCheckAgain={checkAgain}
        onReset={reset}
      />
    )
  }

  if (phase === "failed" && request) {
    return <RoadmapGenerationFailure failureCode={request.failureCode} onRetry={handleRetry} />
  }

  if (phase === "ready") {
    if (roadmapLoading) {
      return (
        <div className="py-16 text-center text-muted-foreground" aria-live="polite">
          {t("generationInProgress")}
        </div>
      )
    }
    if (isError || !roadmap) {
      return (
        <div className="py-16 text-center">
          <p className="mb-6 text-muted-foreground">{t("roadmapNotFound")}</p>
          <Button variant="primary" onClick={handleRetry}>
            {t("retryGeneration")}
          </Button>
        </div>
      )
    }
    return (
      <div className="space-y-8">
        <RoadmapView roadmap={roadmap} />
        <DashboardSections roadmap={roadmap} learnerName={auth.user?.name} learningGoal={profile?.goal} />
      </div>
    )
  }

  return <RoadmapGenerationStart onGenerate={generate} />
}

function DashboardSections({
  roadmap,
  learnerName,
  learningGoal,
}: {
  roadmap: Roadmap
  learnerName?: string
  learningGoal?: string
}) {
  const t = useT("dashboard")

  const stageTitles = roadmap.currentVersion?.stages?.map((s) => s.title) ?? []
  const currentStageIndex = roadmap.currentVersion?.stages?.findIndex((s) => s.status === "active") ?? 0

  return (
    <>
      <WelcomeSection learnerName={learnerName} learningGoal={learningGoal} />
      <ContinueLearningSection status="unavailable" />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <TodayFocusSection status="unavailable" />
          <MentorInsightSection status="unavailable" />
        </div>
        <div className="space-y-6 md:col-span-2">
          {stageTitles.length > 0 && (
            <ProgressSection
              stageTitles={stageTitles}
              stageCount={stageTitles.length}
              currentStageIndex={Math.max(currentStageIndex, 0)}
            />
          )}
          <RecentActivitySection status="unavailable" />
        </div>
      </div>
      <span className="sr-only">{t("roadmapReady")}</span>
    </>
  )
}

export { DashboardPage }