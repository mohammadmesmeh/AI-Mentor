import { ChevronRight, Target } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { taskPath } from "@/lib/workspaceRoutes"
import { SectionState } from "../states/SectionState"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { taskIcon } from "../../lib/taskIcon"
import { MetaChip, Panel, PanelHeader } from "../ui/workspace"

interface TodayFocusSectionProps {
  /** At most 3 actionable tasks, current first (spec 007 FR-008). */
  tasks: CurrentTaskRef[]
}

function TodayFocusSection({ tasks }: TodayFocusSectionProps) {
  const t = useT("dashboard")

  return (
    <Panel aria-labelledby="today-focus-heading">
      <PanelHeader
        id="today-focus-heading"
        icon={Target}
        title={t("todayFocusTitle", "Today's Focus")}
        trailing={<MetaChip>{t("suggested", "Suggested")}</MetaChip>}
      />
      <div className="p-2">
        {tasks.length === 0 ? (
          <div className="p-3">
            <SectionState
              title={t("noFocusTasksTitle", "No focus tasks yet")}
              description={t("noFocusTasksDescription")}
            />
          </div>
        ) : (
          <ol className="divide-y divide-border/50">
            {tasks.map(({ task }, index) => (
              <li key={task.id}>
                <Link
                  href={taskPath(task.id)}
                  className="group flex min-h-11 items-center gap-3 rounded-md p-3 transition-colors duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden="true"
                    className={
                      index === 0
                        ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-accent-700/10 text-accent-700 dark:text-accent-300"
                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary dark:text-primary-200"
                    }
                  >
                    {taskIcon(task.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span dir="auto" className="block wrap-break-word text-sm font-medium text-foreground">
                      {task.title}
                    </span>
                    <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{t(`taskType.${task.type}`, task.type)}</span>
                      {task.estimatedMinutes > 0 && (
                        <span>{t("taskMinutes", undefined, { count: task.estimatedMinutes })}</span>
                      )}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Panel>
  )
}

export { TodayFocusSection }
