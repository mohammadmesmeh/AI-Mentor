import { describe, expect, it } from "vitest"
import { LEARNING_PROFILE_FIELDS, rejectedFields } from "@/lib/api/validation"
import type { ApiError } from "@/lib/api/errors"

const validation = (details: Record<string, unknown>): ApiError => ({
  code: "validation_failed",
  message: "x",
  details,
  requestId: "r",
  category: "invalid_input",
})

describe("rejectedFields (422 validation_failed → form fields)", () => {
  it("knows exactly the five request fields of §12 (sources are server-derived)", () => {
    expect([...LEARNING_PROFILE_FIELDS]).toEqual([
      "goal",
      "self_assessed_level",
      "desired_outcome",
      "available_minutes_per_week",
      "preferred_learning_methods",
    ])
  })

  it("collapses per-item array errors (preferred_learning_methods.0/.1) to their field", () => {
    const error = validation({
      "preferred_learning_methods.0": ["invalid"],
      "preferred_learning_methods.1": ["invalid"],
      available_minutes_per_week: ["at least 15"],
    })
    expect(rejectedFields(error, LEARNING_PROFILE_FIELDS)).toEqual([
      "available_minutes_per_week",
      "preferred_learning_methods",
    ])
  })

  it("ignores unknown keys and non-validation errors", () => {
    expect(rejectedFields(validation({ something_else: ["x"] }), LEARNING_PROFILE_FIELDS)).toEqual([])
    expect(
      rejectedFields({ ...validation({ goal: ["x"] }), code: "internal_error", category: "unexpected" }, LEARNING_PROFILE_FIELDS)
    ).toEqual([])
  })
})
