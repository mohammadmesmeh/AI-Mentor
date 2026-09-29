import { useT } from "@/shared/hooks/useT"
import { ProgressBar } from "@/shared/components/ui/ProgressBar"
import { StageProgressLabel } from "../ui/StageProgressLabel"
import { WorkspaceCard } from "../ui/workspace"
import type { StageTaskCount } from "../../lib/progressStats"
import { STAGE_STATUS_STYLE } from "../../lib/statusStyles"

/**
 * Each stage of the plan with its real task counts (spec 007 FR-009). The
 * active stage is the only purple bar; everything else is navy.
 */
function PlanStagesSection({ stages }: { stages: StageTaskCount[] }) {
  const t = useT("workspace")

  return (
    <WorkspaceCard titleId="plan-stages-heading" title={t("planStagesTitle")}>
      <ol className="m-0 list-none space-y-4 p-0">
        {stages.map((stage) => {
          const total = stage.completed + stage.remaining
          const percent = total === 0 ? 0 : Math.round((stage.completed / total) * 100)
          const title = t("stageNumbered", undefined, { position: stage.position, title: stage.title })
          return (
            <li key={stage.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                <span dir="auto" className="font-semibold wrap-break-word text-ink">
                  {title}
                </span>
                <StageProgressLabel done={stage.completed} total={total} status={stage.status} />
              </div>
              <ProgressBar
                value={percent}
                size="sm"
                label={title}
                tone={STAGE_STATUS_STYLE[stage.status].tone}
              />
            </li>
          )
        })}
      </ol>
    </WorkspaceCard>
  )
}

export { PlanStagesSection }
