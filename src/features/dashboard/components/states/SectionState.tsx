import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

function SectionState({ title, description, icon: Icon, className }: SectionStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

export { SectionState }