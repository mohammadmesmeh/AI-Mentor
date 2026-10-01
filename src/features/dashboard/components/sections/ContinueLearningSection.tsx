import { ArrowRight, CircleCheck, Hourglass } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { SectionState } from "../states/SectionState"
import { TaskMeta } from "../learning/shared"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { LinkButton, WorkspaceCard } from "../ui/workspace"

interface ContinueLearningSectionProps {
  current: CurrentTaskRef | null
  allCompleted: boolean
}

/** The Overview's main action: open the task to do next. */
function ContinueLearningSection({ current, allCompleted }: ContinueLearningSectionProps) {
  const t = useT("dashboard")
  const tw = useT("workspace")

  return (
    <WorkspaceCard
      titleId="continue-learning-heading"
      title={t("continueLearningTitle", "Continue Learning")}
      action={current && <StatusDot tone="current" label={tw("currentTask")} />}
    >
      {current ? (
        <div className="flex flex-col gap-3">
          {/* Server text sits in <bdi>: its own direction, but on the page's side like the rest. */}
          <p className="m-0 text-[0.8125rem] font-semibold wrap-break-word text-status-available">
            {tw("stageLabel", undefined, { position: current.stage.position, title: current.stage.title })}
          </p>
          <h3 className="m-0 font-sans text-lg leading-normal font-bold wrap-break-word text-ink sm:text-xl">
            <bdi>{current.task.title}</bdi>
          </h3>
          {current.task.instructions.trim() && (
            <p className="m-0 line-clamp-2 text-sm wrap-break-word text-muted-foreground">
              <bdi>{current.task.instructions}</bdi>
            </p>
          )}
          <TaskMeta type={current.task.type} minutes={current.task.estimatedMinutes} />
          <LinkButton href={taskPath(current.task.id)} className="mt-1 w-full gap-2.5 sm:w-auto sm:self-start">
            {tw("openTask")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </LinkButton>
        </div>
      ) : allCompleted ? (
        <SectionState
          icon={CircleCheck}
          title={t("allTasksCompletedTitle")}
          description={t("allTasksCompletedDescription")}
        />
      ) : (
        <SectionState
          icon={Hourglass}
          title={t("nothingToStartTitle")}
          description={t("nothingToStartDescription")}
          action={
            <LinkButton href={WORKSPACE_ROUTES.roadmap} variant="glass" className="w-full sm:w-auto">
              {t("reviewRoadmap", "Review your roadmap")}
            </LinkButton>
          }
        />
      )}
    </WorkspaceCard>
  )
}

export { ContinueLearningSection }
