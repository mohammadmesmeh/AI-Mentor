import { Clock, Gauge, Target } from "lucide-react"

import { useT } from "@/shared/hooks/useT"
import { MetaItem, MetaList } from "@/shared/components/ui/MetaItem"
import type { SelfAssessedLevel } from "@/lib/api/types"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { levelKeyMap } from "@/features/onboarding/lib/profileLabels"
import { LinkButton, PageHeader } from "../ui/workspace"

interface WelcomeSectionProps {
  learnerName?: string
  learningGoal?: string
  level?: SelfAssessedLevel
  minutesPerWeek?: number
}

/** The Overview's h1: a greeting with the learner's goal, level and weekly time. */
function WelcomeSection({ learnerName, learningGoal, level, minutesPerWeek }: WelcomeSectionProps) {
  const t = useT("dashboard")
  const tw = useT("workspace")
  const to = useT("onboarding")
  const ta = useT("account")

  return (
    <PageHeader
      title={t("welcomeHeading", "Welcome back, {name}", { name: learnerName ?? "" })}
      meta={
        <MetaList>
          {learningGoal && (
            <MetaItem icon={Target}>
              <span dir="auto">{tw("metaGoal", undefined, { goal: learningGoal })}</span>
            </MetaItem>
          )}
          {level && <MetaItem icon={Gauge}>{tw("metaLevel", undefined, { level: to(levelKeyMap[level]) })}</MetaItem>}
          {minutesPerWeek !== undefined && (
            <MetaItem icon={Clock}>{ta("minutesValue", undefined, { count: minutesPerWeek })}</MetaItem>
          )}
        </MetaList>
      }
      action={
        <LinkButton href={WORKSPACE_ROUTES.roadmap} variant="glass" className="hidden sm:inline-flex">
          {tw("viewFullPlan")}
        </LinkButton>
      }
    />
  )
}

export { WelcomeSection }
