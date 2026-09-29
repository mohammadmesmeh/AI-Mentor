import { cn } from "@/lib/utils"

/** A person's initial in a circle (decorative: the name is always shown next to it). */
export function Avatar({ name, tone = "soft", className }: { name: string; tone?: "soft" | "navy"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        tone === "soft"
          ? "bg-secondary-100 text-primary-900 dark:bg-secondary-300/20 dark:text-secondary-100"
          : "bg-primary-900 text-white dark:bg-secondary-300/25",
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
