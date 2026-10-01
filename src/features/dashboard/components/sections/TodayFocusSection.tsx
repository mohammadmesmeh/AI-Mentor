import { Target } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import { taskPath, WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { SectionState } from "../states/SectionState"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { TASK_STATUS_STYLE } from "../../lib/statusStyles"
import { CardLink, TaskStatusMark, WorkspaceCard } from "../ui/workspace"

interface TodayFocusSectionProps {
  /** At most 3 actionable tasks, current first (spec 007 FR-008). */
  tasks: CurrentTaskRef[]
}

function TodayFocusSection({ tasks }: TodayFocusSectionProps) {
  const t = useT("dashboard")
  const tw = useT("workspace")

  return (
    <WorkspaceCard
      titleId="today-focus-heading"
      title={t("todayFocusTitle", "Today's Focus")}
      action={<CardLink href={WORKSPACE_ROUTES.tasks}>{tw("allTasks")}</CardLink>}
    >
      {tasks.length === 0 ? (
        <SectionState icon={Target} title={t("noFocusTasksTitle")} description={t("noFocusTasksDescription")} />
      ) : (
        <ol className="-my-2 m-0 list-none divide-y divide-line p-0">
          {tasks.map(({ task }, index) => {
            // The first task is the one to do next — the only purple one.
            const status = index === 0 ? "current" : "available"
            const label = tw(TASK_STATUS_STYLE[status].labelKey)
            return (
              <li key={task.id}>
                <Link
                  href={taskPath(task.id)}
                  className="group flex min-h-11 items-center gap-3.5 rounded-md py-3.5 no-underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <TaskStatusMark status={status} label={label} />
                  {/* Title and meta share the page's side; the title keeps its own direction. */}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold wrap-break-word text-ink group-hover:underline">
                      <bdi>{task.title}</bdi>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`taskType.${task.type}`, task.type)}
                      {task.estimatedMinutes > 0 && ` · ${t("taskMinutes", undefined, { count: task.estimatedMinutes })}`}
                    </span>
                  </span>
                  {/* Already read out with the mark; shown for sighted users. */}
                  <span aria-hidden="true" className="hidden sm:inline-flex">
                    <StatusDot tone={TASK_STATUS_STYLE[status].tone} label={label} className="text-xs" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </WorkspaceCard>
  )
}

export { TodayFocusSection }
