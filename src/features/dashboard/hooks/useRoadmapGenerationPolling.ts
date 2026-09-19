import { useCallback, useEffect, useState } from "react"
import { useLazyGetGenerationStatusQuery } from "@/lib/api/apiSlice"
import type { GenerationStatus, RoadmapGenerationRequest } from "@/lib/api/types"

export type GenerationPhase =
  | "idle"
  | "starting"
  | "in_progress"
  | "ready"
  | "failed"
  | "cancelled"
  | "timed_out"

/**
 * Backoff-polling wrapper around the generation-status endpoint. Polling starts
 * near 1000ms and steps to ~2500ms after the first couple of polls; the instant
 * a terminal status is observed no further status request is issued (FR-014).
 * A bounded timeout (default 60s) stops polling and surfaces "timed_out"; the
 * caller's "check again" action re-fetches status without creating a new
 * generation request (FR-015).
 */
const POLL_COUNT_FAST = 3
const POLL_INTERVAL_FAST_MS = 1000
const POLL_INTERVAL_SLOW_MS = 2500
export const POLL_TIMEOUT_MS = 60000

function phaseFor(status: GenerationStatus): Exclude<GenerationPhase, "timed_out"> {
  switch (status) {
    case "queued":
    case "running":
    case "validating":
      return "in_progress"
    case "succeeded":
      return "ready"
    case "failed":
      return "failed"
    case "cancelled":
      return "cancelled"
  }
}

export interface GenerationPollingState {
  phase: GenerationPhase
  request: RoadmapGenerationRequest | null
  checkAgain: () => void
}

export function useRoadmapGenerationPolling(
  requestId: string | null,
  timeoutMs = POLL_TIMEOUT_MS
): GenerationPollingState {
  const [getStatus] = useLazyGetGenerationStatusQuery()
  const [request, setRequest] = useState<RoadmapGenerationRequest | null>(null)
  const [phase, setPhase] = useState<GenerationPhase>(requestId ? "starting" : "idle")
  const [nonce, setNonce] = useState(0)

  const checkAgain = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!requestId) {
      return
    }

    let cancelled = false
    let pollCount = 0
    let timerId: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      if (cancelled) {
        return
      }
      const currentPoll = pollCount
      let data: RoadmapGenerationRequest | null | undefined
      try {
        data = await getStatus(requestId).unwrap()
      } catch {
        data = null
      }
      if (cancelled) {
        return
      }
      if (data) {
        setRequest(data)
        const next = phaseFor(data.status)
        setPhase(next)
        if (next === "ready" || next === "failed" || next === "cancelled") {
          return
        }
      }
      const delay =
        currentPoll < POLL_COUNT_FAST ? POLL_INTERVAL_FAST_MS : POLL_INTERVAL_SLOW_MS
      pollCount += 1
      timerId = setTimeout(poll, delay)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync reset when a new/non-null request starts.
    setPhase("starting")
    // The stale request must not render alongside the new one.
    setRequest(null)

    const timeoutId = setTimeout(() => {
      cancelled = true
      if (timerId !== undefined) clearTimeout(timerId)
      setPhase("timed_out")
    }, timeoutMs)

    timerId = setTimeout(poll, POLL_INTERVAL_FAST_MS)

    return () => {
      cancelled = true
      if (timerId !== undefined) clearTimeout(timerId)
      clearTimeout(timeoutId)
    }
  }, [requestId, nonce, timeoutMs, getStatus])

  const effectivePhase: GenerationPhase = requestId ? phase : "idle"
  const effectiveRequest = requestId ? request : null

  return { phase: effectivePhase, request: effectiveRequest, checkAgain }
}