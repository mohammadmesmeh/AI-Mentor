import { useLocale } from "next-intl"
import { BookOpen, ChartLine, Clock, Map as MapIcon } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import type { ResourceItem } from "../../lib/learningItems"
import { RESOURCE_TYPES } from "../../lib/learningItems"
import type { ProgressStats } from "../../lib/progressStats"
import { durationMessage, formatNumber, formatPercent, resourceTypeCounts } from "../../lib/format"
import { StatCard, StatGrid } from "../ui/StatCard"

/** The Overview's four key figures, all from the cached roadmap. */
function OverviewStats({ stats, resources }: { stats: ProgressStats; resources: ResourceItem[] }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()
  const remaining = durationMessage(stats.remainingMinutes)
  const currentStage = stats.byStage[stats.stageNumber - 1]
  const typeCounts = resourceTypeCounts(resources, RESOURCE_TYPES)

  return (
    <StatGrid label={t("summaryLabel")}>
      <StatCard
        icon={ChartLine}
        label={t("statOverall")}
        value={formatPercent(locale, stats.percent)}
        footer={td("tasksCompletedOfTotal", undefined, { done: stats.completedTasks, total: stats.totalTasks })}
      />
      <StatCard
        icon={MapIcon}
        label={t("statCurrentStage")}
        value={t("countOfTotal", undefined, { current: stats.stageNumber, total: stats.stageCount })}
        footer={currentStage?.title}
      />
      <StatCard
        icon={Clock}
        label={t("statRemainingTime")}
        value={t(remaining.key, undefined, remaining.values)}
        footer={t("statRemainingTimeHint")}
      />
      <StatCard
        icon={BookOpen}
        label={t("statResources")}
        value={formatNumber(locale, resources.length)}
        footer={typeCounts.map(({ type, count }) => t(`resourceTypeCount.${type}`, undefined, { count })).join(" · ")}
      />
    </StatGrid>
  )
}

export { OverviewStats }
