import type { LucideIcon } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/shared/components/ui/Button"
import { toneMark } from "@/shared/components/ui/status-tone"
import type { TaskDisplayStatus } from "../../lib/learningItems"
import { TASK_STATUS_STYLE } from "../../lib/statusStyles"

/*
 * Shared building blocks for every workspace page: glass cards 16px
 * (rounded-lg), icon boxes 12px (rounded-icon), inputs/buttons 8px
 * (rounded-md). Statuses are a dot + text or a round mark, never a pill.
 * Purple marks only the current task and the active stage.
 */

/** The page's single h1 (display font), a line of context, meta and one main action. */
export function PageHeader({
  title,
  description,
  meta,
  action,
  titleDir,
}: {
  title: string
  description?: string
  /** A row of MetaItems under the title. */
  meta?: React.ReactNode
  action?: React.ReactNode
  /** "auto" for server/AI text (e.g. a goal) that may be in either language. */
  titleDir?: "auto"
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-72 space-y-2">
        <h1
          dir={titleDir}
          className="m-0 wrap-break-word font-display text-[1.75rem] leading-snug font-extrabold text-ink sm:text-[2.125rem]"
        >
          {title}
        </h1>
        {description && (
          <p dir="auto" className="m-0 max-w-2xl wrap-break-word text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {meta}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

/** A glass card with a titled header: the section every workspace page is made of. */
export function WorkspaceCard({
  titleId,
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: {
  titleId: string
  title: string
  description?: string
  /** Trailing header content: a link, a status, a button. */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}) {
  return (
    <Card as="section" variant="glass" aria-labelledby={titleId} className={cn("flex flex-col", className)}>
      <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6", headerClassName)}>
        <div className="min-w-0 space-y-0.5">
          <CardTitle as="h2" id={titleId}>
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">{children}</div>
    </Card>
  )
}

const ICON_BOX_TONE = {
  soft: "bg-secondary-100 text-secondary-700 dark:bg-secondary-300/15 dark:text-secondary-300",
  navy: "bg-primary-900 text-secondary-100 dark:bg-secondary-300/20 dark:text-secondary-100",
  current: "bg-status-current/10 text-status-current-text",
  muted: "bg-segment text-status-neutral",
} as const

export function IconBox({
  icon: Icon,
  tone = "soft",
  size = "md",
  className,
}: {
  icon: LucideIcon
  tone?: keyof typeof ICON_BOX_TONE
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-icon",
        size === "sm" && "size-9 [&_svg]:size-[1.125rem]",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-14 [&_svg]:size-7",
        ICON_BOX_TONE[tone],
        className
      )}
    >
      <Icon />
    </span>
  )
}

/**
 * The round mark in front of a task (check, play, lock…), colored by status.
 * The label is read by assistive technology; the mark itself is decorative.
 */
export function TaskStatusMark({
  status,
  label,
  size = "md",
}: {
  status: TaskDisplayStatus
  label: string
  size?: "sm" | "md"
}) {
  const { tone, icon: Icon } = TASK_STATUS_STYLE[status]
  return (
    <span className="flex shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full",
          size === "sm" ? "size-7 [&_svg]:size-3.5" : "size-8 [&_svg]:size-[0.9375rem]",
          toneMark[tone]
        )}
      >
        <Icon strokeWidth={2.4} />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Full-page empty / error / signed-out state: short, friendly, one clear action. */
export function PageState({
  icon,
  title,
  description,
  action,
  tone = "soft",
  role,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: "soft" | "muted"
  role?: "alert" | "status"
}) {
  return (
    <div role={role} className="mx-auto flex max-w-md animate-fade-in flex-col items-center gap-4 py-16 text-center">
      <IconBox icon={icon} tone={tone} size="lg" />
      <div className="space-y-2">
        <h1 className="m-0 font-display text-heading-md font-extrabold text-ink">{title}</h1>
        {description && <p className="m-0 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** A link styled as a button — for navigation (never a <button>). 44px tall for touch. */
export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "glass"
  className?: string
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size: "lg" }), "min-h-11 no-underline", className)}>
      {children}
    </Link>
  )
}

/** "Back to …" link; the arrow flips in RTL. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-md px-1 text-sm font-semibold text-secondary-700 no-underline transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
    >
      <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
      {label}
    </Link>
  )
}

/** A text link inside a card header ("All tasks", "View plan"). */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md text-[0.8125rem] font-semibold text-secondary-700 no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
    >
      {children}
    </Link>
  )
}

/** A placeholder block with the size of the content it stands for (no layout shift). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-segment motion-reduce:animate-none", className)} />
}

/** A glass card-shaped placeholder. */
export function CardSkeleton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div aria-hidden="true" className={cn("glass rounded-lg p-5 sm:p-6", className)}>
      {children}
    </div>
  )
}

/** Busy wrapper: announces loading once, hides the placeholder shapes from AT. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" role="status" aria-label={label} className="space-y-6">
      {children}
    </div>
  )
}

/** Visually hidden live region for results (completion, saved settings…). */
export function LiveMessage({ message }: { message: string }) {
  return (
    <p className="sr-only" aria-live="polite" role="status">
      {message}
    </p>
  )
}
