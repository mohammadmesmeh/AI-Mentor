import { PlayCircle } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { SectionState } from "../states/SectionState"

interface ContinueLearningSectionProps {
  status?: "unavailable"
}

function ContinueLearningSection({ status = "unavailable" }: ContinueLearningSectionProps) {
  const t = useT("dashboard")

  return (
    <section aria-labelledby="continue-learning-heading">
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="border-b border-border/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <PlayCircle className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2
              id="continue-learning-heading"
              className="text-heading-sm font-semibold text-foreground"
            >
              {t("continueLearningTitle", "Continue Learning")}
            </h2>
          </div>
        </div>
        <div className="flex flex-col gap-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {status === "unavailable" && (
            <SectionState
              title={t("noCurrentLessonTitle", "No current lesson")}
              description={t(
                "noCurrentLessonDescription",
                "There's no active lesson right now. Review your roadmap to see what's next."
              )}
            />
          )}
          <Button href="#roadmap" size="lg" className="shrink-0">
            {t("reviewRoadmap", "Review your roadmap")}
          </Button>
        </div>
      </div>
    </section>
  )
}

export { ContinueLearningSection }