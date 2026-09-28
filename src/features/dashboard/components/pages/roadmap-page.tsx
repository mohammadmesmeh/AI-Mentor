"use client"

import { useMemo } from "react"
import { useLocale } from "next-intl"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"
import type { Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { taskItems, type TaskItem } from "../../lib/learningItems"
import { orderedStages, roadmapProgress } from "../../lib/roadmapProgress"
import { CompletionAnnouncer, RoadmapGate, TaskListRow } from "../learning/shared"
import { LoadingRegion, PageHeader, Panel, Skeleton, StageStatusChip } from "../ui/workspace"

const STAGE_STATUS_KEY = { completed: "stageCompleted", active: "stageActive", upcoming: "stageUpcoming" } as const

function RoadmapPage() {
  const state = useLearnerRoadmap()
  const completion = useTaskCompletion()
  return (
    <RoadmapGate state={state} skeleton={<RoadmapSkeleton />}>
      {(roadmap) => <RoadmapContent roadmap={roadmap} completion={completion} />}
    </RoadmapGate>
  )
}

function RoadmapContent({ roadmap, completion }: { roadmap: Roadmap; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const locale = useLocale()
  const { stages, itemsByStage, progress } = useMemo(() => {
    const ordered = orderedStages(roadmap.currentVersion)
    const items = taskItems(roadmap)
    const byStage = new Map<string, TaskItem[]>()
    for (const item of items) byStage.set(item.stage.id, [...(byStage.get(item.stage.id) ?? []), item])
    return { stages: ordered, itemsByStage: byStage, progress: roadmapProgress(ordered, roadmap.progress) }
  }, [roadmap])
  const percent = new Intl.NumberFormat(locale, { style: "percent" }).format(progress.percent / 100)

  return (
    <>
      <PageHeader
        eyebrow={t("roadmapEyebrow")}
        title={roadmap.goal}
        titleDir="auto"
        description={roadmap.status === "completed" ? t("roadmapCompleted") : undefined}
      />

      <Panel aria-labelledby="roadmap-progress-heading" className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="roadmap-progress-heading" className="font-ui text-base font-medium text-foreground">
            {t("roadmapSummary", undefined, { done: progress.completedTasks, total: progress.countedTasks })}
          </h2>
          <span className="font-display text-heading-sm font-bold text-primary dark:text-primary-200">{percent}</span>
        </div>
        <div
          className="progress-track mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-valuetext={percent}
          aria-label={td("progressBarLabel")}
        >
          <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
      </Panel>

      <ol className="space-y-6">
        {stages.map((stage) => {
          const headingId = `stage-${stage.id}`
          const items = itemsByStage.get(stage.id) ?? []
          return (
            <li key={stage.id}>
              <Panel aria-labelledby={headingId}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 p-5">
                  <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] font-display text-sm font-bold",
                        stage.status === "active"
                          ? "bg-accent-700/10 text-accent-700 dark:text-accent-300"
                          : "bg-primary/10 text-primary dark:text-primary-200"
                      )}
                    >
                      {String(stage.position).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("stageHeading", undefined, { position: stage.position })}
                      </p>
                      <h2
                        id={headingId}
                        dir="auto"
                        className="font-display text-heading-sm font-semibold text-foreground wrap-break-word"
                      >
                        {stage.title}
                      </h2>
                      {stage.description && (
                        <p dir="auto" className="text-sm text-muted-foreground wrap-break-word">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <StageStatusChip status={stage.status} label={td(STAGE_STATUS_KEY[stage.status])} />
                    {stage.progress && (
                      <span className="text-xs text-muted-foreground">
                        {t("stageTasksProgress", undefined, {
                          done: stage.progress.completedTasks,
                          total: stage.progress.totalTasks,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-border/50">
                  {items.map((item) => (
                    <TaskListRow key={item.task.id} item={item} roadmap={roadmap} completion={completion} />
                  ))}
                </ul>
              </Panel>
            </li>
          )
        })}
      </ol>
      <CompletionAnnouncer completion={completion} />
    </>
  )
}

function RoadmapSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-80 max-w-full" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
      {[0, 1].map((i) => (
        <div key={i} className="space-y-0 overflow-hidden rounded-lg border border-border/70">
          <Skeleton className="h-24 rounded-none" />
          <div className="space-y-px">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-20 rounded-none opacity-60" />
            ))}
          </div>
        </div>
      ))}
    </LoadingRegion>
  )
}

export { RoadmapPage }
