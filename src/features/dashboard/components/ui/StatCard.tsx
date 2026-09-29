import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { IconBox, Skeleton } from "./workspace"

/** A key figure: label with an icon, a large value, and one line of context under it. */
export function StatCard({
  icon,
  label,
  value,
  footer,
  muted = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  footer?: string
  /** Not available yet (e.g. "—" with a "coming soon" footer). */
  muted?: boolean
}) {
  return (
    <Card variant="glass" className="flex min-w-0 flex-col gap-2 p-4 sm:gap-3 sm:p-5">
      <div className="flex items-center gap-2.5">
        <IconBox icon={icon} tone={muted ? "muted" : "soft"} size="sm" className="hidden sm:flex" />
        <span className="min-w-0 text-[0.8125rem] font-semibold text-muted-foreground">{label}</span>
      </div>
      <span
        className={cn(
          "font-display text-[1.625rem] leading-tight font-extrabold tabular-nums sm:text-[2rem]",
          muted ? "text-status-neutral" : "text-ink"
        )}
      >
        {value}
      </span>
      {footer && <span dir="auto" className="text-[0.8125rem] wrap-break-word text-muted-foreground">{footer}</span>}
    </Card>
  )
}

/** A StatCard-sized placeholder. */
export function StatCardSkeleton() {
  return (
    <div aria-hidden="true" className="glass flex flex-col gap-2 rounded-lg p-4 sm:gap-3 sm:p-5">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-20 sm:h-10" />
      <Skeleton className="h-4 w-32 max-w-full" />
    </div>
  )
}

/** The row of four StatCards (two per row on phones). */
export function StatGrid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {children}
    </section>
  )
}
