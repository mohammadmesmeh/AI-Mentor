"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingState } from "@/redux/slices/onboardingSlice"

interface StepFiveSuccessGoalProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  onBack: () => void
  allData: Pick<
    OnboardingState,
    | "learningGoal"
    | "skillLevel"
    | "learningPreferences"
    | "timeCommitment"
    | "timeCustomDescription"
  >
}

function StepFiveSuccessGoal({
  value,
  onChange,
  onGenerate,
  onBack,
  allData,
}: StepFiveSuccessGoalProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const skillLevelLabels: Record<string, string> = {
    beginner: t("beginner"),
    "some-experience": t("someExperience"),
    intermediate: t("intermediate"),
  }

  const preferenceLabels: Record<string, string> = {
    "hands-on": t("handsOn"),
    video: t("video"),
    reading: t("reading"),
    quizzes: t("quizzes"),
  }

  const timeLabels: Record<string, string> = {
    "15-30": t("time15to30"),
    "30-60": t("time30to60"),
    "1-2": t("time1to2"),
    weekends: t("timeWeekends"),
    custom: t("timeCustom"),
  }

  const handleGenerate = () => {
    if (!value.trim()) {
      setError(t("stepFiveError"))
      return
    }
    setError("")
    onGenerate()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("stepFiveTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("stepFiveDescription")}
        </p>
      </div>

      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder={t("stepFivePlaceholder")}
        multiline
        rows={4}
        error={error}
      />

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-primary">
            {t("stepFiveSummary")}
          </p>
          <ul className="space-y-1.5">
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">{t("goal")}</span>
              {allData.learningGoal || t("notSpecified")}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">{t("level")}</span>
              {allData.skillLevel
                ? skillLevelLabels[allData.skillLevel] || allData.skillLevel
                : t("notSpecified")}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">{t("time")}</span>
              {allData.timeCommitment === "custom"
                ? allData.timeCustomDescription || t("timeCustom")
                : timeLabels[allData.timeCommitment] ||
                  allData.timeCommitment ||
                  t("notSpecified")}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">{t("style")}</span>
              {allData.learningPreferences.length > 0
                ? allData.learningPreferences
                    .map((p) => preferenceLabels[p] || p)
                    .join(", ")
                : t("notSpecified")}
            </li>
          </ul>
        </CardContent>
      </Card>

      <StepNavigation
        onBack={onBack}
        onContinue={handleGenerate}
        continueLabel={t("generateRoadmap")}
        canContinue={!!value.trim()}
      />
    </div>
  )
}

export { StepFiveSuccessGoal, type StepFiveSuccessGoalProps }
