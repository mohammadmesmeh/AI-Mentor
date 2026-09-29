import { Map } from "lucide-react"
import { useLocale } from "next-intl"

import { useT } from "@/shared/hooks/useT"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { LinkButton, Panel } from "../ui/workspace"
import { cn } from "@/lib/utils"
import type { RoadmapProgress } from "../../lib/roadmapProgress"

interface ProgressSectionProps {
  progress: RoadmapProgress
}

const STAGE_SEGMENT_CLASS = {
  completed: "bg-primary",
  active: "bg-accent-700",
  upcoming: "bg-muted",
} as const

const STAGE_STATUS_KEY = {
  completed: "stageCompleted",
  active: "stageActive",
  upcoming: "stageUpcoming",
} as const

/**
 * Real progress derived from the roadmap's own statuses (spec 007 FR-009).
 * Stage titles are listed visibly only in the full roadmap below; here they are
 * exposed to assistive technology alone. No streak/accuracy/time figures exist
 * to show (FR-010).
 */
function ProgressSection({ progress }: ProgressSectionProps) {
  const t = useT("dashboard")
  const tw = useT("workspace")
  const locale = useLocale()
  const percentLabel = new Intl.NumberFormat(locale, { style: "percent" }).format(
    progress.percent / 100
  )

  return (
    <Panel aria-labelledby="progress-heading">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10">
              <Map className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="progress-heading"
                className="font-display text-heading-sm font-semibold text-foreground"
              >
                {t("progressTitle", "Progress")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("stageOfTotal", undefined, {
                  current: progress.stageNumber,
                  total: progress.stageCount,
                })}
              </p>
            </div>
          </div>
          <span className="badge-base rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary dark:text-primary-200">{percentLabel}</span>
        </div>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("tasksCompletedOfTotal", undefined, {
                done: progress.completedTasks,
                total: progress.countedTasks,
              })}
            </p>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              aria-valuetext={percentLabel}
              aria-label={t("progressBarLabel")}
            >
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          {progress.stageStatuses.length > 0 && (
            <>
              <div className="flex gap-1.5" aria-hidden="true">
                {progress.stageStatuses.map((stage) => (
                  <span
                    key={stage.id}
                    className={cn("h-1.5 flex-1 rounded-full", STAGE_SEGMENT_CLASS[stage.status])}
                  />
                ))}
              </div>
              <ul className="sr-only">
                {progress.stageStatuses.map((stage) => (
                  <li key={stage.id}>
                    {stage.title} — {t(STAGE_STATUS_KEY[stage.status])}
                  </li>
                ))}
              </ul>
            </>
          )}
          <LinkButton href={WORKSPACE_ROUTES.roadmap} variant="secondary" className="w-full">
            {tw("viewRoadmap")}
          </LinkButton>
        </div>
    </Panel>
  )
}

export { ProgressSection }
