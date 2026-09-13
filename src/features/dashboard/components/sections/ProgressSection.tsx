import { BookOpen, Lock, Map } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

interface ProgressSectionProps {
  stageTitles: string[]
  stageCount: number
  currentStageIndex: number
}

function ProgressSection({ stageTitles, stageCount, currentStageIndex }: ProgressSectionProps) {
  const t = useT("dashboard")

  return (
    <section id="roadmap" aria-labelledby="progress-heading" className="scroll-mt-20">
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Map className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="progress-heading"
                className="text-heading-sm font-semibold text-foreground"
              >
                {t("progressTitle", "Progress")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("progressStageLabel", "Stage {current} of {total}", {
                  current: currentStageIndex + 1,
                  total: stageCount,
                })}
              </p>
            </div>
          </div>
          <span className="badge-base bg-primary/10 text-xs text-primary">
            {t("inProgress", "In Progress")}
          </span>
        </div>
        <CardContent className="space-y-3 p-5">
          {stageTitles.map((item, index) => (
            <div
              key={item}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-colors duration-200",
                index === currentStageIndex
                  ? "border-primary/30"
                  : "border-border/50 opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  index === currentStageIndex ? "bg-primary/10" : "bg-muted"
                )}
              >
                {index === currentStageIndex ? (
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium",
                    index !== currentStageIndex && "text-muted-foreground"
                  )}
                >
                  {t(`milestones.${item}`, item)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {index === currentStageIndex
                    ? t("currentMilestone", "Current Milestone")
                    : t("upcomingMilestone", "Up Next")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

export { ProgressSection }