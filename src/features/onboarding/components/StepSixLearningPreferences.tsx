"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"
import type { LearningMethod, ResourceSource } from "@/lib/api/types"
import { SOURCES, sourceKeyMap, toggleSource } from "../lib/profileLabels"

interface StepSixLearningPreferencesProps {
  preferences: LearningMethod[]
  onChangePreferences: (value: LearningMethod[]) => void
  /** In priority order (contract §12). */
  sources: ResourceSource[]
  onChangeSources: (value: ResourceSource[]) => void
  onNext: () => void
  onBack: () => void
}

/**
 * How the learner likes to learn (task formats) and where from (resource
 * sources, contract §12: 1-4, array order = priority). Both are required.
 */
function StepSixLearningPreferences({
  preferences,
  onChangePreferences,
  sources,
  onChangeSources,
  onNext,
  onBack,
}: StepSixLearningPreferencesProps) {
  const t = useTranslations("onboarding")
  const [methodsError, setMethodsError] = useState("")
  const [sourcesError, setSourcesError] = useState("")

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
    if (methodsError) setMethodsError("")
  }

  const handleContinue = () => {
    const noMethods = preferences.length === 0
    const noSources = sources.length === 0
    setMethodsError(noMethods ? t("stepThreeError") : "")
    setSourcesError(noSources ? t("sourcesError") : "")
    if (noMethods || noSources) return
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
        {methodsError && (
          <p className="text-sm text-danger-600 dark:text-danger-500" aria-live="polite">
            {methodsError}
          </p>
        )}
      </div>

      <div role="group" aria-labelledby="sources-title" aria-describedby="sources-description" className="space-y-3">
        <div className="space-y-1">
          <h2 id="sources-title" className="font-display text-heading-sm font-semibold text-foreground">
            {t("sourcesTitle")}
          </h2>
          <p id="sources-description" className="text-sm text-muted-foreground">
            {t("sourcesDescription")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SOURCES.map((source) => {
            const rank = sources.indexOf(source)
            return (
              <OptionCard
                key={source}
                title={t(sourceKeyMap[source])}
                selected={rank >= 0}
                onClick={() => {
                  onChangeSources(toggleSource(sources, source))
                  if (sourcesError) setSourcesError("")
                }}
              >
                {rank >= 0 && (
                  <span className="mt-1 block text-xs font-medium text-secondary-700 dark:text-secondary-300">
                    {t("sourcePriority", { n: rank + 1 })}
                  </span>
                )}
              </OptionCard>
            )
          })}
        </div>
        {sourcesError && (
          <p className="text-sm text-danger-600 dark:text-danger-500" aria-live="polite">
            {sourcesError}
          </p>
        )}
      </div>

      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={preferences.length > 0 && sources.length > 0}
      />
    </div>
  )
}

export { StepSixLearningPreferences, type StepSixLearningPreferencesProps }
