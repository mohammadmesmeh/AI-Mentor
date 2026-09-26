import { PlayCircle } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { buttonVariants } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"
import { SectionState } from "../states/SectionState"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { focusTaskAnchor, taskAnchorId } from "../../lib/focusTask"
import { taskIcon } from "../../lib/taskIcon"

interface ContinueLearningSectionProps {
  current: CurrentTaskRef | null
  allCompleted: boolean
}

// Plain in-page anchors (not the locale-aware Link) so a hash never triggers
// a route change.
const primaryLinkClass = cn(buttonVariants({ size: "lg" }), "shrink-0")

function ContinueLearningSection({ current, allCompleted }: ContinueLearningSectionProps) {
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
          {current ? (
            <>
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-700/10 text-accent-700">
                  {taskIcon(current.task.type, "h-5 w-5")}
                </div>
                <div className="min-w-0 space-y-1">
                  <p dir="auto" className="wrap-break-word text-lg font-semibold text-foreground">
                    {current.task.title}
                  </p>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{t(`taskType.${current.task.type}`, current.task.type)}</span>
                    {current.task.estimatedMinutes > 0 && (
                      <span>
                        {t("taskMinutes", undefined, { count: current.task.estimatedMinutes })}
                      </span>
                    )}
                    <span className="wrap-break-word">
                      {t("currentTaskStage", undefined, { stage: current.stage.title })}
                    </span>
                  </p>
                </div>
              </div>
              <a
                href={`#${taskAnchorId(current.task.id)}`}
                onClick={() => focusTaskAnchor(current.task.id)}
                className={primaryLinkClass}
              >
                {t("goToTask", "Go to task")}
              </a>
            </>
          ) : allCompleted ? (
            <SectionState
              title={t("allTasksCompletedTitle")}
              description={t("allTasksCompletedDescription")}
            />
          ) : (
            <>
              <SectionState
                title={t("nothingToStartTitle")}
                description={t("nothingToStartDescription")}
              />
              <a href="#roadmap" className={primaryLinkClass}>
                {t("reviewRoadmap", "Review your roadmap")}
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export { ContinueLearningSection }
