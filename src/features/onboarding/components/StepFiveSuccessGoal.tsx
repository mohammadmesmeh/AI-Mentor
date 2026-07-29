"use client"

import { useState } from "react"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingState } from "@/redux/slices/onboardingSlice"

const skillLevelLabels: Record<string, string> = {
  beginner: "Beginner",
  "some-experience": "Some Experience",
  intermediate: "Intermediate",
}

const preferenceLabels: Record<string, string> = {
  "hands-on": "Hands-on projects",
  video: "Video walkthroughs",
  reading: "Readings and notes",
  quizzes: "Quizzes & drills",
}

const timeLabels: Record<string, string> = {
  "15-30": "15\u201330 minutes daily",
  "30-60": "30\u201360 minutes daily",
  "1-2": "1\u20132 hours daily",
  weekends: "Weekends mostly",
  custom: "Custom schedule",
}

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
  const [error, setError] = useState("")

  const handleGenerate = () => {
    if (!value.trim()) {
      setError("Please describe what success looks like to you.")
      return
    }
    setError("")
    onGenerate()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          What does success look like?
        </h1>
        <p className="text-muted-foreground">
          This becomes the finish line your roadmap builds towards.
        </p>
      </div>

      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder="I want to build production-ready backend systems and become a backend developer."
        multiline
        rows={4}
        error={error}
      />

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-primary">
            Your mentor summarized this as:
          </p>
          <ul className="space-y-1.5">
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">Goal: </span>
              {allData.learningGoal || "Not specified"}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">Level: </span>
              {allData.skillLevel
                ? skillLevelLabels[allData.skillLevel] || allData.skillLevel
                : "Not specified"}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">Time: </span>
              {allData.timeCommitment === "custom"
                ? allData.timeCustomDescription || "Custom schedule"
                : timeLabels[allData.timeCommitment] ||
                  allData.timeCommitment ||
                  "Not specified"}
            </li>
            <li className="text-sm text-foreground">
              <span className="text-muted-foreground">Style: </span>
              {allData.learningPreferences.length > 0
                ? allData.learningPreferences
                    .map((p) => preferenceLabels[p] || p)
                    .join(", ")
                : "Not specified"}
            </li>
          </ul>
        </CardContent>
      </Card>

      <StepNavigation
        onBack={onBack}
        onContinue={handleGenerate}
        continueLabel="Generate My Learning Roadmap"
        canContinue={!!value.trim()}
      />
    </div>
  )
}

export { StepFiveSuccessGoal, type StepFiveSuccessGoalProps }
