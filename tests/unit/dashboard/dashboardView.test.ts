import { describe, expect, it } from "vitest"
import {
  resolveDashboardView,
  type DashboardViewInput,
} from "@/features/dashboard/lib/dashboardView"
import type { ApiError } from "@/lib/api/errors"
import { makeRequest, makeRoadmap, makeStage } from "./fixtures"

const readyRoadmap = makeRoadmap({}, [makeStage()])

function input(overrides: Partial<DashboardViewInput> = {}): DashboardViewInput {
  return {
    onboarding: { isLoading: false, data: { completed: true, missingFields: [] } },
    startError: null,
    sessionRequestId: null,
    polling: { phase: "idle", request: null },
    latest: { isLoading: false, isError: false, data: null },
    roadmap: { isLoading: false, isError: false, data: undefined },
    ...overrides,
  }
}

const apiError: ApiError = {
  code: "unexpected_error",
  message: "boom",
  requestId: "r",
  category: "unexpected",
}

describe("resolveDashboardView", () => {
  it("1. is loading while onboarding status loads", () => {
    expect(resolveDashboardView(input({ onboarding: { isLoading: true, data: undefined } })).view).toBe(
      "loading"
    )
  })

  it("2. shows onboarding-incomplete with the missing fields", () => {
    const view = resolveDashboardView(
      input({ onboarding: { isLoading: false, data: { completed: false, missingFields: ["goal"] } } })
    )
    expect(view).toEqual({ view: "onboarding-incomplete", missingFields: ["goal"] })
  })

  it("3. shows start-error when generation could not be started", () => {
    expect(resolveDashboardView(input({ startError: apiError })).view).toBe("start-error")
  })

  it("5. is loading while the latest request loads and there is no in-session request", () => {
    expect(
      resolveDashboardView(input({ latest: { isLoading: true, isError: false, data: undefined } })).view
    ).toBe("loading")
  })

  it("6. FR-002: a latest-request error with no in-session request is load-error, never start", () => {
    expect(
      resolveDashboardView(input({ latest: { isLoading: false, isError: true, data: undefined } })).view
    ).toBe("load-error")
  })

  it("7. shows start when the server reports no request", () => {
    expect(resolveDashboardView(input()).view).toBe("start")
  })

  it("7. shows start when the latest request was cancelled", () => {
    const latest = { isLoading: false, isError: false, data: makeRequest({ status: "cancelled" as const }) }
    expect(resolveDashboardView(input({ latest })).view).toBe("start")
  })

  it("8. shows generating for an active latest request being polled", () => {
    const latest = {
      isLoading: false,
      isError: false,
      data: makeRequest({ status: "running" as const, roadmapId: null }),
    }
    expect(
      resolveDashboardView(input({ latest, polling: { phase: "in_progress", request: null } })).view
    ).toBe("generating")
  })

  it("8. shows timed-out when polling times out", () => {
    expect(
      resolveDashboardView(
        input({ sessionRequestId: "req-1", polling: { phase: "timed_out", request: null } })
      ).view
    ).toBe("timed-out")
  })

  it("9. shows failed with the failure code of the latest request", () => {
    const latest = {
      isLoading: false,
      isError: false,
      data: makeRequest({ status: "failed" as const, roadmapId: null, failureCode: "validation_failed" }),
    }
    expect(resolveDashboardView(input({ latest }))).toEqual({
      view: "failed",
      failureCode: "validation_failed",
    })
  })

  it("in-session request takes precedence over the latest request", () => {
    const latest = { isLoading: false, isError: false, data: makeRequest() }
    const view = resolveDashboardView(
      input({
        latest,
        sessionRequestId: "req-2",
        polling: { phase: "in_progress", request: null },
        roadmap: { isLoading: false, isError: false, data: readyRoadmap },
      })
    )
    expect(view.view).toBe("generating")
  })

  it("in-session request makes a latest-request error irrelevant", () => {
    const view = resolveDashboardView(
      input({
        latest: { isLoading: false, isError: true, data: undefined },
        sessionRequestId: "req-2",
        polling: { phase: "in_progress", request: null },
      })
    )
    expect(view.view).toBe("generating")
  })

  describe("10. succeeded request → roadmap", () => {
    const latest = { isLoading: false, isError: false, data: makeRequest() }

    it("is loading while the roadmap loads", () => {
      expect(
        resolveDashboardView(input({ latest, roadmap: { isLoading: true, isError: false, data: undefined } }))
          .view
      ).toBe("loading")
    })

    it("FR-004: a roadmap load error is load-error", () => {
      expect(
        resolveDashboardView(input({ latest, roadmap: { isLoading: false, isError: true, data: undefined } }))
          .view
      ).toBe("load-error")
    })

    it.each(["draft", "generating", "validating"] as const)("status %s is roadmap-not-ready", (status) => {
      const roadmap = { isLoading: false, isError: false, data: makeRoadmap({ status }, [makeStage()]) }
      expect(resolveDashboardView(input({ latest, roadmap })).view).toBe("roadmap-not-ready")
    })

    it("a null current version is roadmap-not-ready", () => {
      const roadmap = { isLoading: false, isError: false, data: makeRoadmap({ currentVersion: null }) }
      expect(resolveDashboardView(input({ latest, roadmap })).view).toBe("roadmap-not-ready")
    })

    it.each(["reset", "archived", "failed"] as const)("status %s is roadmap-inactive", (status) => {
      const roadmap = { isLoading: false, isError: false, data: makeRoadmap({ status }, [makeStage()]) }
      expect(resolveDashboardView(input({ latest, roadmap })).view).toBe("roadmap-inactive")
    })

    it.each(["ready", "active", "completed"] as const)("status %s is ready", (status) => {
      const data = makeRoadmap({ status }, [makeStage()])
      const roadmap = { isLoading: false, isError: false, data }
      expect(resolveDashboardView(input({ latest, roadmap }))).toEqual({ view: "ready", roadmap: data })
    })

    it("an in-session request that reached ready resolves the roadmap too", () => {
      const roadmap = { isLoading: false, isError: false, data: readyRoadmap }
      const view = resolveDashboardView(
        input({
          sessionRequestId: "req-1",
          polling: { phase: "ready", request: makeRequest() },
          roadmap,
        })
      )
      expect(view.view).toBe("ready")
    })
  })
})
