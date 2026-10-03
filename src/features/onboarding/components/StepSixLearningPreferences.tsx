"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"
import type { LearningMethod } from "@/lib/api/types"

interface StepSixLearningPreferencesProps {
  preferences: LearningMethod[]
  onChangePreferences: (value: LearningMethod[]) => void
  onNext: () => void
  onBack: () => void
}

/**
 * How the learner likes to learn (contract §12 `preferred_learning_methods`,
 * 1-4). The only learning-style question: the server derives the resource
 * sources from these methods, so there is no separate source choice.
 */
function StepSixLearningPreferences({
  preferences,
  onChangePreferences,
  onNext,
  onBack,
}: StepSixLearningPreferencesProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const preferenceOptions = [
    { value: "hands_on_projects", title: t("handsOn") },
    { value: "video_walkthroughs", title: t("video") },
    { value: "reading_docs", title: t("reading") },
    { value: "quizzes_drills", title: t("quizzes") },
  ] as const

  const togglePreference = (pref: LearningMethod) => {
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

      <div role="group" aria-label={t("methodsGroupLabel")} className="space-y-3">
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
          <p className="text-sm text-danger-600 dark:text-danger-500" aria-live="polite">
            {error}
          </p>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={preferences.length > 0}
      />
    </div>
  )
}

export { StepSixLearningPreferences, type StepSixLearningPreferencesProps }
