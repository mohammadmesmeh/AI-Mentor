"use client"

import { AlertTriangle } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { generationFailureKey } from "@/lib/api/errors"
import { PageState } from "./ui/workspace"

interface RoadmapGenerationFailureProps {
  failureCode: string | null
  /** A `dashboard.*` key that replaces the failure-code message (e.g. a start refused with 429). */
  messageKey?: string
  onRetry: () => void
}

/**
 * Terminal-failure view. Maps the persisted failure_code to a friendly
 * localized explanation via generationFailureKey (FR-023); the raw server
 * failure_code is never shown to users (FR-018). Retrying creates a new
 * request with a new idempotency key (contract §15).
 */
function RoadmapGenerationFailure({ failureCode, messageKey, onRetry }: RoadmapGenerationFailureProps) {
  const t = useT("dashboard")
  return (
    <PageState
      role="alert"
      icon={AlertTriangle}
      tone="muted"
      title={t("generationFailedTitle")}
      description={t(messageKey ?? generationFailureKey(failureCode))}
      action={
        <Button variant="primary" size="lg" className="min-h-11" onClick={onRetry}>
          {t("retryGeneration")}
        </Button>
      }
    />
  )
}

export { RoadmapGenerationFailure, type RoadmapGenerationFailureProps }
