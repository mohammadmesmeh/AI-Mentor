import { useT } from "@/shared/hooks/useT"

interface WelcomeSectionProps {
  learnerName?: string
  learningGoal?: string
}

function WelcomeSection({ learnerName, learningGoal }: WelcomeSectionProps) {
  const t = useT("dashboard")

  return (
    <section aria-labelledby="dashboard-welcome-heading">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">
        {t("welcomeEyebrow", "Your learning workspace")}
      </p>
      <h1
        id="dashboard-welcome-heading"
        className="mt-1 text-heading-md font-semibold text-foreground"
      >
        {t("welcomeHeading", "Welcome back, {name}", { name: learnerName ?? "" })}
      </h1>
      {learningGoal && (
        <p className="mt-1 text-muted-foreground">{learningGoal}</p>
      )}
    </section>
  )
}

export { WelcomeSection }