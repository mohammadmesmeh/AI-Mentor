"use client"

import { useTranslations } from "next-intl"
import { Brain, RefreshCw } from "lucide-react"
import { Button } from "@/shared/components/ui/Button"

interface RoadmapGeneratingProps {
  timedOut: boolean
  onCheckAgain: () => void
  onReset: () => void
}

function RoadmapGenerating({ timedOut, onCheckAgain, onReset }: RoadmapGeneratingProps) {
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
          <Button variant="secondary" onClick={onReset}>
            {t("generationCancelled")}
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
          {t("roadmapGenerationTitle")}
        </h1>
        <p className="text-muted-foreground">{t("generationInProgress")}</p>
        <button
          type="button"
          onClick={onReset}
          className="mx-auto mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t("generationCancelled")}
        </button>
      </div>
    </div>
  )
}

export { RoadmapGenerating, type RoadmapGeneratingProps }