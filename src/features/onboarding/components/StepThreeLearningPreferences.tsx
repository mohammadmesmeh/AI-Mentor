"use client"

import { useState } from "react"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"

const preferences = [
  { value: "hands-on", title: "Hands-on projects" },
  { value: "video", title: "Video walkthroughs" },
  { value: "reading", title: "Readings and notes" },
  { value: "quizzes", title: "Quizzes & drills" },
] as const

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
  const [error, setError] = useState("")

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
      setError("Please select at least one learning preference.")
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          How do you like to learn?
        </h1>
        <p className="text-muted-foreground">Pick as many as apply.</p>
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
