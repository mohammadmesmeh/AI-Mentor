"use client"

import { useState } from "react"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"

interface StepOneLearningGoalProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

function StepOneLearningGoal({ value, onChange, onNext }: StepOneLearningGoalProps) {
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value.trim()) {
      setError("Please enter a learning goal to continue.")
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          What do you want to learn?
        </h1>
        <p className="text-muted-foreground">
          Be as specific as you can. It shapes your entire roadmap.
        </p>
      </div>
      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder="I want to learn backend engineering with Node.js"
        multiline
        rows={4}
        error={error}
      />
      <StepNavigation
        onContinue={handleContinue}
        canContinue={!!value.trim()}
      />
    </div>
  )
}

export { StepOneLearningGoal, type StepOneLearningGoalProps }
