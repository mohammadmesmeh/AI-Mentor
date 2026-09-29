import type { StageStatus } from "@/lib/api/types"
import { useT } from "@/shared/hooks/useT"
import { STAGE_STATUS_STYLE } from "../../lib/statusStyles"

/** "1 of 3 · In progress" — a stage's task count and status, as muted text. */
export function StageProgressLabel({ done, total, status }: { done: number; total: number; status: StageStatus }) {
  const t = useT("workspace")
  return (
    <span className="text-[0.8125rem] text-muted-foreground">
      {t("stageTasksProgress", undefined, { done, total })} · {t(STAGE_STATUS_STYLE[status].labelKey)}
    </span>
  )
}
