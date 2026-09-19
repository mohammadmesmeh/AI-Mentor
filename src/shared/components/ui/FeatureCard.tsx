import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-light-blue-bg/60 bg-light-blue-bg/40 p-6 backdrop-blur-md before:pointer-events-none before:absolute before:-bottom-12 before:-end-12 before:content-[''] before:h-36 before:w-36 before:rounded-full before:bg-midnight before:opacity-[0.08] before:blur-[72px]",
        "transition-all duration-300 hover:-translate-y-1 hover:bg-light-blue-bg/60 hover:shadow-xl",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:bg-light-blue-bg/40 motion-reduce:hover:shadow-none",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white"
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      <h3 className="relative mt-4 font-display text-lg font-bold text-primary">
        {title}
      </h3>

      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  )
}

export { FeatureCard, type FeatureCardProps }