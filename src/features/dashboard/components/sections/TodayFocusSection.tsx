import { Target } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"

interface TodayFocusSectionProps {
  status?: "unavailable"
}

function TodayFocusSection({ status = "unavailable" }: TodayFocusSectionProps) {
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
        <CardContent className="p-5">
          {status === "unavailable" && (
            <SectionState
              title={t("noFocusTasksTitle", "No focus tasks yet")}
              description={t(
                "noFocusTasksDescription",
                "Priority tasks will appear here once a current lesson is set."
              )}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export { TodayFocusSection }