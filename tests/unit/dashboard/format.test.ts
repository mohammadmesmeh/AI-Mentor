import { describe, expect, it } from "vitest"
import { durationMessage, formatPercent, resourceTypeCounts, splitMinutes } from "@/features/dashboard/lib/format"
import { resourceItems } from "@/features/dashboard/lib/learningItems"
import { makeResource, makeRoadmap, makeStage, makeTask } from "./fixtures"

describe("splitMinutes / durationMessage", () => {
  it("splits minutes into hours and minutes", () => {
    expect(splitMinutes(175)).toEqual({ hours: 2, minutes: 55 })
    expect(splitMinutes(-5)).toEqual({ hours: 0, minutes: 0 })
  })

  it("picks the shortest message that fits", () => {
    expect(durationMessage(40).key).toBe("duration.minutes")
    expect(durationMessage(180).key).toBe("duration.hours")
    expect(durationMessage(175)).toEqual({ key: "duration.hoursMinutes", values: { hours: 2, minutes: 55 } })
  })
})

describe("formatPercent", () => {
  it("formats in the page's locale", () => {
    expect(formatPercent("en", 44)).toBe("44%")
    expect(formatPercent("en", 33.6)).toBe("34%")
    expect(formatPercent("ar", 44)).toBe(new Intl.NumberFormat("ar", { style: "percent" }).format(0.44))
  })
})

describe("resourceTypeCounts", () => {
  it("counts each type in the given order and skips empty types", () => {
    const roadmap = makeRoadmap({}, [
      makeStage({
        tasks: [
          makeTask({
            resources: [
              makeResource({ id: "1", type: "video" }),
              makeResource({ id: "2", type: "article" }),
              makeResource({ id: "3", type: "video" }),
            ],
          }),
        ],
      }),
    ])
    expect(resourceTypeCounts(resourceItems(roadmap), ["video", "article", "documentation", "course"])).toEqual([
      { type: "video", count: 2 },
      { type: "article", count: 1 },
    ])
  })
})
