"use client"

import { useMemo, useState } from "react"
import { ListFilter } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import type { Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { matchesTaskFilter, TASK_FILTERS, taskItems, type TaskFilter } from "../../lib/learningItems"
import { CompletionAnnouncer, RoadmapGate, TaskListRow } from "../learning/shared"
import { FilterChips } from "../learning/FilterChips"
import { LoadingRegion, PageHeader, PageState, Panel, Skeleton } from "../ui/workspace"

function TasksPage() {
  const state = useLearnerRoadmap()
  const completion = useTaskCompletion()
  return (
    <RoadmapGate state={state} skeleton={<ListSkeleton />}>
      {(roadmap) => <TasksContent roadmap={roadmap} completion={completion} />}
    </RoadmapGate>
  )
}

function TasksContent({ roadmap, completion }: { roadmap: Roadmap; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const [filter, setFilter] = useState<TaskFilter>("all")
  const items = useMemo(() => taskItems(roadmap), [roadmap])
  const visible = items.filter((item) => matchesTaskFilter(item.status, filter))
  const options = TASK_FILTERS.map((value) => ({
    value,
    label: t(`filter.${value}`),
    count: items.filter((item) => matchesTaskFilter(item.status, value)).length,
  }))

  return (
    <>
      <PageHeader eyebrow={t("tasksEyebrow")} title={t("tasksTitle")} description={t("tasksDescription")} />
      <FilterChips label={t("filterLabel")} options={options} value={filter} onChange={setFilter} />
      <p className="sr-only" aria-live="polite">
        {t("tasksCount", undefined, { count: visible.length })}
      </p>
      {visible.length === 0 ? (
        <Panel>
          <PageState
            icon={ListFilter}
            tone="muted"
            title={t("tasksEmptyTitle")}
            description={t("tasksEmptyDescription")}
            action={
              <Button variant="secondary" size="lg" className="min-h-11" onClick={() => setFilter("all")}>
                {t("showAllTasks")}
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel aria-label={t("tasksTitle")}>
          <ul className="divide-y divide-border/50">
            {visible.map((item) => (
              <TaskListRow key={item.task.id} item={item} roadmap={roadmap} completion={completion} showStage />
            ))}
          </ul>
        </Panel>
      )}
      <CompletionAnnouncer completion={completion} />
    </>
  )
}

export function ListSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-24 rounded-full" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/70">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-none border-b border-border/50 opacity-60" />
        ))}
      </div>
    </LoadingRegion>
  )
}

export { TasksPage }
