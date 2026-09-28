import { BookOpen, GraduationCap, PencilRuler, Video } from "lucide-react"
import type { TaskType } from "@/lib/api/types"

export function taskIcon(type: TaskType, className = "h-4 w-4") {
  switch (type) {
    case "read":
      return <BookOpen className={className} aria-hidden="true" />
    case "watch":
      return <Video className={className} aria-hidden="true" />
    case "project":
    case "coding_challenge":
    case "assignment":
      return <PencilRuler className={className} aria-hidden="true" />
    case "quiz":
      return <GraduationCap className={className} aria-hidden="true" />
  }
}
