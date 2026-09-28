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
 * Which roadmap: a request started in this session wins; otherwise a roadmap
 * pinned in this session (after a task completion returned it — a completed
 * roadmap leaves the active slot, contract §17); otherwise the server's active
 * roadmap from `GET /me/active-roadmap`, which is how a reload or a new sign-in
 * finds the learner's roadmap again (spec 007 gate G-1).
 *
 * Invariant (FR-002): `start` is only reachable when the server reported no
 * active roadmap or a cancelled request — a failed load always resolves to
 * `load-error`. That includes the onboarding-status gate: a failed gate check is
 * an error state with a retry, never a fall-through to the generation screen.
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
  /** Set once the learner clicks Generate in this session; takes precedence over `active`. */
  sessionRequestId: string | null
  polling: { phase: GenerationPhase; request: RoadmapGenerationRequest | null }
  /** A roadmap id pinned in this session; `roadmap` then holds that roadmap. */
  pinnedRoadmap: boolean
  /** `GET /me/active-roadmap`: the roadmap, or null when none is active. */
  active: QueryState<Roadmap | null>
  /** The roadmap fetched by id (in-session generation result or pinned id). */
  roadmap: QueryState<Roadmap>
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
  const { authenticated, onboarding, startError, sessionRequestId, polling, pinnedRoadmap, active, roadmap } = input

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

  if (pinnedRoadmap) return fromRoadmap(roadmap)

  if (active.isError) return { view: "load-error" }
  if (active.isLoading || active.data === undefined) return { view: "loading" }
  if (active.data === null) return { view: "start" }
  return fromRoadmap({ isLoading: false, isError: false, data: active.data })
}
