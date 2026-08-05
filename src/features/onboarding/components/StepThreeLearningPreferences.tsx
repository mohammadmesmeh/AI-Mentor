"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"

interface StepThreeLearningPreferencesProps {
  value: string[]
  onChange: (value: string[]) => void
  onNext: () => void
  onBack: () => void
}

function StepThreeLearningPreferences({
  value,
  onChange,
  onNext,
  onBack,
}: StepThreeLearningPreferencesProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const preferences = [
    { value: "hands-on", title: t("handsOn") },
    { value: "video", title: t("video") },
    { value: "reading", title: t("reading") },
    { value: "quizzes", title: t("quizzes") },
  ] as const

  const togglePreference = (pref: string) => {
    if (value.includes(pref)) {
      onChange(value.filter((v) => v !== pref))
    } else {
      onChange([...value, pref])
    }
    if (error) setError("")
  }

  const handleContinue = () => {
    if (value.length === 0) {
      setError(t("stepThreeError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("stepThreeTitle")}
        </h1>
        <p className="text-muted-foreground">{t("stepThreeDescription")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {preferences.map((pref) => (
          <OptionCard
            key={pref.value}
            title={pref.title}
            selected={value.includes(pref.value)}
            onClick={() => togglePreference(pref.value)}
          />
        ))}
      </div>
      {error && <p className="text-sm text-danger-500">{error}</p>}
      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={value.length > 0}
      />
    </div>
  )
}

export { StepThreeLearningPreferences, type StepThreeLearningPreferencesProps }
