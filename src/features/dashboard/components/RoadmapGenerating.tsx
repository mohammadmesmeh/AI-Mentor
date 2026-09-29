"use client"

import { useTranslations } from "next-intl"
import { Brain } from "lucide-react"
import { Button } from "@/shared/components/ui/Button"

interface RoadmapGeneratingProps {
  timedOut: boolean
  onCheckAgain: () => void
}

/**
 * There is no public cancel endpoint (contract §23), so no "cancel" control is
 * offered. A timeout only offers "check again": polling timing out must not
 * create a new generation request (contract §15 rule 4).
 */
function RoadmapGenerating({ timedOut, onCheckAgain }: RoadmapGeneratingProps) {
  const t = useTranslations("dashboard")

  if (timedOut) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="mb-2 text-heading-md font-semibold text-foreground">
          {t("pollingTimedOut")}
        </h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="primary" onClick={onCheckAgain}>
            {t("checkAgain")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Brain className="h-10 w-10 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("generatingTitle")}
        </h1>
        <p className="text-muted-foreground" aria-live="polite">
          {t("generationInProgress")}
        </p>
      </div>
    </div>
  )
}

export { RoadmapGenerating, type RoadmapGeneratingProps }