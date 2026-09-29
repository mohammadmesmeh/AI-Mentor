import { describe, expect, it } from "vitest"
import {
  resolveDashboardView,
  type DashboardViewInput,
} from "@/features/dashboard/lib/dashboardView"
import type { ApiError } from "@/lib/api/errors"
import { makeRequest, makeRoadmap, makeStage } from "./fixtures"

const readyRoadmap = makeRoadmap({ status: "ready" }, [makeStage()])

function input(overrides: Partial<DashboardViewInput> = {}): DashboardViewInput {
  return {
    authenticated: true,
    restoring: false,
    onboarding: { isLoading: false, isError: false, data: { completed: true, missingFields: [] } },
    startError: null,
    requesting: false,
    sessionRequestId: null,
    activation: { phase: "idle", error: null },
    polling: { phase: "idle", request: null },
    pinnedRoadmap: false,
    active: { isLoading: false, isError: false, data: null },
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
  it("0. is signed-out without an in-memory session — before any gate check", () => {
    expect(
      resolveDashboardView(input({ authenticated: false, active: { isLoading: false, isError: true, data: undefined } }))
        .view
    ).toBe("signed-out")
  })

  it("restoring the cookie session after a reload is loading — never signed-out or start", () => {
    expect(resolveDashboardView(input({ restoring: true, authenticated: false })).view).toBe("loading")
  })

  it("regression: a failed onboarding-status gate is load-error, never start or blank", () => {
    expect(
      resolveDashboardView(input({ onboarding: { isLoading: false, isError: true, data: undefined } })).view
    ).toBe("load-error")
  })

  it("an onboarding status that has not arrived yet is loading, not a fall-through", () => {
    expect(
      resolveDashboardView(input({ onboarding: { isLoading: false, isError: false, data: undefined } })).view
    ).toBe("loading")
  })

  it("1. is loading while onboarding status loads", () => {
    expect(resolveDashboardView(input({ onboarding: { isLoading: true, isError: false, data: undefined } })).view).toBe(
      "loading"
    )
  })

  it("2. shows onboarding-incomplete with the missing fields", () => {
    const view = resolveDashboardView(
      input({ onboarding: { isLoading: false, isError: false, data: { completed: false, missingFields: ["goal"] } } })
    )
    expect(view).toEqual({ view: "onboarding-incomplete", missingFields: ["goal"] })
  })

  it("3. shows start-error when generation could not be started", () => {
    expect(resolveDashboardView(input({ startError: apiError }))).toEqual({ view: "start-error", reason: "generic" })
  })

  describe("start errors", () => {
    const start = (error: Partial<ApiError>) => resolveDashboardView(input({ startError: { ...apiError, ...error } }))

    it("a 401 is a session problem — signed-out, never a generation failure", () => {
      expect(start({ code: "unauthenticated", category: "access_denied" })).toEqual({ view: "signed-out" })
    })

    it("409 onboarding_incomplete returns to the missing fields from error.details", () => {
      expect(
        start({ code: "onboarding_incomplete", category: "conflict", details: { missing_fields: ["goal"] } })
      ).toEqual({ view: "onboarding-incomplete", missingFields: ["goal"] })
    })

    it("names a rate limit and an outage", () => {
      expect(start({ code: "too_many_requests", category: "rate_limited" })).toEqual({
        view: "start-error",
        reason: "rate_limited",
      })
      expect(start({ code: "authentication_service_unavailable", category: "unavailable" })).toEqual({
        view: "start-error",
        reason: "unavailable",
      })
    })
  })

  it("is generating while the POST is in flight, so a second click can't start another request", () => {
    expect(resolveDashboardView(input({ requesting: true })).view).toBe("generating")
  })

  describe("active roadmap (GET /me/active-roadmap — how a reload finds the roadmap)", () => {
    it("is loading while the active roadmap loads", () => {
      expect(
        resolveDashboardView(input({ active: { isLoading: true, isError: false, data: undefined } })).view
      ).toBe("loading")
    })

    it("FR-002: an active-roadmap error is load-error, never start", () => {
      expect(
        resolveDashboardView(input({ active: { isLoading: false, isError: true, data: undefined } })).view
      ).toBe("load-error")
    })

    it("shows start when the server reports no active roadmap (404 → null)", () => {
      expect(resolveDashboardView(input()).view).toBe("start")
    })

    it("shows the active roadmap after a reload, with no request in this session", () => {
      const data = makeRoadmap({ status: "active" }, [makeStage()])
      expect(resolveDashboardView(input({ active: { isLoading: false, isError: false, data } }))).toEqual({
        view: "ready",
        roadmap: data,
      })
    })

    it("a pinned roadmap (after a completion) wins over the active query", () => {
      const completed = makeRoadmap({ status: "completed" }, [makeStage()])
      const view = resolveDashboardView(
        input({ pinnedRoadmap: true, roadmap: { isLoading: false, isError: false, data: completed } })
      )
      expect(view).toEqual({ view: "ready", roadmap: completed })
    })
  })

  describe("in-session generation", () => {
    it("shows generating while the request is polled", () => {
      expect(
        resolveDashboardView(input({ sessionRequestId: "req-1", polling: { phase: "in_progress", request: null } })).view
      ).toBe("generating")
    })

    it("shows timed-out when polling times out", () => {
      expect(
        resolveDashboardView(input({ sessionRequestId: "req-1", polling: { phase: "timed_out", request: null } })).view
      ).toBe("timed-out")
    })

    it("shows failed with the request's failure code", () => {
      const request = makeRequest({ status: "failed", roadmapId: null, failureCode: "roadmap_provider_failed" })
      expect(resolveDashboardView(input({ sessionRequestId: "req-1", polling: { phase: "failed", request } }))).toEqual({
        view: "failed",
        failureCode: "roadmap_provider_failed",
      })
    })

    it("shows start when the request was cancelled", () => {
      expect(
        resolveDashboardView(input({ sessionRequestId: "req-1", polling: { phase: "cancelled", request: null } })).view
      ).toBe("start")
    })

    it("takes precedence over the active roadmap and makes an active-roadmap error irrelevant", () => {
      const view = resolveDashboardView(
        input({
          active: { isLoading: false, isError: true, data: undefined },
          sessionRequestId: "req-2",
          polling: { phase: "in_progress", request: null },
        })
      )
      expect(view.view).toBe("generating")
    })
  })

  describe("roadmap states", () => {
    const ready = (roadmap: DashboardViewInput["roadmap"]) =>
      resolveDashboardView(input({ sessionRequestId: "req-1", polling: { phase: "ready", request: makeRequest() }, roadmap }))

    it("is loading while the roadmap loads", () => {
      expect(ready({ isLoading: true, isError: false, data: undefined }).view).toBe("loading")
    })

    it("FR-004: a roadmap load error is load-error", () => {
      expect(ready({ isLoading: false, isError: true, data: undefined }).view).toBe("load-error")
    })

    it.each(["draft", "generating", "validating"] as const)("status %s is roadmap-not-ready", (status) => {
      expect(ready({ isLoading: false, isError: false, data: makeRoadmap({ status }, [makeStage()]) }).view).toBe(
        "roadmap-not-ready"
      )
    })

    it("a null current version is roadmap-not-ready", () => {
      expect(ready({ isLoading: false, isError: false, data: makeRoadmap({ currentVersion: null }) }).view).toBe(
        "roadmap-not-ready"
      )
    })

    it.each(["reset", "archived", "failed"] as const)("status %s is roadmap-inactive", (status) => {
      expect(ready({ isLoading: false, isError: false, data: makeRoadmap({ status }, [makeStage()]) }).view).toBe(
        "roadmap-inactive"
      )
    })

    it.each(["active", "completed"] as const)("status %s is ready", (status) => {
      const data = makeRoadmap({ status }, [makeStage()])
      expect(ready({ isLoading: false, isError: false, data })).toEqual({ view: "ready", roadmap: data })
    })

    it("contract §18: a generated roadmap that is still `ready` is activating, never the workspace", () => {
      expect(ready({ isLoading: false, isError: false, data: readyRoadmap })).toEqual({ view: "activating" })
    })

    it("a failed activation shows activation-failed; a 409 is reported as a conflict", () => {
      const failed = (code: string) =>
        resolveDashboardView(
          input({
            sessionRequestId: "req-1",
            polling: { phase: "ready", request: makeRequest() },
            roadmap: { isLoading: false, isError: false, data: readyRoadmap },
            activation: { phase: "failed", error: { ...apiError, code, category: "conflict" } },
          })
        )
      expect(failed("roadmap_activation_conflict")).toEqual({ view: "activation-failed", conflict: true })
      expect(failed("internal_error")).toEqual({ view: "activation-failed", conflict: false })
    })
  })
})
