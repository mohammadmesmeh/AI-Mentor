"use client"

import { useState } from "react"
import { Library, ListFilter } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { Card, CardTitle } from "@/components/ui/card"
import { FilterTabs } from "@/shared/components/ui/FilterTabs"
import { taskPath } from "@/lib/workspaceRoutes"
import type { ResourceType, Roadmap } from "@/lib/api/types"
import { useLearnerRoadmap } from "../../hooks/useLearnerRoadmap"
import { RESOURCE_TYPES, resourceItems, type ResourceItem } from "../../lib/learningItems"
import { RESOURCE_TYPE_ICON } from "../../lib/typeIcons"
import { ResourceOpenLink, ResourceSource, RoadmapGate } from "../learning/shared"
import { IconBox, PageHeader, PageState } from "../ui/workspace"
import { ListSkeleton } from "./tasks-page"

type ResourceFilter = "all" | ResourceType

function ResourcesPage() {
  const state = useLearnerRoadmap()
  return (
    <RoadmapGate state={state} skeleton={<ListSkeleton variant="grid" />}>
      {(roadmap) => <ResourcesContent roadmap={roadmap} />}
    </RoadmapGate>
  )
}

function ResourcesContent({ roadmap }: { roadmap: Roadmap }) {
  const t = useT("workspace")
  const [filter, setFilter] = useState<ResourceFilter>("all")
  const items = resourceItems(roadmap)
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
      <PageHeader title={t("resourcesPageTitle")} description={t("resourcesDescription")} />
      {items.length === 0 ? (
        <Card variant="glass">
          <PageState icon={Library} tone="muted" title={t("noResourcesTitle")} description={t("noResourcesDescription")} />
        </Card>
      ) : (
        <>
          <FilterTabs label={t("resourceFilterLabel")} options={options} value={filter} onChange={setFilter} />
          <p className="sr-only" aria-live="polite">
            {t("resourcesCount", undefined, { count: visible.length })}
          </p>
          {visible.length === 0 ? (
            <Card variant="glass">
              <PageState
                icon={ListFilter}
                tone="muted"
                title={t("resourcesEmptyTitle")}
                description={t("resourcesEmptyDescription", undefined, { type: t(`resourceType.${filter}`) })}
                action={
                  <Button variant="glass" size="lg" className="min-h-11" onClick={() => setFilter("all")}>
                    {t("showAllResources")}
                  </Button>
                }
              />
            </Card>
          ) : (
            <ul aria-label={t("resourcesPageTitle")} className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <ResourceCard key={`${item.task.id}-${item.resource.id}`} item={item} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}

/** One resource: its type, title and site, the task it belongs to, and Open. */
function ResourceCard({ item: { resource, task } }: { item: ResourceItem }) {
  const t = useT("workspace")
  return (
    <Card as="li" variant="glass" className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <IconBox icon={RESOURCE_TYPE_ICON[resource.type]} tone={resource.type === "video" ? "navy" : "soft"} />
        <span className="text-[0.8125rem] font-bold text-status-available">
          {t(`resourceType.${resource.type}`, resource.type)}
        </span>
      </div>
      <div className="space-y-1">
        <CardTitle dir="auto" className="text-[0.9375rem] leading-normal font-bold wrap-break-word sm:text-[0.9375rem]">
          {resource.title}
        </CardTitle>
        <ResourceSource resource={resource} showType={false} />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
        <Link
          href={taskPath(task.id)}
          className="min-w-0 rounded-md text-xs font-semibold text-secondary-700 no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
        >
          <span dir="auto" className="wrap-break-word">
            {t("resourceForTask", undefined, { title: task.title })}
          </span>
        </Link>
        <ResourceOpenLink resource={resource} label={t("open")} size="sm" />
      </div>
    </Card>
  )
}

export { ResourcesPage }
