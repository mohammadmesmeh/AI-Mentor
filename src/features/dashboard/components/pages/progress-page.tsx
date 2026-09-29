"use client"

import { useLocale } from "next-intl"
import { CalendarDays, ChartLine, CircleCheck, Clock } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import type { Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { progressStats } from "../../lib/progressStats"
import { durationMessage, formatPercent } from "../../lib/format"
import { RoadmapGate } from "../learning/shared"
import { StatCard, StatCardSkeleton, StatGrid } from "../ui/StatCard"
import { CardSkeleton, LinkButton, LoadingRegion, PageHeader, Skeleton } from "../ui/workspace"
import { CompletionRingCard, StageTasksCard } from "../progress/ProgressCharts"
import { StatusBreakdownCard } from "../progress/StatusBreakdownCard"
import { CompletedTasksCard } from "../progress/CompletedTasksCard"

/** Where the learner stands in the plan, from the roadmap already cached. */
function ProgressPage() {
  const state = useLearnerRoadmap()
  return (
    <RoadmapGate state={state} skeleton={<ProgressSkeleton />}>
      {(roadmap) => <ProgressContent roadmap={roadmap} />}
    </RoadmapGate>
  )
}

function ProgressContent({ roadmap }: { roadmap: Roadmap }) {
  const t = useT("workspace")
  const locale = useLocale()
  const stats = progressStats(roadmap)
  const remaining = durationMessage(stats.remainingMinutes)
  const done = durationMessage(stats.completedMinutes)

  return (
    <>
      <PageHeader
        title={t("progressPageTitle")}
        description={t("progressPageDescription")}
        action={
          <LinkButton href={WORKSPACE_ROUTES.roadmap} variant="glass">
            {t("viewRoadmap")}
          </LinkButton>
        }
      />
      <StatGrid label={t("summaryLabel")}>
        <StatCard
          icon={ChartLine}
          label={t("statOverall")}
          value={formatPercent(locale, stats.percent)}
          footer={t("statOverallHint")}
        />
        <StatCard
          icon={CircleCheck}
          label={t("statCompletedTasks")}
          value={t("countOfTotal", undefined, { current: stats.completedTasks, total: stats.totalTasks })}
          footer={t("statTasksLeft", undefined, { count: stats.remainingTasks })}
        />
        <StatCard
          icon={Clock}
          label={t("statRemainingTime")}
          value={t(remaining.key, undefined, remaining.values)}
          footer={t("statTimeDone", undefined, { time: t(done.key, undefined, done.values) })}
        />
        <StatCard icon={CalendarDays} label={t("statStreak")} value="—" footer={t("statStreakSoon")} muted />
      </StatGrid>
      <div className="grid gap-4 lg:grid-cols-[23.75rem_minmax(0,1fr)]">
        <CompletionRingCard stats={stats} />
        <StageTasksCard stats={stats} />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <StatusBreakdownCard stats={stats} />
        <CompletedTasksCard items={stats.completedItems} />
      </div>
    </>
  )
}

function ProgressSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[23.75rem_minmax(0,1fr)]">
        <CardSkeleton className="h-96" />
        <CardSkeleton className="h-96" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton className="h-72" />
        <CardSkeleton className="h-72" />
      </div>
    </LoadingRegion>
  )
}

export { ProgressPage }
