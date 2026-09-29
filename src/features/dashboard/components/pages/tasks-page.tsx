"use client"

import { useState } from "react"
import { ListFilter } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { Card } from "@/components/ui/card"
import { FilterTabs } from "@/shared/components/ui/FilterTabs"
import type { Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { useTaskCompletion, type TaskCompletionState } from "../../hooks/useTaskCompletion"
import { matchesTaskFilter, TASK_FILTERS, taskItems, type TaskFilter } from "../../lib/learningItems"
import { CompletionAnnouncer, RoadmapGate } from "../learning/shared"
import { TaskTable } from "../learning/TaskTable"
import { CardSkeleton, LoadingRegion, PageHeader, PageState, Skeleton } from "../ui/workspace"

function TasksPage() {
  const state = useLearnerRoadmap()
  const completion = useTaskCompletion()
  return (
    <RoadmapGate state={state} skeleton={<ListSkeleton variant="table" />}>
      {(roadmap) => <TasksContent roadmap={roadmap} completion={completion} />}
    </RoadmapGate>
  )
}

function TasksContent({ roadmap, completion }: { roadmap: Roadmap; completion: TaskCompletionState }) {
  const t = useT("workspace")
  const [filter, setFilter] = useState<TaskFilter>("all")
  const items = taskItems(roadmap)
  const visible = items.filter((item) => matchesTaskFilter(item.status, filter))
  const options = TASK_FILTERS.map((value) => ({
    value,
    label: t(`filter.${value}`),
    count: items.filter((item) => matchesTaskFilter(item.status, value)).length,
  }))

  return (
    <>
      <PageHeader title={t("tasksTitle")} description={t("tasksDescription")} />
      <FilterTabs label={t("filterLabel")} options={options} value={filter} onChange={setFilter} />
      <p className="sr-only" aria-live="polite">
        {t("tasksCount", undefined, { count: visible.length })}
      </p>
      {visible.length === 0 ? (
        <Card variant="glass">
          <PageState
            icon={ListFilter}
            tone="muted"
            title={t("tasksEmptyTitle")}
            description={t("tasksEmptyDescription")}
            action={
              <Button variant="glass" size="lg" className="min-h-11" onClick={() => setFilter("all")}>
                {t("showAllTasks")}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden">
          <TaskTable items={visible} roadmap={roadmap} completion={completion} label={t("tasksTitle")} />
        </Card>
      )}
      <CompletionAnnouncer completion={completion} />
    </>
  )
}

/** Header, filter tabs and a list card (a table of rows, or a grid of cards). */
export function ListSkeleton({ variant }: { variant: "table" | "grid" }) {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-11 w-96 max-w-full rounded-icon" />
      {variant === "table" ? (
        <CardSkeleton className="space-y-1 p-0 sm:p-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 sm:px-5">
              <Skeleton className="size-7.5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardSkeleton>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} className="h-52" />
          ))}
        </div>
      )}
    </LoadingRegion>
  )
}

export { TasksPage }
