"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"
import { InputField } from "./components/InputField"

interface StepFourTimeCommitmentProps {
  value: string
  customDescription: string
  onChange: (value: string) => void
  onCustomChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

function StepFourTimeCommitment({
  value,
  customDescription,
  onChange,
  onCustomChange,
  onNext,
  onBack,
}: StepFourTimeCommitmentProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const timeOptions = [
    { value: "15-30", title: t("time15to30") },
    { value: "30-60", title: t("time30to60") },
    { value: "1-2", title: t("time1to2") },
    { value: "weekends", title: t("timeWeekends") },
    { value: "custom", title: t("timeCustom") },
  ] as const

  const handleContinue = () => {
    if (!value) {
      setError(t("stepFourError"))
      return
    }
    if (value === "custom" && !customDescription.trim()) {
      setError(t("stepFourCustomError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("stepFourTitle")}
        </h1>
      </div>
      <div className="space-y-3">
        {timeOptions.map((option) => (
          <OptionCard
            key={option.value}
            title={option.title}
            selected={value === option.value}
            onClick={() => {
              onChange(option.value)
              if (error) setError("")
            }}
          >
            {value === "custom" && option.value === "custom" && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <InputField
                  value={customDescription}
                  onChange={onCustomChange}
                  placeholder={t("timeCustomPlaceholder")}
                />
              </div>
            )}
          </OptionCard>
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

export { StepFourTimeCommitment, type StepFourTimeCommitmentProps }
