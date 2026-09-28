import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import type { RootState } from "@/redux/store"
import {
  useGetActiveRoadmapQuery,
  useGetOnboardingStatusQuery,
  useGetRoadmapQuery,
} from "@/lib/api/apiSlice"
import { resolveDashboardView, type DashboardView } from "../lib/dashboardView"
import { useGenerateRoadmap } from "./useGenerateRoadmap"
import { useRoadmapGenerationPolling } from "./useRoadmapGenerationPolling"

export interface DashboardRoadmapState {
  view: DashboardView
  generate: () => void
  retryGeneration: () => void
  checkAgain: () => void
  reset: () => void
  /** Re-runs whichever read failed (onboarding gate, active roadmap or roadmap). */
  retryLoad: () => void
  /** Re-reads the roadmap on screen, e.g. while it is still being prepared. */
  refetchRoadmap: () => void
  /**
   * Keep showing this roadmap for the rest of the session. Used after a task
   * completion returns the updated tree: a roadmap that becomes completed
   * leaves the active slot (contract §17), and must not vanish from the page.
   */
  pinRoadmap: (roadmapId: string) => void
}

export function useDashboardRoadmap(): DashboardRoadmapState {
  // Without an in-memory session every authenticated call would go out with no
  // Authorization header and 401 (e.g. after a full page load) — don't fire it.
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const onboarding = useGetOnboardingStatusQuery(authenticated ? undefined : skipToken)

  // Contract §22: only once onboarding is complete, ask for the active roadmap —
  // this is what finds the learner's roadmap again after a reload or sign-in.
  const onboardingComplete = onboarding.data?.completed === true
  const active = useGetActiveRoadmapQuery(authenticated && onboardingComplete ? undefined : skipToken)

  const { requestId, startError, generate, reset } = useGenerateRoadmap()
  const { phase, request, checkAgain } = useRoadmapGenerationPolling(requestId)

  const [pinnedRoadmapId, setPinnedRoadmapId] = useState<string | null>(null)
  const sessionRoadmapId = requestId && phase === "ready" ? request?.roadmapId ?? null : null
  const roadmapId = sessionRoadmapId ?? pinnedRoadmapId
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
  const { refetch: refetchActive, isError: activeIsError } = active
  const { refetch: refetchOnboarding, isError: onboardingIsError } = onboarding

  const refetchRoadmap = useCallback(() => {
    if (roadmapId) void refetchRoadmapQuery()
    else if (onboardingComplete) void refetchActive()
  }, [roadmapId, refetchRoadmapQuery, onboardingComplete, refetchActive])

  const retryLoad = useCallback(() => {
    if (onboardingIsError) void refetchOnboarding()
    else if (roadmapIsError) void refetchRoadmapQuery()
    else if (activeIsError) void refetchActive()
  }, [onboardingIsError, refetchOnboarding, roadmapIsError, refetchRoadmapQuery, activeIsError, refetchActive])

  const pinRoadmap = useCallback((id: string) => setPinnedRoadmapId(id), [])

  const view = resolveDashboardView({
    authenticated,
    onboarding: { isLoading: onboarding.isLoading, isError: onboarding.isError, data: onboarding.data },
    startError,
    sessionRequestId: requestId,
    polling: { phase, request },
    pinnedRoadmap: pinnedRoadmapId !== null,
    active: { isLoading: active.isLoading, isError: active.isError, data: active.data },
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
    pinRoadmap,
  }
}
