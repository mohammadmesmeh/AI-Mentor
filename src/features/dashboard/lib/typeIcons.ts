import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Code,
  FileText,
  GraduationCap,
  PlayCircle,
  type LucideIcon,
} from "lucide-react"
import type { ResourceType, TaskType } from "@/lib/api/types"

/** The icon shown with a task's type (meta rows, marks). */
export const TASK_TYPE_ICON: Record<TaskType, LucideIcon> = {
  read: BookOpen,
  watch: PlayCircle,
  quiz: CircleHelp,
  project: Code,
  assignment: ClipboardList,
  coding_challenge: Code,
}

/** The icon shown with a resource's type. */
export const RESOURCE_TYPE_ICON: Record<ResourceType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  documentation: BookOpen,
  course: GraduationCap,
}
