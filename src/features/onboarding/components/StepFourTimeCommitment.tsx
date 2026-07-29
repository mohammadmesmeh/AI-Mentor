"use client"

import { useState } from "react"
import { OptionCard } from "./components/OptionCard"
import { StepNavigation } from "./components/StepNavigation"
import { InputField } from "./components/InputField"

const timeOptions = [
  { value: "15-30", title: "15\u201330 minutes daily" },
  { value: "30-60", title: "30\u201360 minutes daily" },
  { value: "1-2", title: "1\u20132 hours daily" },
  { value: "weekends", title: "Weekends mostly" },
  { value: "custom", title: "Custom schedule" },
] as const

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
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value) {
      setError("Please select your time commitment.")
      return
    }
    if (value === "custom" && !customDescription.trim()) {
      setError("Please describe your custom schedule.")
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          How much time can you give this?
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
                  placeholder="e.g., 2 hours on Mon, Wed, Fri evenings"
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
