import { History } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { SectionState } from "../states/SectionState"
import { LinkButton, Panel, PanelHeader } from "../ui/workspace"

/**
 * No activity data exists in the contract (§23; the roadmap tree has no
 * completion timestamps), so this says so honestly and points to where the
 * learner's completed tasks are listed. docs/backend-issues.md #4.
 */
function RecentActivitySection() {
  const t = useT("dashboard")
  const tw = useT("workspace")

  return (
    <Panel aria-labelledby="recent-activity-heading">
      <PanelHeader id="recent-activity-heading" icon={History} title={t("recentActivityTitle", "Recent Activity")} />
      <div className="space-y-4 p-5">
        <SectionState title={t("noRecentActivityTitle")} description={t("noRecentActivityDescription")} />
        <LinkButton href={WORKSPACE_ROUTES.tasks} variant="secondary" className="w-full">
          {tw("viewCompletedTasks")}
        </LinkButton>
      </div>
    </Panel>
  )
}

export { RecentActivitySection }
