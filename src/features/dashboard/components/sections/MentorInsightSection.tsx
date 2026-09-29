import { Sparkles } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"

/** No mentor/insight endpoint exists (contract §23) — an honest "coming soon" card. */
function MentorInsightSection() {
  const t = useT("dashboard")
  const tw = useT("workspace")

  return (
    <Card as="section" variant="dashed" aria-labelledby="mentor-insight-heading" className="p-5 sm:p-6">
      <SectionState
        kind="coming-soon"
        icon={Sparkles}
        titleAs="h2"
        titleId="mentor-insight-heading"
        title={t("mentorInsightTitle", "AI Mentor Insight")}
        badge={tw("comingSoon")}
        description={t("insightUnavailableDescription")}
      />
    </Card>
  )
}

export { MentorInsightSection }
