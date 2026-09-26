import type { ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"

/** Minimal English messages covering only the namespaces under test. */
export const TEST_MESSAGES = {
  onboarding: {
    onboardingIncompleteTitle: "Your learning profile needs a few more details",
    onboardingIncompleteDescription: "Complete these to unlock your personalized roadmap:",
    missingFieldsLabel: "Missing information:",
    missingGoal: "Goal",
    missingLevel: "Current skill level",
    missingDesiredOutcome: "Desired outcome",
    missingMinutes: "Minutes per week",
    missingMethods: "Preferred learning methods",
    missingResourceLanguage: "Learning resource language",
    backToOnboarding: "Complete onboarding",
  },
  dashboard: {
    roadmapGenerationTitle: "Generate your learning roadmap",
    roadmapGenerationDescription: "Answer a few questions first.",
    generateRoadmap: "Generate Roadmap",
    roadmapReady: "Your roadmap is ready!",
    stageCompleted: "Completed",
    stageActive: "In Progress",
    stageUpcoming: "Upcoming",
    taskCompleted: "Completed",
    taskAvailable: "Available",
    taskUpcoming: "Upcoming",
    taskComplete: "Mark Complete",
    taskSkip: "Skip",
    taskResources: "resources",
    taskType: {
      read: "Read",
      watch: "Watch",
      quiz: "Quiz",
      project: "Project",
      assignment: "Assignment",
      coding_challenge: "Coding challenge",
    },
  },
} as const

export function IntlWrapper({
  children,
  locale = "en",
  messages = TEST_MESSAGES,
}: {
  children: ReactNode
  /** Override to render against the real `messages/<locale>.json` in locale-aware tests. */
  locale?: string
  messages?: Record<string, unknown>
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}