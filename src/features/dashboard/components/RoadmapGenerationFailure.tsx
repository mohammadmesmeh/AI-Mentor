"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/shared/components/ui/Button"
import { generationFailureKey } from "@/lib/api/errors"

interface RoadmapGenerationFailureProps {
  failureCode: string | null
  /** A `dashboard.*` key that replaces the failure-code message (e.g. a start refused with 429). */
  messageKey?: string
  onRetry: () => void
}

/**
 * Terminal-failure view. Maps the persisted failure_code to a friendly
 * localized explanation via generationFailureKey (FR-023); the raw server
 * failure_code is never shown to users (FR-018).
 */
function RoadmapGenerationFailure({ failureCode, messageKey, onRetry }: RoadmapGenerationFailureProps) {
  const t = useTranslations("dashboard")

  return (
    <Card role="alert" className="mx-auto max-w-md border-danger-500/20 bg-danger-500/[0.04]">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/10">
          <AlertTriangle className="h-7 w-7 text-danger-500" aria-hidden="true" />
        </div>
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("generationIncompleteTitle")}
        </h1>
        <p className="max-w-sm text-muted-foreground">{t(messageKey ?? generationFailureKey(failureCode))}</p>
        <Button variant="primary" onClick={onRetry}>
          {t("retryGeneration")}
        </Button>
      </CardContent>
    </Card>
  )
}

export { RoadmapGenerationFailure, type RoadmapGenerationFailureProps }