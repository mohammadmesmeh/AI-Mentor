"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock, PlayCircle } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/shared/components/ui/Button"
import type { StageStatus } from "@/lib/api/types"
import type { TaskDisplayStatus } from "../../lib/learningItems"

/*
 * Shared building blocks for every workspace page (design.md): cards 16px
 * (rounded-lg), icon boxes 12px, inputs/buttons 8px (rounded-md), chips as
 * full pills. Purple (accent-700) marks only the current task and the active
 * stage. Motion is a short fade that reduced-motion turns off.
 */

/** The page's single h1, with an optional line of context and one main action. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  titleDir,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  /** "auto" for server/AI text (e.g. a task title) that may be in either language. */
  titleDir?: "auto"
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-72 space-y-1">
        {eyebrow && (
          <p className="text-sm font-medium tracking-wide text-secondary-700 dark:text-secondary-300">{eyebrow}</p>
        )}
        <h1
          dir={titleDir}
          className="wrap-break-word font-display text-heading-md font-bold text-foreground sm:text-heading-lg"
        >
          {title}
        </h1>
        {description && (
          <p dir="auto" className="max-w-2xl wrap-break-word text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" }) {
  return (
    <section
      className={cn("rounded-lg border border-border/70 bg-card text-card-foreground shadow-card", className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function IconBox({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon
  tone?: "primary" | "accent" | "muted" | "success"
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
        tone === "primary" && "bg-primary/10 text-primary dark:bg-primary-300/15 dark:text-primary-200",
        tone === "accent" && "bg-accent-700/10 text-accent-700 dark:text-accent-300",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "success" && "bg-success-500/10 text-success-600 dark:text-success-500",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  )
}

/** Panel heading row: icon box, h2, optional trailing content. */
export function PanelHeader({
  id,
  icon,
  title,
  trailing,
  className,
}: {
  id: string
  icon: LucideIcon
  title: string
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-5", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <IconBox icon={icon} />
        <h2 id={id} className="font-display text-heading-sm font-semibold text-foreground">
          {title}
        </h2>
      </div>
      {trailing}
    </div>
  )
}

const TASK_CHIP: Record<TaskDisplayStatus, { className: string; icon: LucideIcon }> = {
  current: { className: "bg-accent-700 text-white", icon: PlayCircle },
  available: {
    className: "bg-secondary-700/10 text-secondary-700 dark:bg-secondary-300/15 dark:text-secondary-200",
    icon: Circle,
  },
  completed: { className: "badge-success", icon: CheckCircle2 },
  locked: { className: "bg-muted text-muted-foreground", icon: Lock },
  upcoming: { className: "bg-muted text-muted-foreground", icon: Clock },
  skip_pending: { className: "bg-muted text-muted-foreground", icon: Clock },
  skipped: { className: "bg-muted text-muted-foreground", icon: Circle },
  replaced: { className: "bg-muted text-muted-foreground", icon: Circle },
}

export function TaskStatusChip({ status, label }: { status: TaskDisplayStatus; label: string }) {
  const { className, icon: Icon } = TASK_CHIP[status]
  return (
    <span className={cn("badge-base shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

export function StageStatusChip({ status, label }: { status: StageStatus; label: string }) {
  return (
    <span
      className={cn(
        "badge-base shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "active" && "bg-accent-700 text-white",
        status === "completed" && "badge-success",
        status === "upcoming" && "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}

/** A neutral pill for metadata (type, duration, "Optional"…). */
export function MetaChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("badge-base rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", className)}>
      {children}
    </span>
  )
}

/** Full-page empty / error / signed-out state: short, friendly, one clear action. */
export function PageState({
  icon,
  title,
  description,
  action,
  tone = "primary",
  role,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: "primary" | "muted"
  role?: "alert" | "status"
}) {
  return (
    <div role={role} className="mx-auto flex max-w-md animate-fade-in flex-col items-center gap-4 py-16 text-center">
      <IconBox icon={icon} tone={tone} className="h-14 w-14 [&_svg]:h-7 [&_svg]:w-7" />
      <div className="space-y-2">
        <h1 className="font-display text-heading-md font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
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
  variant?: "primary" | "secondary"
  className?: string
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size: "lg" }), "min-h-11", className)}>
      {children}
    </Link>
  )
}

/** "Back to …" link; the arrow flips in RTL. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-secondary-700 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
    >
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      {label}
    </Link>
  )
}

/** A placeholder block with the size of the content it stands for (no layout shift). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} />
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
