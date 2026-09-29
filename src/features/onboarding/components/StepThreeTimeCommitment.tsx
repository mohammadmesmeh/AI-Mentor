"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"

interface StepThreeTimeCommitmentProps {
  value: number | null
  onChange: (value: number) => void
  onNext: () => void
  onBack: () => void
}

const MIN_MINUTES = 15
const MAX_MINUTES = 10080

function StepThreeTimeCommitment({
  value,
  onChange,
  onNext,
  onBack,
}: StepThreeTimeCommitmentProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (value === null || value === undefined) {
      setError(t("minutesRequired"))
      return
    }
    if (Number.isNaN(value) || value < MIN_MINUTES || value > MAX_MINUTES) {
      setError(t("minutesInvalid"))
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
          {t("stepFourTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("minutesRangeHint")}</p>
      </div>
      <InputField
        value={value === null ? "" : String(value)}
        onChange={(v) => {
          const parsed = v.trim() === "" ? NaN : Number(v)
          onChange(parsed)
          if (error) setError("")
        }}
        placeholder={t("minutesPerWeekPlaceholder")}
        label={t("minutesPerWeek")}
        type="number"
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        error={error}
        inputClassName="min-h-11 p-4"
      />
      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={value !== null && !Number.isNaN(value) && value >= MIN_MINUTES && value <= MAX_MINUTES}
      />
    </div>
  )
}

export { StepThreeTimeCommitment, type StepThreeTimeCommitmentProps }