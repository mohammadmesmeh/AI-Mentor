import { useT } from "@/shared/hooks/useT"
import { toneFill } from "@/shared/components/ui/status-tone"
import { cn } from "@/lib/utils"
import type { ProgressStats, StatusBucket } from "../../lib/progressStats"
import { TASK_STATUS_STYLE } from "../../lib/statusStyles"
import { WorkspaceCard } from "../ui/workspace"

/** "other" (skipped / skip pending) uses the skipped style. */
const bucketStyle = (bucket: StatusBucket) => TASK_STATUS_STYLE[bucket === "other" ? "skipped" : bucket]

/** How many tasks are in each status: one stacked bar and a legend with counts. */
export function StatusBreakdownCard({ stats }: { stats: ProgressStats }) {
  const t = useT("workspace")
  const buckets = stats.byStatus.filter(({ bucket, count }) => count > 0 || bucket !== "other")
  const total = buckets.reduce((sum, { count }) => sum + count, 0)
  const label = (bucket: StatusBucket) => t(bucket === "other" ? "statusOther" : bucketStyle(bucket).labelKey)

  return (
    <WorkspaceCard
      titleId="status-breakdown-heading"
      title={t("statusBreakdownTitle")}
      description={t("statusBreakdownDescription", undefined, { count: total })}
    >
      {total > 0 && (
        <div aria-hidden="true" className="mb-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
          {buckets
            .filter(({ count }) => count > 0)
            .map(({ bucket, count }) => (
              <span key={bucket} className={toneFill[bucketStyle(bucket).tone]} style={{ flexGrow: count }} />
            ))}
        </div>
      )}
      <ul className="m-0 list-none p-0">
        {buckets.map(({ bucket, count }) => (
          <li key={bucket} className="flex items-center gap-2.5 border-t border-line py-2.5 text-sm first:border-t-0">
            <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-sm", toneFill[bucketStyle(bucket).tone])} />
            <span className="flex-1 text-foreground">{label(bucket)}</span>
            <span className="font-semibold tabular-nums text-ink">{count}</span>
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  )
}
