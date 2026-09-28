"use client"

import { ChevronRight } from "lucide-react"
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
    <div className="mt-6 flex items-center justify-between gap-4 border-t border-border-default pt-8">
      <div>
        {onBack && (
          <Button variant="secondary" size="lg" className="min-h-11" onClick={onBack}>
            {t("back", "Back")}
          </Button>
        )}
      </div>
      <Button
        variant="primary"
        size="lg"
        className="min-h-11"
        onClick={onContinue}
        disabled={!canContinue || isLoading}
      >
        {isLoading ? t("loading", "Loading...") : label}
        {!isLoading && (
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}

export { StepNavigation, type StepNavigationProps }
