import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import type { AppDispatch, RootState } from "@/redux/store"
import {
  apiSlice,
  useActivateRoadmapMutation,
  useGetActiveRoadmapQuery,
  useGetOnboardingStatusQuery,
  useGetRoadmapQuery,
} from "@/lib/api/apiSlice"
import { asApiError } from "@/lib/api/errors"
import { resolveDashboardView, type ActivationState, type DashboardView } from "../lib/dashboardView"
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
  /** Tries the automatic activation again after it failed. */
  retryActivation: () => void
  /**
   * Keep showing this roadmap for the rest of the session. Used after a task
   * completion returns the updated tree: a roadmap that becomes completed
   * leaves the active slot (contract §17), and must not vanish from the page.
   */
  pinRoadmap: (roadmapId: string) => void
}

type TrackedActivation = ActivationState & { roadmapId: string | null }
const IDLE: TrackedActivation = { phase: "idle", error: null, roadmapId: null }

export function useDashboardRoadmap(): DashboardRoadmapState {
  const dispatch = useDispatch<AppDispatch>()
  // Without an in-memory session every authenticated call would go out with no
  // Authorization header and 401 (e.g. after a full page load) — don't fire it.
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const onboarding = useGetOnboardingStatusQuery(authenticated ? undefined : skipToken)

  // Contract §22: only once onboarding is complete, ask for the active roadmap —
  // this is what finds the learner's roadmap again after a reload or sign-in.
  const onboardingComplete = onboarding.data?.completed === true
  const active = useGetActiveRoadmapQuery(authenticated && onboardingComplete ? undefined : skipToken)

  const { requesting, requestId, startError, generate, reset } = useGenerateRoadmap()
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

  // Contract §18/§22: a learner has one roadmap and it must be the active one.
  // The backend usually activates the first roadmap itself; when the generated
  // roadmap comes back `ready` and nothing is active, activate it here — no
  // button, invisible to the learner. Then the dashboard reads
  // GET /me/active-roadmap like after any reload.
  const [activateRoadmap] = useActivateRoadmapMutation()
  const [activation, setActivation] = useState<TrackedActivation>(IDLE)
  const readyRoadmapId = roadmap.data?.status === "ready" ? roadmap.data.id : null

  const activate = useCallback(
    async (id: string) => {
      setActivation({ phase: "activating", error: null, roadmapId: id })
      try {
        // Activation clears any other roadmap's active slot (§18), so ask the
        // server first and never take the slot from an active roadmap.
        const current = await dispatch(
          apiSlice.endpoints.getActiveRoadmap.initiate(undefined, { forceRefetch: true, subscribe: false })
        ).unwrap()
        if (!current) await activateRoadmap(id).unwrap()
        dispatch(apiSlice.util.invalidateTags(["ActiveRoadmap"]))
        reset()
        setPinnedRoadmapId(null)
        // Remember the id so a render with the stale `ready` copy can't start it again.
        setActivation({ phase: "idle", error: null, roadmapId: id })
      } catch (error) {
        setActivation({ phase: "failed", error: asApiError(error), roadmapId: id })
      }
    },
    [dispatch, activateRoadmap, reset]
  )

  useEffect(() => {
    if (!readyRoadmapId || activation.roadmapId === readyRoadmapId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the request; the state tracks it.
    void activate(readyRoadmapId)
  }, [readyRoadmapId, activation.roadmapId, activate])

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

  // activate() re-reads the active roadmap first, so after a 409
  // roadmap_activation_conflict (the roadmap's state changed) a retry finishes
  // without a second POST if the roadmap became active meanwhile.
  const retryActivation = useCallback(() => {
    if (activation.roadmapId) void activate(activation.roadmapId)
  }, [activation.roadmapId, activate])

  const pinRoadmap = useCallback((id: string) => setPinnedRoadmapId(id), [])

  const view = resolveDashboardView({
    authenticated,
    onboarding: { isLoading: onboarding.isLoading, isError: onboarding.isError, data: onboarding.data },
    startError,
    requesting,
    sessionRequestId: requestId,
    polling: { phase, request },
    activation: { phase: activation.phase, error: activation.error },
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
    retryActivation,
    pinRoadmap,
  }
}
