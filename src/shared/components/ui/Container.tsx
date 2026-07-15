import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  as?: "div" | "section" | "article" | "main"
  wide?: boolean
}

function Container({
  children,
  className,
  as: Component = "div",
  wide = false,
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-5",
        wide ? "max-w-(--container-wide)" : "max-w-(--container-content)",
        className
      )}
    >
      {children}
    </Component>
  )
}

export { Container }
