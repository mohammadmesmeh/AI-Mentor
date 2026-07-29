import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

import {
  Card,
  CardHeader,
} from "@/components/ui/card"
import { Shine } from "@/shared/components/animations/Shine"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { IconBounce } from "@/shared/components/animations/IconBounce"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Shine className="h-full rounded-xl" >
      <Card
        className={cn(
          "group flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20",
          className
        )}
      >
        <CardHeader className="flex-1">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20" aria-hidden="true">
              <IconBounce>
                {icon}
              </IconBounce>
          </div>

          <HeadingReveal as="h3" className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </HeadingReveal>
          </div>

          <FadeInView as="p" className="mt-auto text-sm text-muted-foreground" delay={0.05}>
            {description}
          </FadeInView>
        </CardHeader>
      </Card>
    </Shine>
  )
}

export { FeatureCard, type FeatureCardProps }