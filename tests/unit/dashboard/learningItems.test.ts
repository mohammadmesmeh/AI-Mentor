import { describe, expect, it } from "vitest"
import {
  matchesTaskFilter,
  resourceHost,
  resourceItems,
  taskItems,
} from "@/features/dashboard/lib/learningItems"
import { makeResource, makeRoadmap, makeStage, makeTask } from "./fixtures"

const roadmap = makeRoadmap({ status: "active" }, [
  makeStage({
    id: "s1",
    position: 1,
    status: "active",
    tasks: [
      makeTask({ id: "done", position: 1, status: "completed" }),
      makeTask({ id: "next", position: 2, status: "available", resources: [makeResource({ id: "r1", type: "video" })] }),
      makeTask({ id: "other", position: 3, status: "available" }),
      makeTask({ id: "locked", position: 4, status: "upcoming", dependsOnTaskIds: ["next"] }),
    ],
  }),
  makeStage({
    id: "s2",
    position: 2,
    tasks: [
      makeTask({ id: "later", position: 1, status: "upcoming", resources: [makeResource({ id: "r2", type: "article" })] }),
    ],
  }),
])

describe("taskItems", () => {
  it("marks the one task to do next as current, and derives locked only from unfinished dependencies", () => {
    expect(taskItems(roadmap).map((i) => [i.task.id, i.status])).toEqual([
      ["done", "completed"],
      ["next", "current"],
      ["other", "available"],
      ["locked", "locked"],
      ["later", "upcoming"],
    ])
  })

  it("filters: available includes the current task; locked and upcoming are distinct", () => {
    const ids = (filter: Parameters<typeof matchesTaskFilter>[1]) =>
      taskItems(roadmap).filter((i) => matchesTaskFilter(i.status, filter)).map((i) => i.task.id)
    expect(ids("all")).toHaveLength(5)
    expect(ids("available")).toEqual(["next", "other"])
    expect(ids("completed")).toEqual(["done"])
    expect(ids("locked")).toEqual(["locked"])
    expect(ids("upcoming")).toEqual(["later"])
  })
})

describe("resourceItems", () => {
  it("lists every resource in roadmap order with its task", () => {
    expect(resourceItems(roadmap).map((i) => [i.resource.id, i.task.id])).toEqual([
      ["r1", "next"],
      ["r2", "later"],
    ])
  })

  it("resourceHost shows the site, or null for a bad URL", () => {
    expect(resourceHost("https://www.git-scm.com/book")).toBe("git-scm.com")
    expect(resourceHost("not a url")).toBeNull()
  })
})
