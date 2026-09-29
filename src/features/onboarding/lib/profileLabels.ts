import type { LearningMethod, Preferences, ResourceSource, SelfAssessedLevel } from "@/lib/api/types"

/**
 * `onboarding.*` message keys for the contract's learning-profile and
 * preference values (§11, §12). Shared by the onboarding review and the
 * Profile/Settings pages so the same value always reads the same way.
 */
export const LEVELS: readonly SelfAssessedLevel[] = ["complete_beginner", "some_experience", "intermediate"]
export const METHODS: readonly LearningMethod[] = ["hands_on_projects", "reading_docs", "video_walkthroughs", "quizzes_drills"]
export const SOURCES: readonly ResourceSource[] = ["youtube", "official_documentation", "articles", "courses"]

export const sourceKeyMap: Record<ResourceSource, string> = {
  youtube: "sourceYoutube",
  official_documentation: "sourceDocs",
  articles: "sourceArticles",
  courses: "sourceCourses",
}

/**
 * Toggles a source while keeping the learner's priority order (contract §12:
 * array order is priority): a new pick goes last, removing one moves the rest up.
 */
export function toggleSource(sources: readonly ResourceSource[], source: ResourceSource): ResourceSource[] {
  return sources.includes(source) ? sources.filter((s) => s !== source) : [...sources, source]
}

export const levelKeyMap: Record<SelfAssessedLevel, string> = {
  complete_beginner: "beginner",
  some_experience: "someExperience",
  intermediate: "intermediate",
}

export const levelDescriptionKeyMap: Record<SelfAssessedLevel, string> = {
  complete_beginner: "beginnerDesc",
  some_experience: "someExperienceDesc",
  intermediate: "intermediateDesc",
}

export const preferenceKeyMap: Record<LearningMethod, string> = {
  hands_on_projects: "handsOn",
  video_walkthroughs: "video",
  reading_docs: "reading",
  quizzes_drills: "quizzes",
}

export const uiLocaleKeyMap: Record<Preferences["uiLocale"], string> = {
  ar: "prefArabic",
  en: "prefEnglish",
}

export const resourceLanguageKeyMap: Record<Preferences["resourceLanguage"], string> = {
  ar: "prefArabic",
  en: "prefEnglish",
  both: "prefBoth",
}
