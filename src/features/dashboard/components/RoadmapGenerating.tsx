"use client"

import { Brain, Clock } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { PageState, Skeleton } from "./ui/workspace"

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
  const t = useT("dashboard")

  if (timedOut) {
    return (
      <PageState
        role="status"
        icon={Clock}
        title={t("timedOutTitle")}
        description={t("pollingTimedOut")}
        action={
          <Button variant="primary" size="lg" className="min-h-11" onClick={onCheckAgain}>
            {t("checkAgain")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      <PageState role="status" icon={Brain} title={t("generatingTitle")} description={t("generationInProgress")} />
      {/* The shape of what's coming; pulses only when motion is allowed. */}
      <div aria-hidden="true" className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg opacity-70" />
        <Skeleton className="h-16 rounded-lg opacity-40" />
      </div>
    </div>
  )
}

export { RoadmapGenerating, type RoadmapGeneratingProps }
