"use client"

import { useState } from "react"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"

const skillLevels = [
  {
    value: "beginner",
    title: "Beginner",
    description:
      "New to this topic. Need fundamentals and guidance from the start.",
  },
  {
    value: "some-experience",
    title: "Some Experience",
    description:
      "Understand some basics and want structured improvement.",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description:
      "Have practical experience and want to improve advanced skills.",
  },
] as const

interface StepTwoSkillLevelProps {
  value: string | null
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

function StepTwoSkillLevel({
  value,
  onChange,
  onNext,
  onBack,
}: StepTwoSkillLevelProps) {
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value) {
      setError("Please select your skill level to continue.")
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          Where are you starting from?
        </h1>
        <p className="text-muted-foreground">
          This helps AI Mentor personalize the roadmap to your current
          experience.
        </p>
      </div>
      <div className="space-y-3">
        {skillLevels.map((level) => (
          <OptionCard
            key={level.value}
            title={level.title}
            description={level.description}
            selected={value === level.value}
            onClick={() => {
              onChange(level.value)
              if (error) setError("")
            }}
          />
        ))}
      </div>
      {error && <p className="text-sm text-danger-500">{error}</p>}
      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={!!value}
      />
    </div>
  )
}

export { StepTwoSkillLevel, type StepTwoSkillLevelProps }
