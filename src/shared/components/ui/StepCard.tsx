import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StepCardProps {
  number: string
  title: string
  description: string
  icon: LucideIcon
  className?: string
  /** Extra content under the text (e.g. a decorative preview). */
  children?: ReactNode
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
  className,
  children,
}: StepCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden section-card rounded-2xl p-6 before:pointer-events-none before:absolute before:-bottom-12 before:-end-12 before:content-[''] before:h-36 before:w-36 before:rounded-full before:bg-midnight before:opacity-[0.08] before:blur-[72px]",
        "transition-all duration-300 hover:-translate-y-1 hover:bg-section-card-hover hover:shadow-card",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-5 top-2 select-none font-display text-[88px] font-extrabold leading-none text-ink/5"
      >
        {number}
      </span>

      <div
        aria-hidden="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      <h3 className="relative mt-4 font-display text-lg font-bold text-ink">
        {title}
      </h3>

      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {children && <div className="relative mt-6">{children}</div>}
    </article>
  )
}

export { StepCard, type StepCardProps }