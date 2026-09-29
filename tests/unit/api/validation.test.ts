import { describe, expect, it } from "vitest"
import { LEARNING_PROFILE_FIELDS, rejectedFields } from "@/lib/api/validation"
import { toggleSource } from "@/features/onboarding/lib/profileLabels"
import type { ApiError } from "@/lib/api/errors"

const validation = (details: Record<string, unknown>): ApiError => ({
  code: "validation_failed",
  message: "x",
  details,
  requestId: "r",
  category: "invalid_input",
})

describe("rejectedFields (422 validation_failed → form fields)", () => {
  it("maps the missing-field error Render returns when preferred_resource_sources isn't sent", () => {
    const error = validation({ preferred_resource_sources: ["The preferred resource sources field is required."] })
    expect(rejectedFields(error, LEARNING_PROFILE_FIELDS)).toEqual(["preferred_resource_sources"])
  })

  it("collapses per-item array errors (preferred_resource_sources.0/.1) to their field", () => {
    const error = validation({
      "preferred_resource_sources.0": ["duplicate"],
      "preferred_resource_sources.1": ["duplicate"],
      available_minutes_per_week: ["at least 15"],
    })
    expect(rejectedFields(error, LEARNING_PROFILE_FIELDS)).toEqual([
      "available_minutes_per_week",
      "preferred_resource_sources",
    ])
  })

  it("ignores unknown keys and non-validation errors", () => {
    expect(rejectedFields(validation({ something_else: ["x"] }), LEARNING_PROFILE_FIELDS)).toEqual([])
    expect(
      rejectedFields({ ...validation({ goal: ["x"] }), code: "internal_error", category: "unexpected" }, LEARNING_PROFILE_FIELDS)
    ).toEqual([])
  })
})

describe("toggleSource keeps the learner's priority order (contract §12)", () => {
  it("adds new picks last and moves the rest up when one is removed", () => {
    let sources = toggleSource([], "courses")
    sources = toggleSource(sources, "youtube")
    sources = toggleSource(sources, "articles")
    expect(sources).toEqual(["courses", "youtube", "articles"])
    expect(toggleSource(sources, "courses")).toEqual(["youtube", "articles"])
  })
})
