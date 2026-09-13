import { History } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"

interface RecentActivitySectionProps {
  status?: "unavailable"
}

function RecentActivitySection({ status = "unavailable" }: RecentActivitySectionProps) {
  const t = useT("dashboard")

  return (
    <section aria-labelledby="recent-activity-heading">
      <Card className="h-full">
        <div className="flex items-center gap-3 border-b border-border/50 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <History className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h2
            id="recent-activity-heading"
            className="text-heading-sm font-semibold text-foreground"
          >
            {t("recentActivityTitle", "Recent Activity")}
          </h2>
        </div>
        <CardContent className="p-5">
          {status === "unavailable" && (
            <SectionState
              title={t("noRecentActivityTitle", "No recent activity yet")}
              description={t(
                "noRecentActivityDescription",
                "Completed tasks and stage changes will appear here."
              )}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export { RecentActivitySection }