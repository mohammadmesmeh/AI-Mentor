"use client"

import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const t = useT("onboarding")
  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className="mb-2.5 text-xs font-semibold text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {t("step", `Step ${currentStep} of ${totalSteps}`, { current: currentStep, total: totalSteps })}
      </span>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <motion.div
            key={step}
            className={cn(
              "h-2 rounded-full transition-colors duration-300",
              step === currentStep
                ? "bg-primary"
                : step < currentStep
                  ? "bg-primary/40"
                  : "bg-border",
            )}
            animate={{ width: step === currentStep ? 32 : 8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  )
}

export { ProgressIndicator, type ProgressIndicatorProps }
