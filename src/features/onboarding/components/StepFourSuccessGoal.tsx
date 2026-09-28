"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"

interface StepFourSuccessGoalProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

function StepFourSuccessGoal({
  value,
  onChange,
  onNext,
  onBack,
}: StepFourSuccessGoalProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value.trim()) {
      setError(t("stepFiveError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none"
          tabIndex={-1}
        >
          {t("stepFiveTitle")}
        </h1>
        <p className="text-muted-foreground">{t("stepFiveDescription")}</p>
      </div>
      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder={t("stepFivePlaceholder")}
        ariaLabel={t("stepFiveTitle")}
        multiline
        rows={4}
        error={error}
      />
      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={!!value.trim()}
      />
    </div>
  )
}

export { StepFourSuccessGoal, type StepFourSuccessGoalProps }