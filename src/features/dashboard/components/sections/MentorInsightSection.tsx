import { Sparkles } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { SectionState } from "../states/SectionState"
import { Panel, PanelHeader } from "../ui/workspace"

/** No mentor/insight endpoint exists (contract §23) — an honest unavailable state. */
function MentorInsightSection() {
  const t = useT("dashboard")

  return (
    <Panel aria-labelledby="mentor-insight-heading">
      <PanelHeader id="mentor-insight-heading" icon={Sparkles} title={t("mentorInsightTitle", "AI Mentor Insight")} />
      <div className="p-5">
        <SectionState title={t("insightUnavailableTitle")} description={t("insightUnavailableDescription")} />
      </div>
    </Panel>
  )
}

export { MentorInsightSection }
