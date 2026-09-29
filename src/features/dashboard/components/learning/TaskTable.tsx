"use client"

import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { taskPath } from "@/lib/workspaceRoutes"
import type { Roadmap } from "@/lib/api/types"
import type { TaskCompletionState } from "../../hooks/useTaskCompletion"
import type { TaskItem } from "../../lib/learningItems"
import { canCompleteTask } from "../../lib/roadmapProgress"
import { TASK_STATUS_STYLE } from "../../lib/statusStyles"
import { TaskStatusMark } from "../ui/workspace"
import { MarkCompleteButton } from "./shared"

/**
 * Every task as a table row: status mark, title (links to the task), stage,
 * type, time, status and — when the server's rules allow — Mark complete.
 * Narrow screens fold stage/type/time under the title.
 */
export function TaskTable({
  items,
  roadmap,
  completion,
  label,
}: {
  items: TaskItem[]
  roadmap: Roadmap
  completion: TaskCompletionState
  label: string
}) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const head = "h-11 px-3 text-xs font-bold text-muted-foreground first:ps-4 last:pe-4 sm:first:ps-5 sm:last:pe-5"
  const cell = "px-3 py-3.5 first:ps-4 last:pe-4 sm:first:ps-5 sm:last:pe-5"

  return (
    <Table aria-label={label}>
      <TableHeader className="bg-glass-strong/40 [&_tr]:border-line">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(head, "w-12")}>
            <span className="sr-only">{t("columnStatus")}</span>
          </TableHead>
          <TableHead className={head}>{t("columnTask")}</TableHead>
          <TableHead className={cn(head, "hidden md:table-cell")}>{t("columnStage")}</TableHead>
          <TableHead className={cn(head, "hidden lg:table-cell")}>{t("columnType")}</TableHead>
          <TableHead className={cn(head, "hidden lg:table-cell")}>{t("columnTime")}</TableHead>
          <TableHead className={cn(head, "hidden sm:table-cell")}>{t("columnStatus")}</TableHead>
          <TableHead className={head}>
            <span className="sr-only">{t("columnAction")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(({ task, stage, status }) => {
          const style = TASK_STATUS_STYLE[status]
          const statusLabel = t(style.labelKey)
          const typeLabel = td(`taskType.${task.type}`, task.type)
          const minutes = task.estimatedMinutes > 0 ? td("taskMinutes", undefined, { count: task.estimatedMinutes }) : ""
          return (
            <TableRow
              key={task.id}
              className={cn("border-line hover:bg-segment/50", status === "current" && "bg-status-current/5")}
            >
              <TableCell className={cell}>
                <TaskStatusMark status={status} label={statusLabel} size="sm" />
              </TableCell>
              <TableCell className={cn(cell, "min-w-40 whitespace-normal")}>
                <Link
                  href={taskPath(task.id)}
                  dir="auto"
                  className={cn(
                    "rounded-sm text-sm font-semibold wrap-break-word no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    status === "completed" || style.tone === "neutral" ? "text-muted-foreground" : "text-ink"
                  )}
                >
                  {task.title}
                </Link>
                <span className="mt-0.5 block text-xs text-muted-foreground lg:hidden">
                  <span dir="auto" className="md:hidden">
                    {stage.title} ·{" "}
                  </span>
                  {typeLabel}
                  {minutes && ` · ${minutes}`}
                  {!task.isRequired && ` · ${t("optional")}`}
                </span>
              </TableCell>
              <TableCell className={cn(cell, "hidden text-[0.8125rem] whitespace-normal text-muted-foreground md:table-cell")}>
                <span dir="auto">{t("stageLabel", undefined, { position: stage.position, title: stage.title })}</span>
              </TableCell>
              <TableCell className={cn(cell, "hidden text-[0.8125rem] text-muted-foreground lg:table-cell")}>
                {typeLabel}
                {!task.isRequired && <span className="block text-xs">{t("optional")}</span>}
              </TableCell>
              <TableCell className={cn(cell, "hidden text-[0.8125rem] text-muted-foreground lg:table-cell")}>
                {minutes}
              </TableCell>
              <TableCell className={cn(cell, "hidden sm:table-cell")} aria-hidden="true">
                <StatusDot tone={style.tone} label={statusLabel} />
              </TableCell>
              <TableCell className={cn(cell, "text-end")}>
                <MarkCompleteButton
                  taskId={task.id}
                  canComplete={canCompleteTask(roadmap, task)}
                  completion={completion}
                  className="items-end"
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
