import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Shine } from "@/shared/components/animations/Shine"

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
        <CardHeader className="flex-1 justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
            <span className="transition-transform duration-300 group-hover:scale-110">
              {icon}
            </span>
          </div>

          <CardTitle className="text-lg">
            {title}
          </CardTitle>
          </div>

          <CardDescription className="mt-2">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Shine>
  )
}

export { FeatureCard, type FeatureCardProps }