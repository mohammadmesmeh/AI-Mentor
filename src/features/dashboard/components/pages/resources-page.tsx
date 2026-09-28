"use client"

import { useMemo, useState } from "react"
import { Library, ListFilter } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { taskPath } from "@/lib/workspaceRoutes"
import type { ResourceType, Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { RESOURCE_TYPES, resourceItems } from "../../lib/learningItems"
import { ResourceLink, RoadmapGate } from "../learning/shared"
import { FilterChips } from "../learning/FilterChips"
import { PageHeader, PageState, Panel } from "../ui/workspace"
import { ListSkeleton } from "./tasks-page"

type ResourceFilter = "all" | ResourceType

function ResourcesPage() {
  const state = useLearnerRoadmap()
  return (
    <RoadmapGate state={state} skeleton={<ListSkeleton />}>
      {(roadmap) => <ResourcesContent roadmap={roadmap} />}
    </RoadmapGate>
  )
}

function ResourcesContent({ roadmap }: { roadmap: Roadmap }) {
  const t = useT("workspace")
  const [filter, setFilter] = useState<ResourceFilter>("all")
  const items = useMemo(() => resourceItems(roadmap), [roadmap])
  const visible = filter === "all" ? items : items.filter((item) => item.resource.type === filter)
  // Every contract type is offered with its count — a 0 is honest information
  // (e.g. a roadmap with no videos).
  const options = (["all", ...RESOURCE_TYPES] as ResourceFilter[]).map((value) => ({
    value,
    label: t(`resourceType.${value}`),
    count: value === "all" ? items.length : items.filter((item) => item.resource.type === value).length,
  }))

  return (
    <>
      <PageHeader
        eyebrow={t("resourcesEyebrow")}
        title={t("resourcesPageTitle")}
        description={t("resourcesDescription")}
      />
      {items.length === 0 ? (
        <Panel>
          <PageState icon={Library} tone="muted" title={t("noResourcesTitle")} description={t("noResourcesDescription")} />
        </Panel>
      ) : (
        <>
          <FilterChips label={t("resourceFilterLabel")} options={options} value={filter} onChange={setFilter} />
          <p className="sr-only" aria-live="polite">
            {t("resourcesCount", undefined, { count: visible.length })}
          </p>
          {visible.length === 0 ? (
            <Panel>
              <PageState
                icon={ListFilter}
                tone="muted"
                title={t("resourcesEmptyTitle")}
                description={t("resourcesEmptyDescription", undefined, { type: t(`resourceType.${filter}`) })}
                action={
                  <Button variant="secondary" size="lg" className="min-h-11" onClick={() => setFilter("all")}>
                    {t("showAllResources")}
                  </Button>
                }
              />
            </Panel>
          ) : (
            <Panel aria-label={t("resourcesPageTitle")}>
              <ul className="divide-y divide-border/50">
                {visible.map(({ resource, task }) => (
                  <li
                    key={`${task.id}-${resource.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0 flex-1 basis-64">
                      <ResourceLink resource={resource} t={t} />
                    </div>
                    <Link
                      href={taskPath(task.id)}
                      className="inline-flex min-h-11 max-w-full items-center rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span dir="auto" className="wrap-break-word">
                        {t("resourceForTask", undefined, { title: task.title })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </>
  )
}

export { ResourcesPage }
