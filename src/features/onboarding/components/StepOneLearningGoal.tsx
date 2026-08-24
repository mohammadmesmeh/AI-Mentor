"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"

interface StepOneLearningGoalProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

function StepOneLearningGoal({ value, onChange, onNext }: StepOneLearningGoalProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value.trim()) {
      setError(t("stepOneError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("stepOneTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("stepOneDescription")}
        </p>
      </div>
      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder={t("stepOnePlaceholder")}
        multiline
        rows={4}
        error={error}
      />
      <StepNavigation
        onContinue={handleContinue}
        canContinue={!!value.trim()}
      />
    </div>
  )
}

export { StepOneLearningGoal, type StepOneLearningGoalProps }
