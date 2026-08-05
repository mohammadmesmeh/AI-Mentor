"use client"

import { useT } from "@/shared/hooks/useT"
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
  continueLabel,
  canContinue = true,
  isLoading = false,
}: StepNavigationProps) {
  const t = useT("onboarding")
  const label = continueLabel ?? t("continue", "Continue")

  return (
    <div className="flex items-center justify-between pt-8">
      <div>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            {t("back", "Back")}
          </Button>
        )}
      </div>
      <Button
        variant="primary"
        onClick={onContinue}
        disabled={!canContinue || isLoading}
      >
        {isLoading ? t("loading", "Loading...") : label}
      </Button>
    </div>
  )
}

export { StepNavigation, type StepNavigationProps }
