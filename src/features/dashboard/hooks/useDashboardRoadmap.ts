import { useCallback, useEffect } from "react"
import { skipToken } from "@reduxjs/toolkit/query"
import { useGetOnboardingStatusQuery, useGetRoadmapQuery } from "@/lib/api/apiSlice"
import type { RoadmapGenerationRequest } from "@/lib/api/types"
import {
  isActiveRequest,
  resolveDashboardView,
  type DashboardView,
} from "../lib/dashboardView"
import { useGenerateRoadmap } from "./useGenerateRoadmap"
import { useRoadmapGenerationPolling } from "./useRoadmapGenerationPolling"

/**
 * Stand-in for the learner's latest generation request until its retrieval is
 * documented in API_CONTRACT.md (spec 007 gate G-1 — see
 * specs/007-roadmap-dashboard-completion/contracts/api-dependencies.md).
 * "No request known" keeps today's behavior: only a request started in this
 * session is shown. Replace with the real query in T016; never guess the
 * endpoint here.
 */
const LATEST_REQUEST_UNAVAILABLE = {
  isLoading: false,
  isError: false,
  data: null as RoadmapGenerationRequest | null,
}

export interface DashboardRoadmapState {
  view: DashboardView
  generate: () => void
  retryGeneration: () => void
  checkAgain: () => void
  reset: () => void
  /** Re-runs whichever read failed (latest request or roadmap). */
  retryLoad: () => void
  /** Re-reads the roadmap, e.g. while it is still being prepared. */
  refetchRoadmap: () => void
}

export function useDashboardRoadmap(): DashboardRoadmapState {
  const onboarding = useGetOnboardingStatusQuery()
  const { requestId, startError, generate, reset } = useGenerateRoadmap()

  const latest = LATEST_REQUEST_UNAVAILABLE
  const latestActiveId = isActiveRequest(latest.data) ? latest.data!.id : null

  // An in-session request (the learner clicked Generate) takes precedence.
  const pollId = requestId ?? latestActiveId
  const { phase, request, checkAgain } = useRoadmapGenerationPolling(pollId)

  const roadmapId =
    pollId !== null
      ? phase === "ready"
        ? request?.roadmapId ?? null
        : null
      : latest.data?.status === "succeeded"
        ? latest.data.roadmapId
        : null
  const roadmap = useGetRoadmapQuery(roadmapId ?? skipToken)

  // A cancelled generation returns the learner to the generation screen
  // (contract §15) — clear the local request so a new attempt starts cleanly.
  useEffect(() => {
    if (phase === "cancelled") reset()
  }, [phase, reset])

  const retryGeneration = useCallback(() => {
    reset()
    void generate()
  }, [reset, generate])

  const { refetch: refetchRoadmapQuery, isError: roadmapIsError } = roadmap
  const refetchRoadmap = useCallback(() => {
    if (roadmapId) void refetchRoadmapQuery()
  }, [roadmapId, refetchRoadmapQuery])

  const retryLoad = useCallback(() => {
    if (roadmapIsError) refetchRoadmap()
  }, [roadmapIsError, refetchRoadmap])

  const view = resolveDashboardView({
    onboarding: { isLoading: onboarding.isLoading, data: onboarding.data },
    startError,
    sessionRequestId: requestId,
    polling: { phase, request },
    latest,
    roadmap: { isLoading: roadmap.isLoading, isError: roadmap.isError, data: roadmap.data },
  })

  return {
    view,
    generate: () => void generate(),
    retryGeneration,
    checkAgain,
    reset,
    retryLoad,
    refetchRoadmap,
  }
}
