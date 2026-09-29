import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconBox, Skeleton } from "../ui/workspace"

interface SectionStateProps {
  /** empty (default), an error with an action, "coming soon", or loading lines. */
  kind?: "empty" | "error" | "coming-soon" | "loading"
  title: string
  description?: string
  icon?: LucideIcon
  /** e.g. a retry button (error) or a link (empty). */
  action?: React.ReactNode
  /** A short label at the end of the title row, e.g. "Coming soon". */
  badge?: string
  /** Render the title as the card's h2 (when the state is the whole card). */
  titleAs?: "p" | "h2"
  titleId?: string
  className?: string
}

/** The state of one card's content while the page around it is ready. */
function SectionState({
  kind = "empty",
  title,
  description,
  icon,
  action,
  badge,
  titleAs: Title = "p",
  titleId,
  className,
}: SectionStateProps) {
  if (kind === "loading") {
    return (
      <div role="status" aria-label={title} className={cn("space-y-3", className)}>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div role={kind === "error" ? "alert" : undefined} className={cn("flex flex-col items-start gap-3", className)}>
      <div className="flex w-full items-center gap-3">
        {icon && <IconBox icon={icon} tone={kind === "coming-soon" ? "navy" : "muted"} />}
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-2">
          <Title id={titleId} data-slot="card-title" className="m-0 font-sans text-base font-semibold text-ink">
            {title}
          </Title>
          {badge && <span className="text-[0.8125rem] font-semibold text-status-neutral">{badge}</span>}
        </div>
      </div>
      {description && <p className="m-0 text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}

export { SectionState }
