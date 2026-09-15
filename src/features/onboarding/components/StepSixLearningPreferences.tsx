"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"

interface StepSixLearningPreferencesProps {
  preferences: string[]
  onChangePreferences: (value: string[]) => void
  onNext: () => void
  onBack: () => void
}

function StepSixLearningPreferences({
  preferences,
  onChangePreferences,
  onNext,
  onBack,
}: StepSixLearningPreferencesProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const preferenceOptions = [
    { value: "hands-on", title: t("handsOn") },
    { value: "video", title: t("video") },
    { value: "reading", title: t("reading") },
    { value: "quizzes", title: t("quizzes") },
  ] as const

  const togglePreference = (pref: string) => {
    onChangePreferences(
      preferences.includes(pref)
        ? preferences.filter((v) => v !== pref)
        : [...preferences, pref],
    )
    if (error) setError("")
  }

  const handleContinue = () => {
    if (preferences.length === 0) {
      setError(t("stepThreeError"))
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
          {t("stepFivePreferencesTitle")}
        </h1>
        <p className="text-muted-foreground">{t("stepFivePreferencesDescription")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {preferenceOptions.map((pref) => (
          <OptionCard
            key={pref.value}
            title={pref.title}
            selected={preferences.includes(pref.value)}
            onClick={() => togglePreference(pref.value)}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-danger-500" aria-live="polite">
          {error}
        </p>
      )}
      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={preferences.length > 0}
      />
    </div>
  )
}

export { StepSixLearningPreferences, type StepSixLearningPreferencesProps }