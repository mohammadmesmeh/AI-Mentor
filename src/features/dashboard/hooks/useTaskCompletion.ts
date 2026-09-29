import { useCallback, useRef, useState } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/redux/store"
import { apiSlice, useCompleteTaskMutation } from "@/lib/api/apiSlice"
import { asApiError } from "@/lib/api/errors"
import { roadmapPinned } from "@/redux/slices/workspaceSlice"

export type CompletionError = { taskId: string; kind: "conflict" | "failed" }

export interface TaskCompletionState {
  pendingTaskId: string | null
  error: CompletionError | null
  /** The last result, for an aria-live region; empty when there is none. */
  announcement: "completed" | "failed" | ""
  complete: (taskId: string) => Promise<void>
}

/**
 * Mark complete (contract §20), shared by every page that offers it. The server
 * re-checks eligibility and returns the updated roadmap, which the mutation
 * writes into the cache (Overview, Roadmap, Tasks and the task page all update
 * from it) — nothing is toggled locally. One request at a time; never retried
 * automatically.
 */
export function useTaskCompletion(): TaskCompletionState {
  const dispatch = useDispatch<AppDispatch>()
  const [completeTask] = useCompleteTaskMutation()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [error, setError] = useState<CompletionError | null>(null)
  const [announcement, setAnnouncement] = useState<TaskCompletionState["announcement"]>("")
  // A ref, so a double click in the same render can't send two requests.
  const inFlight = useRef(false)

  const complete = useCallback(
    async (taskId: string) => {
      if (inFlight.current) return
      inFlight.current = true
      setPendingTaskId(taskId)
      setError(null)
      setAnnouncement("")
      try {
        const updated = await completeTask(taskId).unwrap()
        // The last required task completes the roadmap and clears its active
        // slot (§17): keep showing it.
        if (updated.status === "completed") dispatch(roadmapPinned(updated.id))
        setAnnouncement("completed")
      } catch (caught) {
        const conflict = asApiError(caught).code === "task_completion_conflict"
        setError({ taskId, kind: conflict ? "conflict" : "failed" })
        setAnnouncement("failed")
        // The tree on screen disagrees with the server — re-read it.
        if (conflict) {
          dispatch(apiSlice.util.invalidateTags(["ActiveRoadmap", "Roadmap", { type: "Task", id: taskId }]))
        }
      } finally {
        inFlight.current = false
        setPendingTaskId(null)
      }
    },
    [completeTask, dispatch]
  )

  return { pendingTaskId, error, announcement, complete }
}
