import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Metadata (type, time, goal, level…) as plain text with a small icon. */
export function MetaItem({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 wrap-break-word">{children}</span>
    </span>
  )
}

/** A wrapping row of MetaItems. */
export function MetaList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-1.5", className)}>{children}</div>
}
