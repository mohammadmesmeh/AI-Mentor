import { Target } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"
import type { CurrentTaskRef } from "../../lib/roadmapProgress"
import { focusTaskAnchor, taskAnchorId } from "../../lib/focusTask"
import { taskIcon } from "../../lib/taskIcon"

interface TodayFocusSectionProps {
  /** At most 3 actionable tasks, current first (spec 007 FR-008). */
  tasks: CurrentTaskRef[]
}

function TodayFocusSection({ tasks }: TodayFocusSectionProps) {
  const t = useT("dashboard")

  return (
    <section aria-labelledby="today-focus-heading">
      <Card className="h-full">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2
              id="today-focus-heading"
              className="text-heading-sm font-semibold text-foreground"
            >
              {t("todayFocusTitle", "Today's Focus")}
            </h2>
          </div>
          <span className="badge-base bg-muted text-xs text-muted-foreground">
            {t("suggested", "Suggested")}
          </span>
        </div>
        <CardContent className="p-2">
          {tasks.length === 0 ? (
            <div className="p-3">
              <SectionState
                title={t("noFocusTasksTitle", "No focus tasks yet")}
                description={t("noFocusTasksDescription")}
              />
            </div>
          ) : (
            <ol className="divide-y divide-border/50">
              {tasks.map(({ task }) => (
                <li key={task.id}>
                  <a
                    href={`#${taskAnchorId(task.id)}`}
                    onClick={() => focusTaskAnchor(task.id)}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                  </a>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export { TodayFocusSection }
