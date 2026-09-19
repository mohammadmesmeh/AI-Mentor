import { describe, expect, it } from "vitest"
import { generationFailureKey } from "@/lib/api/errors"

describe("roadmap generation failure-code mapping (FR-023)", () => {
  it("T032: each recognized failure_code maps to its specific friendly explanation", () => {
    expect(generationFailureKey("invalid_generated_roadmap")).toBe("generationFailedValidation")
    expect(generationFailureKey("roadmap_generation_failed")).toBe("generationFailedInternal")
  })

  it("T032b: unrecognized or null failure codes fall back to the generic explanation", () => {
    expect(generationFailureKey("some_unknown_failure")).toBe("generationFailedGeneric")
    expect(generationFailureKey(null)).toBe("generationFailedGeneric")
  })
})