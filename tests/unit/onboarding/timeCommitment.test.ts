import { describe, expect, it } from "vitest"
import {
  MAX_MINUTES_PER_WEEK,
  MIN_MINUTES_PER_WEEK,
  TIME_PRESETS,
  bestUnit,
  choiceFromMinutes,
  choiceToMinutes,
  formatWeekly,
  parseAmount,
  toMinutes,
  validateChoice,
  validateMinutes,
} from "@/features/onboarding/lib/timeCommitment"

describe("time presets → minutes", () => {
  it("are 30 min, 1, 2, 3, 5 and 10 hours, sent as minutes", () => {
    expect(TIME_PRESETS).toEqual([30, 60, 120, 180, 300, 600])
    for (const minutes of TIME_PRESETS) {
      expect(choiceToMinutes({ kind: "preset", minutes })).toBe(minutes)
    }
  })

  it("every preset is inside the contract's range", () => {
    for (const minutes of TIME_PRESETS) expect(validateMinutes(minutes)).toBeNull()
  })
})

describe("custom value → minutes", () => {
  it("converts hours to whole minutes", () => {
    expect(choiceToMinutes({ kind: "custom", amount: "4", unit: "hours" })).toBe(240)
    expect(choiceToMinutes({ kind: "custom", amount: "1.5", unit: "hours" })).toBe(90)
    expect(choiceToMinutes({ kind: "custom", amount: "2.25", unit: "hours" })).toBe(135)
    // A fraction of a minute rounds to the nearest whole minute.
    expect(toMinutes(0.01, "hours")).toBe(1)
  })

  it("keeps minutes as minutes", () => {
    expect(choiceToMinutes({ kind: "custom", amount: "45", unit: "minutes" })).toBe(45)
  })

  it("reads Arabic-Indic digits and a comma decimal separator", () => {
    expect(parseAmount("٤٥")).toBe(45)
    expect(parseAmount("۱۲")).toBe(12)
    expect(parseAmount("1,5")).toBe(1.5)
    expect(parseAmount("١٫٥")).toBe(1.5)
    expect(choiceToMinutes({ kind: "custom", amount: " ٢ ", unit: "hours" })).toBe(120)
  })

  it("is null for an empty, negative or non-numeric amount", () => {
    expect(choiceToMinutes({ kind: "custom", amount: "", unit: "hours" })).toBeNull()
    expect(choiceToMinutes({ kind: "custom", amount: "abc", unit: "minutes" })).toBeNull()
    expect(choiceToMinutes({ kind: "custom", amount: "-3", unit: "hours" })).toBeNull()
    expect(choiceToMinutes({ kind: "custom", amount: "0", unit: "hours" })).toBeNull()
    expect(choiceToMinutes(null)).toBeNull()
  })
})

describe("stored minutes → choice (Profile page, resumed onboarding)", () => {
  it("selects the matching preset", () => {
    expect(choiceFromMinutes(30)).toEqual({ kind: "preset", minutes: 30 })
    expect(choiceFromMinutes(600)).toEqual({ kind: "preset", minutes: 600 })
  })

  it("otherwise selects Other in the clearest unit", () => {
    expect(choiceFromMinutes(240)).toEqual({ kind: "custom", amount: "4", unit: "hours" })
    expect(choiceFromMinutes(90)).toEqual({ kind: "custom", amount: "1.5", unit: "hours" })
    expect(choiceFromMinutes(45)).toEqual({ kind: "custom", amount: "45", unit: "minutes" })
    expect(choiceFromMinutes(100)).toEqual({ kind: "custom", amount: "100", unit: "minutes" })
    expect(choiceFromMinutes(10_080)).toEqual({ kind: "custom", amount: "168", unit: "hours" })
  })

  it("has no choice without a value", () => {
    expect(choiceFromMinutes(null)).toBeNull()
    expect(choiceFromMinutes(undefined)).toBeNull()
  })

  it("round-trips: what is loaded is what is sent back", () => {
    for (const minutes of [15, 30, 45, 90, 100, 240, 360, 1000, 10_080]) {
      expect(choiceToMinutes(choiceFromMinutes(minutes))).toBe(minutes)
    }
  })

  it("picks hours for whole and half hours from 60 up", () => {
    expect(bestUnit(30)).toEqual({ amount: 30, unit: "minutes" })
    expect(bestUnit(60)).toEqual({ amount: 1, unit: "hours" })
    expect(bestUnit(150)).toEqual({ amount: 2.5, unit: "hours" })
    expect(bestUnit(125)).toEqual({ amount: 125, unit: "minutes" })
  })
})

describe("contract limits (§12: integer, 15–10,080)", () => {
  it("accepts the bounds", () => {
    expect(MIN_MINUTES_PER_WEEK).toBe(15)
    expect(MAX_MINUTES_PER_WEEK).toBe(10_080)
    expect(validateMinutes(15)).toBeNull()
    expect(validateMinutes(10_080)).toBeNull()
  })

  it("rejects values outside them", () => {
    expect(validateMinutes(14)).toBe("tooLow")
    expect(validateMinutes(10_081)).toBe("tooHigh")
    expect(validateMinutes(null)).toBe("required")
    expect(validateMinutes(Number.NaN)).toBe("required")
    expect(validateMinutes(20.5)).toBe("invalid")
  })

  it("checks a custom choice as typed", () => {
    expect(validateChoice(null)).toBe("required")
    expect(validateChoice({ kind: "custom", amount: "", unit: "hours" })).toBe("required")
    expect(validateChoice({ kind: "custom", amount: "1.2.3", unit: "hours" })).toBe("invalid")
    expect(validateChoice({ kind: "custom", amount: "10", unit: "minutes" })).toBe("tooLow")
    expect(validateChoice({ kind: "custom", amount: "0.2", unit: "hours" })).toBe("tooLow")
    expect(validateChoice({ kind: "custom", amount: "169", unit: "hours" })).toBe("tooHigh")
    expect(validateChoice({ kind: "custom", amount: "168", unit: "hours" })).toBeNull()
    expect(validateChoice({ kind: "custom", amount: "15", unit: "minutes" })).toBeNull()
  })
})

describe("formatWeekly", () => {
  const t = (key: string, values?: Record<string, string | number>) =>
    key === "perWeek" ? `${values?.duration} per week` : `${key}:${values?.n}:${values?.count}`

  it("shows the clearest unit with Western digits; count drives the plural", () => {
    expect(formatWeekly(t, 120)).toBe("durationHours:2:2 per week")
    expect(formatWeekly(t, 90)).toBe("durationHours:1.5:1.5 per week")
    expect(formatWeekly(t, 45)).toBe("durationMinutes:45:45 per week")
    expect(formatWeekly(t, 10_080)).toBe("durationHours:168:168 per week")
  })
})
