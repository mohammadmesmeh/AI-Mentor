import { PlayCircle } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { SectionState } from "../states/SectionState"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { taskIcon } from "../../lib/taskIcon"
import { LinkButton, Panel, PanelHeader } from "../ui/workspace"

interface ContinueLearningSectionProps {
  current: CurrentTaskRef | null
  allCompleted: boolean
}

/** The Overview's main action: open the task to do next. */
function ContinueLearningSection({ current, allCompleted }: ContinueLearningSectionProps) {
  const t = useT("dashboard")
  const tw = useT("workspace")

  return (
    <Panel aria-labelledby="continue-learning-heading">
      <PanelHeader
        id="continue-learning-heading"
        icon={PlayCircle}
        title={t("continueLearningTitle", "Continue Learning")}
      />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        {current ? (
          <>
            <div className="flex min-w-0 items-start gap-4">
              {/* Purple marks the current task only (design system). */}
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-700/10 text-accent-700 dark:text-accent-300"
              >
                {taskIcon(current.task.type, "h-5 w-5")}
              </span>
              <div className="min-w-0 space-y-1">
                <p dir="auto" className="wrap-break-word text-lg font-semibold text-foreground">
                  {current.task.title}
                </p>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{t(`taskType.${current.task.type}`, current.task.type)}</span>
                  {current.task.estimatedMinutes > 0 && (
                    <span>{t("taskMinutes", undefined, { count: current.task.estimatedMinutes })}</span>
                  )}
                  <span dir="auto" className="wrap-break-word">
                    {t("currentTaskStage", undefined, { stage: current.stage.title })}
                  </span>
                </p>
              </div>
            </div>
            <LinkButton href={taskPath(current.task.id)} className="w-full shrink-0 sm:w-auto">
              {tw("openTask")}
            </LinkButton>
          </>
        ) : allCompleted ? (
          <SectionState title={t("allTasksCompletedTitle")} description={t("allTasksCompletedDescription")} />
        ) : (
          <>
            <SectionState title={t("nothingToStartTitle")} description={t("nothingToStartDescription")} />
            <LinkButton href={WORKSPACE_ROUTES.roadmap} variant="secondary" className="w-full shrink-0 sm:w-auto">
              {t("reviewRoadmap", "Review your roadmap")}
            </LinkButton>
          </>
        )}
      </div>
    </Panel>
  )
}

export { ContinueLearningSection }
