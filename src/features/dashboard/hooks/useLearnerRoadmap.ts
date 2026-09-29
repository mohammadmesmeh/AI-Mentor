import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import type { RootState } from "@/redux/store"
import {
  useGetActiveRoadmapQuery,
  useGetOnboardingStatusQuery,
  useGetRoadmapQuery,
} from "@/lib/api/apiSlice"
import type { MissingField, Roadmap } from "@/lib/api/types"

export type LearnerRoadmapState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "onboarding-incomplete"; missingFields: MissingField[] }
  | { status: "no-roadmap" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; roadmap: Roadmap }

/**
 * The learner's roadmap for the workspace pages (Roadmap, Tasks, Resources).
 * Reads the same RTK Query cache as the Overview — moving between pages never
 * refetches a roadmap that is already cached. Generation lives on the Overview
 * only: these pages never request one.
 *
 * Which roadmap: the active one (contract §17); otherwise the roadmap pinned
 * after it was completed (a completed roadmap leaves the active slot).
 */
export function useLearnerRoadmap(): LearnerRoadmapState {
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const pinnedRoadmapId = useSelector((state: RootState) => state.workspace.pinnedRoadmapId)

  const onboarding = useGetOnboardingStatusQuery(authenticated ? undefined : skipToken)
  const onboardingComplete = onboarding.data?.completed === true
  const active = useGetActiveRoadmapQuery(authenticated && onboardingComplete ? undefined : skipToken)
  const usePinned = authenticated && active.data === null && pinnedRoadmapId !== null
  const pinned = useGetRoadmapQuery(usePinned ? pinnedRoadmapId : skipToken)

  if (restoring) return { status: "loading" }
  if (!authenticated) return { status: "signed-out" }
  if (onboarding.isError) return { status: "error", retry: () => void onboarding.refetch() }
  if (!onboarding.data) return { status: "loading" }
  if (!onboarding.data.completed) {
    return { status: "onboarding-incomplete", missingFields: onboarding.data.missingFields }
  }
  if (active.isError) return { status: "error", retry: () => void active.refetch() }
  if (active.data === undefined) return { status: "loading" }
  if (active.data) return { status: "ready", roadmap: active.data }
  if (usePinned) {
    if (pinned.isError) return { status: "error", retry: () => void pinned.refetch() }
    if (!pinned.data) return { status: "loading" }
    return { status: "ready", roadmap: pinned.data }
  }
  return { status: "no-roadmap" }
}
