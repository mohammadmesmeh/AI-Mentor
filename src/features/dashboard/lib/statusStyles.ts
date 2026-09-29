import { Check, Circle, Clock, Lock, Play, type LucideIcon } from "lucide-react"
import type { StageStatus } from "@/lib/api/types"
import type { StatusTone } from "@/shared/components/ui/status-tone"
import type { TaskDisplayStatus } from "./learningItems"

/**
 * The single status → tone / icon / label mapping for every workspace page.
 * Colors come from the tone (shared/components/ui/status-tone.ts); labels are
 * translation keys. Purple (`current`) only for the current task and the
 * active stage; completed is navy.
 */

interface StatusStyle {
  tone: StatusTone
  icon: LucideIcon
  /** Key in the `workspace` namespace. */
  labelKey: string
}

export const TASK_STATUS_STYLE: Record<TaskDisplayStatus, StatusStyle> = {
  current: { tone: "current", icon: Play, labelKey: "status.current" },
  available: { tone: "available", icon: Play, labelKey: "status.available" },
  completed: { tone: "completed", icon: Check, labelKey: "status.completed" },
  locked: { tone: "neutral", icon: Lock, labelKey: "status.locked" },
  upcoming: { tone: "upcoming", icon: Circle, labelKey: "status.upcoming" },
  skip_pending: { tone: "neutral", icon: Clock, labelKey: "status.skip_pending" },
  skipped: { tone: "neutral", icon: Circle, labelKey: "status.skipped" },
  replaced: { tone: "neutral", icon: Circle, labelKey: "status.replaced" },
}

export const STAGE_STATUS_STYLE: Record<StageStatus, Omit<StatusStyle, "icon">> = {
  active: { tone: "current", labelKey: "stageStatus.active" },
  completed: { tone: "completed", labelKey: "stageStatus.completed" },
  upcoming: { tone: "neutral", labelKey: "stageStatus.upcoming" },
}
