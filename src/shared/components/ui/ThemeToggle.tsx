"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/shared/components/providers/ThemeProvider"
import { cn } from "@/lib/utils"

function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggleTheme } = useTheme()

  if (mobile) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "font-ui flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "font-ui flex size-8 items-center justify-center rounded-full transition-all duration-300",
        "border border-border/50 bg-background/50 backdrop-blur-sm",
        "text-muted-foreground hover:text-foreground hover:border-primary/30",
        "active:scale-90"
      )}
      style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
    >
      <span className="relative size-4">
        <Sun
          className={cn(
            "absolute inset-0 size-4 transition-all duration-500",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-4 transition-all duration-500",
            theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
      </span>
    </button>
  )
}

export { ThemeToggle }
