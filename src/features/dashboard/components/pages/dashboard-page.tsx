"use client"

import { useSelector } from "react-redux"
import { BookOpen } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import { WelcomeSection } from "../sections/WelcomeSection"
import { ContinueLearningSection } from "../sections/ContinueLearningSection"
import { ProgressSection } from "../sections/ProgressSection"
import { TodayFocusSection } from "../sections/TodayFocusSection"
import { MentorInsightSection } from "../sections/MentorInsightSection"
import { RecentActivitySection } from "../sections/RecentActivitySection"

function DashboardPage() {
  const t = useT("dashboard")
  const auth = useSelector((state: RootState) => state.auth)
  const onboarding = useSelector((state: RootState) => state.onboarding)

  if (!onboarding.roadmap) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
        </div>
        <h1 className="mb-2 text-heading-md font-semibold text-foreground">
          {t("welcomeTitle", "Welcome to Your Dashboard")}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {t(
            "noRoadmapDescription",
            "You don't have a learning roadmap yet. Start by telling us about your goals!"
          )}
        </p>
        <Button href="/onboarding" variant="primary">
          {t("startOnboarding", "Start Onboarding")}
        </Button>
      </div>
    )
  }

  const learnerName = auth.user?.name
  const learningGoal =
    onboarding.onboardingData?.learningGoal || onboarding.learningGoal
  const stageTitles = onboarding.roadmap
  const stageCount = onboarding.roadmap.length
  const currentStageIndex = 0

  return (
    <div className="space-y-6">
      <WelcomeSection learnerName={learnerName} learningGoal={learningGoal} />
      <ContinueLearningSection status="unavailable" />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <TodayFocusSection status="unavailable" />
          <MentorInsightSection status="unavailable" />
        </div>
        <div className="space-y-6 md:col-span-2">
          <ProgressSection
            stageTitles={stageTitles}
            stageCount={stageCount}
            currentStageIndex={currentStageIndex}
          />
          <RecentActivitySection status="unavailable" />
        </div>
      </div>
    </div>
  )
}

export { DashboardPage }