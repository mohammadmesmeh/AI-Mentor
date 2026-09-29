import { cn } from "@/lib/utils"
import { toneFill, toneText, type StatusTone } from "./status-tone"

/** A status as a small colored dot + its label (never a pill). */
export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: StatusTone
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 text-[0.8125rem] font-semibold",
        toneText[tone],
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", toneFill[tone], tone === "current" && "ring-4 ring-status-current/15")}
      />
      {label}
    </span>
  )
}
