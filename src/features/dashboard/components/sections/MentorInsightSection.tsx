import { Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"

interface MentorInsightSectionProps {
  status?: "unavailable"
}

function MentorInsightSection({ status = "unavailable" }: MentorInsightSectionProps) {
  const t = useT("dashboard")

  return (
    <section aria-labelledby="mentor-insight-heading">
      <Card className="relative h-full">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-1.5 rounded-s-xl bg-primary/60"
        />
        <div className="flex items-center gap-3 border-b border-border/50 p-5 ps-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h2
            id="mentor-insight-heading"
            className="text-heading-sm font-semibold text-foreground"
          >
            {t("mentorInsightTitle", "AI Mentor Insight")}
          </h2>
        </div>
        <CardContent className="p-5 ps-6">
          {status === "unavailable" && (
            <SectionState
              title={t("insightUnavailableTitle", "Personalized insight isn't available yet")}
              description={t(
                "insightUnavailableDescription",
                "As you learn, your AI mentor will share observations and a recommended next step here."
              )}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export { MentorInsightSection }