/**
 * The workspace's status colors — the only place a tone becomes a class or a
 * color. Features map their own statuses to a tone (e.g.
 * features/dashboard/lib/statusStyles.ts); components never pick colors.
 * Purple (`current`) is reserved for the current task / active stage.
 */
export type StatusTone = "completed" | "current" | "available" | "upcoming" | "neutral"

export const STATUS_TONES: readonly StatusTone[] = ["completed", "current", "available", "upcoming", "neutral"]

/** Text color for a status label. */
export const toneText: Record<StatusTone, string> = {
  completed: "text-status-completed",
  current: "text-status-current-text",
  available: "text-status-available",
  upcoming: "text-status-upcoming",
  neutral: "text-status-neutral",
}

/** Solid fill (dots, bars, legend swatches). */
export const toneFill: Record<StatusTone, string> = {
  completed: "bg-status-completed",
  current: "bg-status-current",
  available: "bg-status-available",
  upcoming: "bg-status-upcoming",
  neutral: "bg-status-neutral",
}

/** The round status mark in front of a task (icon inside). */
export const toneMark: Record<StatusTone, string> = {
  completed: "bg-status-completed text-background",
  current: "border-2 border-status-current bg-card text-status-current",
  available: "border-2 border-status-available bg-card text-status-available",
  upcoming: "border-2 border-line bg-card text-status-neutral",
  neutral: "bg-segment text-status-neutral",
}

/** A filled number/icon box (e.g. a stage's number). */
export const toneBox: Record<StatusTone, string> = {
  completed: "bg-secondary-100 text-primary-900 dark:bg-secondary-300/15 dark:text-status-completed",
  current: "bg-status-current text-white",
  available: "bg-secondary-100 text-status-available dark:bg-secondary-300/15",
  upcoming: "bg-segment text-status-upcoming",
  neutral: "bg-segment text-status-neutral",
}

/** The same colors as CSS values, for SVG/chart fills. */
export const toneColor: Record<StatusTone, string> = {
  completed: "var(--status-completed)",
  current: "var(--status-current)",
  available: "var(--status-available)",
  upcoming: "var(--status-upcoming)",
  neutral: "var(--status-neutral)",
}
