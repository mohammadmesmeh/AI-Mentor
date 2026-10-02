import type { ApiError } from "./errors"

/**
 * The learning-profile fields of PUT /me/learning-profile (contract §12), as
 * the server names them in a 422 `error.details`.
 */
export const LEARNING_PROFILE_FIELDS = [
  "goal",
  "self_assessed_level",
  "desired_outcome",
  "available_minutes_per_week",
  "preferred_learning_methods",
] as const
export type LearningProfileField = (typeof LEARNING_PROFILE_FIELDS)[number]

/**
 * The fields a 422 validation_failed rejected. Array rules come back per item
 * ("preferred_learning_methods.0"), so the index is dropped to get the field.
 * The server's messages are English-only and never shown (FR-018): callers
 * show their own localized message for each field.
 */
export function rejectedFields<T extends string>(error: ApiError, known: readonly T[]): T[] {
  if (error.code !== "validation_failed" || !error.details) return []
  const found = new Set<T>()
  for (const key of Object.keys(error.details)) {
    const field = key.split(".")[0] as T
    if (known.includes(field)) found.add(field)
  }
  return known.filter((field) => found.has(field))
}
