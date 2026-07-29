"use client"

import { Button } from "@/shared/components/ui/Button"

interface StepNavigationProps {
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
  canContinue?: boolean
  isLoading?: boolean
}

function StepNavigation({
  onBack,
  onContinue,
  continueLabel = "Continue",
  canContinue = true,
  isLoading = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-8">
      <div>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
      <Button
        variant="primary"
        onClick={onContinue}
        disabled={!canContinue || isLoading}
      >
        {isLoading ? "Loading..." : continueLabel}
      </Button>
    </div>
  )
}

export { StepNavigation, type StepNavigationProps }
