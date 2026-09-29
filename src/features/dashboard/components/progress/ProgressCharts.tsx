"use client"

import dynamic from "next/dynamic"
import { useLocale } from "next-intl"
import { useT } from "@/shared/hooks/useT"
import { Separator } from "@/components/ui/separator"
import { toneFill } from "@/shared/components/ui/status-tone"
import { cn } from "@/lib/utils"
import type { ProgressStats } from "../../lib/progressStats"
import { formatPercent } from "../../lib/format"
import { Skeleton, WorkspaceCard } from "../ui/workspace"

// recharts is only ever downloaded on this page: both charts are split out.
const CompletionRingChart = dynamic(() => import("./charts/CompletionRingChart"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-full" />,
})
const StageTasksChart = dynamic(() => import("./charts/StageTasksChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})

/** The share of the plan that is done, as a ring with the figure in its middle. */
export function CompletionRingCard({ stats }: { stats: ProgressStats }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()
  const percent = formatPercent(locale, stats.percent)

  return (
    <WorkspaceCard titleId="completion-heading" title={t("completionTitle")} description={t("completionDescription")}>
      <div className="flex flex-1 items-center justify-center py-2">
        <div role="img" aria-label={t("completionAria", undefined, { percent })} className="relative size-48 sm:size-50">
          <CompletionRingChart percent={stats.percent} />
          <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[2.375rem] leading-none font-bold tabular-nums text-ink">{percent}</span>
            <span className="mt-1 text-[0.8125rem] text-muted-foreground">{t("completedLabel")}</span>
          </div>
        </div>
      </div>
      <Separator className="mt-4 mb-3.5 bg-line" />
      <div className="flex flex-wrap justify-between gap-2 text-[0.8125rem] text-muted-foreground">
        <span>{td("tasksCompletedOfTotal", undefined, { done: stats.completedTasks, total: stats.totalTasks })}</span>
        <span>{td("stageOfTotal", undefined, { current: stats.stageNumber, total: stats.stageCount })}</span>
      </div>
    </WorkspaceCard>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  )
}

/** Completed vs remaining tasks in each stage, as grouped bars. */
export function StageTasksCard({ stats }: { stats: ProgressStats }) {
  const t = useT("workspace")
  const locale = useLocale()
  const labels = { completed: t("legendCompleted"), remaining: t("legendRemaining") }
  const data = stats.byStage.map((stage) => ({
    stage: t("stageShort", undefined, { position: stage.position }),
    title: t("stageNumbered", undefined, { position: stage.position, title: stage.title }),
    completed: stage.completed,
    remaining: stage.remaining,
  }))

  return (
    <WorkspaceCard
      titleId="stage-tasks-heading"
      title={t("stageTasksTitle")}
      description={t("stageTasksDescription")}
      action={
        <div aria-hidden="true" className="flex gap-4 text-[0.8125rem] text-muted-foreground">
          <LegendSwatch className={toneFill.completed} label={labels.completed} />
          <LegendSwatch className="bg-chart-remaining" label={labels.remaining} />
        </div>
      }
    >
      <div aria-hidden="true">
        <StageTasksChart data={data} labels={labels} rtl={locale === "ar"} />
      </div>
      {/* The chart's numbers, for assistive technology. */}
      <ul className="sr-only">
        {data.map((stage) => (
          <li key={stage.stage}>
            {stage.title}: {t("stageTasksAria", undefined, { completed: stage.completed, remaining: stage.remaining })}
          </li>
        ))}
      </ul>
    </WorkspaceCard>
  )
}
