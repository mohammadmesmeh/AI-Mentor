import { cn } from "@/lib/utils"

import { Shine } from "@/shared/components/animations/Shine"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"

interface StepCardProps {
  number: string
  title: string
  description: string
  active?: boolean
  className?: string
  connector?: boolean
  fill?: number
}

function StepCard({
  number,
  title,
  description,
  active = false,
  className,
  connector = true,
  fill = 0,
}: StepCardProps) {
  const clampedFill = Math.min(1, Math.max(0, fill))

  return (
    <div className={cn("relative flex gap-6", className)}>
      {connector && (
        <>
          <span
            aria-hidden="true"
            className="absolute start-6 top-6 -bottom-[4.5rem] w-px bg-border/60"
          />
          <span
            aria-hidden="true"
            className="absolute start-6 top-6 -bottom-[4.5rem] w-px origin-top bg-gradient-to-b from-primary-500 via-accent-500 to-primary-500"
            style={{ transform: `scaleY(${clampedFill})` }}
          />
        </>
      )}

      {/* Number */}
      <Shine className="h-12 w-12 shrink-0 rounded-full">
        <div
          className={cn(
            "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-500",
            active
              ? "scale-110 border-primary-500/70 bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-[0_0_28px_-6px_var(--color-primary-500)]"
              : "border bg-background text-primary shadow-sm"
          )}
        >
          {number}
        </div>
      </Shine>

      {/* Text */}
      <div className="pt-1">
        <HeadingReveal
          as="h3"
          className={cn("text-xl font-semibold", active && "text-primary")}
        >
          {title}
        </HeadingReveal>

        <FadeInView
          as="p"
          className="mt-2 text-muted-foreground"
          delay={0.05}
        >
          {description}
        </FadeInView>
      </div>
    </div>
  )
}

export { StepCard, type StepCardProps }
