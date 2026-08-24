"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"

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
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const skillLevels = [
    {
      value: "beginner",
      title: t("beginner"),
      description: t("beginnerDesc"),
    },
    {
      value: "some-experience",
      title: t("someExperience"),
      description: t("someExperienceDesc"),
    },
    {
      value: "intermediate",
      title: t("intermediate"),
      description: t("intermediateDesc"),
    },
  ] as const

  const handleContinue = () => {
    if (!value) {
      setError(t("stepTwoError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("stepTwoTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("stepTwoDescription")}
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
