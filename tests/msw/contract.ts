/**
 * The server rules of API_CONTRACT.md that the MSW handlers enforce, so a
 * request the real backend would reject is rejected in tests too. Keep this in
 * step with the contract (§2 error shape, §11 preferences, §12 learning
 * profile, §13 onboarding status).
 */

export const LEVELS = ["complete_beginner", "some_experience", "intermediate"] as const
export const METHODS = ["hands_on_projects", "reading_docs", "video_walkthroughs", "quizzes_drills"] as const
export const SOURCES = ["youtube", "official_documentation", "articles", "courses"] as const

/** §12: the five request fields, all required. */
export const PROFILE_REQUEST_FIELDS = [
  "goal",
  "self_assessed_level",
  "desired_outcome",
  "available_minutes_per_week",
  "preferred_learning_methods",
] as const
/** §12: accepted from older clients only, validated, then ignored. */
const PROFILE_LEGACY_FIELDS = ["preferred_resource_sources"] as const

export type Details = Record<string, string[]>

/** §2: `{error: {code, message, details?}, meta: {request_id}}`. */
export function errorBody(code: string, message: string, details?: Details) {
  return {
    error: details ? { code, message, details } : { code, message },
    meta: { request_id: crypto.randomUUID() },
  }
}

function uniqueValuesFrom(value: unknown, allowed: readonly string[], field: string, details: Details) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
    details[field] = ["Must have 1 to 4 items."]
    return
  }
  value.forEach((item, i) => {
    if (typeof item !== "string" || !allowed.includes(item)) details[`${field}.${i}`] = ["The selected value is invalid."]
  })
  if (new Set(value).size !== value.length) details[field] = ["Values must be unique."]
}

/** §12 PUT validation. Returns the 422 details, or null when the body is valid. */
export function validateLearningProfilePut(body: unknown): Details | null {
  const details: Details = {}
  if (!body || typeof body !== "object" || Array.isArray(body)) return { body: ["Must be an object."] }
  const b = body as Record<string, unknown>

  for (const key of Object.keys(b)) {
    if (!(PROFILE_REQUEST_FIELDS as readonly string[]).includes(key) && !(PROFILE_LEGACY_FIELDS as readonly string[]).includes(key)) {
      details[key] = ["This field is not allowed."]
    }
  }
  for (const field of PROFILE_REQUEST_FIELDS) {
    if (b[field] === undefined || b[field] === null || b[field] === "") details[field] = ["This field is required."]
  }

  if (typeof b.goal === "string" && b.goal.length > 1000) details.goal = ["Max 1,000 characters."]
  else if (b.goal !== undefined && typeof b.goal !== "string") details.goal = ["Must be a string."]

  if (typeof b.desired_outcome === "string" && b.desired_outcome.length > 2000) details.desired_outcome = ["Max 2,000 characters."]
  else if (b.desired_outcome !== undefined && typeof b.desired_outcome !== "string") details.desired_outcome = ["Must be a string."]

  const minutes = b.available_minutes_per_week
  if (minutes !== undefined && (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 15 || minutes > 10_080)) {
    details.available_minutes_per_week = ["Must be an integer from 15 to 10,080."]
  }

  if (b.self_assessed_level !== undefined && !(LEVELS as readonly unknown[]).includes(b.self_assessed_level)) {
    details.self_assessed_level = ["The selected value is invalid."]
  }
  if (b.preferred_learning_methods !== undefined) {
    uniqueValuesFrom(b.preferred_learning_methods, METHODS, "preferred_learning_methods", details)
  }
  if (b.preferred_resource_sources !== undefined) {
    uniqueValuesFrom(b.preferred_resource_sources, SOURCES, "preferred_resource_sources", details)
  }

  return Object.keys(details).length > 0 ? details : null
}

/**
 * §12 derivation: sources follow the methods in selection order — video →
 * youtube, reading → official docs; practice/quizzes alone are supported by
 * official docs. Unique.
 */
export function deriveSources(methods: readonly string[] | null): string[] | null {
  if (!methods || methods.length === 0) return null
  const sources: string[] = []
  for (const method of methods) {
    const source = method === "video_walkthroughs" ? "youtube" : method === "reading_docs" ? "official_documentation" : null
    if (source && !sources.includes(source)) sources.push(source)
  }
  return sources.length > 0 ? sources : ["official_documentation"]
}

/** §11 PATCH validation: at least one field; a legacy `timezone` is accepted and ignored. */
export function validatePreferencesPatch(body: unknown): Details | null {
  const details: Details = {}
  if (!body || typeof body !== "object" || Array.isArray(body)) return { body: ["Must be an object."] }
  const b = body as Record<string, unknown>
  const known = ["ui_locale", "resource_language"]
  if (!Object.keys(b).some((key) => known.includes(key))) details.body = ["Send at least one field."]
  for (const key of Object.keys(b)) {
    if (!known.includes(key) && key !== "timezone") details[key] = ["This field is not allowed."]
  }
  if (b.ui_locale !== undefined && !["ar", "en"].includes(b.ui_locale as string)) details.ui_locale = ["The selected value is invalid."]
  if (b.resource_language !== undefined && !["ar", "en", "both"].includes(b.resource_language as string)) {
    details.resource_language = ["The selected value is invalid."]
  }
  if (b.timezone !== undefined && (typeof b.timezone !== "string" || b.timezone.length > 64)) details.timezone = ["Invalid timezone."]
  return Object.keys(details).length > 0 ? details : null
}

/** §13: the possible `missing_fields`, in the contract's order. */
export function missingFields(
  profile: Record<string, unknown> | null,
  preferences: { resource_language?: string } | null
): string[] {
  const missing: string[] = []
  for (const field of PROFILE_REQUEST_FIELDS) {
    const value = profile?.[field]
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) missing.push(field)
  }
  if (!preferences?.resource_language) missing.push("resource_language")
  return missing
}
