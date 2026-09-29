import { CircleDashed } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { taskPath } from "@/lib/workspaceRoutes"
import type { TaskItem } from "../../lib/learningItems"
import { SectionState } from "../states/SectionState"
import { WorkspaceCard } from "../ui/workspace"

/** The tasks the learner has finished (newest first when the server dates them). */
export function CompletedTasksCard({ items }: { items: TaskItem[] }) {
  const t = useT("workspace")
  const td = useT("dashboard")
  const head = "h-9 px-0 pe-3 text-[0.8125rem] font-medium text-muted-foreground last:pe-0"
  const cell = "px-0 py-2.5 pe-3 whitespace-normal last:pe-0"

  return (
    <WorkspaceCard
      titleId="completed-tasks-heading"
      title={t("completedTasksTitle")}
      description={t("completedTasksDescription")}
    >
      {items.length === 0 ? (
        <SectionState icon={CircleDashed} title={t("completedTasksEmptyTitle")} description={t("completedTasksEmptyDescription")} />
      ) : (
        <Table aria-labelledby="completed-tasks-heading">
          <TableHeader className="[&_tr]:border-line">
            <TableRow className="hover:bg-transparent">
              <TableHead className={head}>{t("columnTask")}</TableHead>
              <TableHead className={head}>{t("columnStage")}</TableHead>
              <TableHead className={`${head} hidden sm:table-cell`}>{t("columnType")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ task, stage }) => (
              <TableRow key={task.id} className="border-line hover:bg-transparent">
                <TableCell className={cell}>
                  <Link
                    href={taskPath(task.id)}
                    dir="auto"
                    className="rounded-sm font-medium wrap-break-word text-ink no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className={`${cell} text-muted-foreground`}>
                  <span dir="auto">{stage.title}</span>
                </TableCell>
                <TableCell className={`${cell} hidden text-muted-foreground sm:table-cell`}>
                  {td(`taskType.${task.type}`, task.type)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </WorkspaceCard>
  )
}
