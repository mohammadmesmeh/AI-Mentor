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
 *
 * A roadmap the learner works on must be the active one (contract §18, §20): a
 * `ready` roadmap is shown as `activating` while it is activated automatically,
 * or as `activation-failed` with a retry — never as the workspace.
 *
 * An authentication failure is never reported as a generation failure.
 */

/** Why POST /roadmap-generation-requests was refused, for the message shown. */
export type StartErrorReason = "rate_limited" | "unavailable" | "generic"

export type DashboardView =
  | { view: "signed-out" }
  | { view: "loading" }
  | { view: "onboarding-incomplete"; missingFields: MissingField[] }
  | { view: "start" }
  | { view: "start-error"; reason: StartErrorReason }
  | { view: "generating" }
  | { view: "timed-out" }
  | { view: "failed"; failureCode: string | null }
  | { view: "roadmap-not-ready" }
  | { view: "roadmap-inactive" }
  | { view: "activating" }
  | { view: "activation-failed"; conflict: boolean }
  | { view: "ready"; roadmap: Roadmap }
  | { view: "load-error" }

export interface ActivationState {
  phase: "idle" | "activating" | "failed"
  error: ApiError | null
}

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
  /** POST /roadmap-generation-requests is in flight (it takes ~20s on Render). */
  requesting: boolean
  /** Set once generation starts in this session; takes precedence over `active`. */
  sessionRequestId: string | null
  polling: { phase: GenerationPhase; request: RoadmapGenerationRequest | null }
  /** Automatic activation of a `ready` roadmap (contract §18). */
  activation: ActivationState
  /** A roadmap id pinned in this session; `roadmap` then holds that roadmap. */
  pinnedRoadmap: boolean
  /** `GET /me/active-roadmap`: the roadmap, or null when none is active. */
  active: QueryState<Roadmap | null>
  /** The roadmap fetched by id (in-session generation result or pinned id). */
  roadmap: QueryState<Roadmap>
}

function fromPolling(input: DashboardViewInput): DashboardView {
  const { phase, request } = input.polling
  switch (phase) {
    case "ready":
      return fromRoadmap(input.roadmap, input.activation)
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

function fromRoadmap(
  { isLoading, isError, data }: DashboardViewInput["roadmap"],
  activation: ActivationState
): DashboardView {
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
    case "ready":
      return activation.phase === "failed"
        ? { view: "activation-failed", conflict: activation.error?.code === "roadmap_activation_conflict" }
        : { view: "activating" }
  }
  if (!data.currentVersion) return { view: "roadmap-not-ready" }
  return { view: "ready", roadmap: data }
}

function fromStartError(error: ApiError, onboarding: OnboardingStatus): DashboardView {
  if (error.category === "access_denied") return { view: "signed-out" }
  if (error.code === "onboarding_incomplete") {
    const fields = (error.details as { missing_fields?: MissingField[] } | undefined)?.missing_fields
    return { view: "onboarding-incomplete", missingFields: fields ?? onboarding.missingFields }
  }
  if (error.category === "rate_limited") return { view: "start-error", reason: "rate_limited" }
  if (error.category === "unavailable") return { view: "start-error", reason: "unavailable" }
  return { view: "start-error", reason: "generic" }
}

export function resolveDashboardView(input: DashboardViewInput): DashboardView {
  const { authenticated, onboarding, startError, requesting, sessionRequestId, pinnedRoadmap, active, roadmap } = input

  if (!authenticated) return { view: "signed-out" }
  if (onboarding.isError) return { view: "load-error" }
  if (onboarding.isLoading || !onboarding.data) return { view: "loading" }
  if (!onboarding.data.completed) {
    return { view: "onboarding-incomplete", missingFields: onboarding.data.missingFields }
  }
  if (startError) return fromStartError(startError, onboarding.data)
  if (requesting) return { view: "generating" }

  if (sessionRequestId) return fromPolling(input)

  if (pinnedRoadmap) return fromRoadmap(roadmap, input.activation)

  if (active.isError) return { view: "load-error" }
  if (active.isLoading || active.data === undefined) return { view: "loading" }
  if (active.data === null) return { view: "start" }
  return fromRoadmap({ isLoading: false, isError: false, data: active.data }, input.activation)
}
