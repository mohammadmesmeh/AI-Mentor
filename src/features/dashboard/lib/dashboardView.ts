import type { ApiError } from "@/lib/api/errors"
import type {
  MissingField,
  OnboardingStatus,
  Roadmap,
  RoadmapGenerationRequest,
} from "@/lib/api/types"
import type { GenerationPhase } from "../hooks/useRoadmapGenerationPolling"

/**
 * The single place that decides which dashboard screen to render (spec 007
 * data-model "Resolution order"). Pure so every rule is unit-testable.
 *
 * Invariant (FR-002): `start` is only reachable when the server reported no
 * request or a cancelled one — a failed load always resolves to `load-error`.
 * That includes the onboarding-status gate: a failed gate check is an error
 * state with a retry, never a fall-through to the generation screen.
 */

export type DashboardView =
  | { view: "signed-out" }
  | { view: "loading" }
  | { view: "onboarding-incomplete"; missingFields: MissingField[] }
  | { view: "start" }
  | { view: "start-error" }
  | { view: "generating" }
  | { view: "timed-out" }
  | { view: "failed"; failureCode: string | null }
  | { view: "roadmap-not-ready" }
  | { view: "roadmap-inactive" }
  | { view: "ready"; roadmap: Roadmap }
  | { view: "load-error" }

interface QueryState<T> {
  isLoading: boolean
  isError: boolean
  data: T | undefined
}

export interface DashboardViewInput {
  /**
   * Whether an in-memory session exists. Tokens are never persisted (FR-007),
   * so a full page load starts signed out even right after a login.
   */
  authenticated: boolean
  onboarding: QueryState<OnboardingStatus>

  startError: ApiError | null
  /** Set once the learner clicks Generate in this session; takes precedence over `latest`. */
  sessionRequestId: string | null
  polling: { phase: GenerationPhase; request: RoadmapGenerationRequest | null }
  latest: QueryState<RoadmapGenerationRequest | null>
  roadmap: QueryState<Roadmap>
}

const ACTIVE_REQUEST_STATUSES = new Set(["queued", "running", "validating"])

export function isActiveRequest(request: RoadmapGenerationRequest | null | undefined): boolean {
  return !!request && ACTIVE_REQUEST_STATUSES.has(request.status)
}

function fromPolling(
  phase: GenerationPhase,
  request: RoadmapGenerationRequest | null,
  roadmap: DashboardViewInput["roadmap"]
): DashboardView {
  switch (phase) {
    case "ready":
      return fromRoadmap(roadmap)
    case "failed":
      return { view: "failed", failureCode: request?.failureCode ?? null }
    case "cancelled":
      return { view: "start" }
    case "timed_out":
      return { view: "timed-out" }
    case "idle":
    case "starting":
    case "in_progress":
      return { view: "generating" }
  }
}

function fromRoadmap({ isLoading, isError, data }: DashboardViewInput["roadmap"]): DashboardView {
  if (isError) return { view: "load-error" }
  if (isLoading || !data) return { view: "loading" }
  switch (data.status) {
    case "draft":
    case "generating":
    case "validating":
      return { view: "roadmap-not-ready" }
    case "reset":
    case "archived":
    case "failed":
      return { view: "roadmap-inactive" }
  }
  if (!data.currentVersion) return { view: "roadmap-not-ready" }
  return { view: "ready", roadmap: data }
}

export function resolveDashboardView(input: DashboardViewInput): DashboardView {
  const { authenticated, onboarding, startError, sessionRequestId, polling, latest, roadmap } = input

  if (!authenticated) return { view: "signed-out" }
  if (onboarding.isError) return { view: "load-error" }
  if (onboarding.isLoading || !onboarding.data) return { view: "loading" }
  if (!onboarding.data.completed) {
    return { view: "onboarding-incomplete", missingFields: onboarding.data.missingFields }
  }
  if (startError) return { view: "start-error" }

  if (sessionRequestId) {
    return fromPolling(polling.phase, polling.request, roadmap)
  }

  if (latest.isError) return { view: "load-error" }
  if (latest.isLoading || latest.data === undefined) return { view: "loading" }

  const request = latest.data
  if (!request || request.status === "cancelled") return { view: "start" }
  if (isActiveRequest(request)) return fromPolling(polling.phase, polling.request, roadmap)
  if (request.status === "failed") return { view: "failed", failureCode: request.failureCode }
  return fromRoadmap(roadmap)
}
