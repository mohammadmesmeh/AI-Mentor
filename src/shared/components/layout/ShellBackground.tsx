"use client"

import { createContext, useContext } from "react"
import { usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

/**
 * What sits behind the navbar at the top of the page:
 * - "light": a surface that follows the theme (auth, onboarding);
 * - "brand-light": the home hero, light in both themes;
 * - "dark": a surface that is dark in both themes.
 */
export type SurfaceTheme = "dark" | "light" | "brand-light"

const SurfaceThemeContext = createContext<SurfaceTheme>("dark")

export const useSurfaceTheme = () => useContext(SurfaceThemeContext)

const authSurface =
  "relative flex flex-1 flex-col " +
  "bg-[radial-gradient(85%_65%_at_50%_100%,#BFE7FC_0%,#D8F0FE_45%,#F0F8FF_75%,#FFFFFF_100%)] " +
  // Same glow-rising-from-bottom shape, translated to the dark azure/navy
  // scale (secondary-800 -> secondary-900 -> dark surface -> dark canvas)
  // instead of collapsing to a flat dark color.
  "dark:bg-[radial-gradient(85%_65%_at_50%_100%,#1b4579_0%,#173a66_45%,#10141d_75%,#0a0d14_100%)]"

interface ShellBackgroundProps {
  children: React.ReactNode
  decor?: React.ReactNode
}

function ShellBackground({ children, decor }: ShellBackgroundProps) {
  const pathname = usePathname()
  const isAuthSurface =
    typeof pathname === "string" &&
    (pathname.startsWith("/auth") || pathname.startsWith("/onboarding"))

  const surfaceTheme: SurfaceTheme = isAuthSurface ? "light" : pathname === "/" ? "brand-light" : "dark"

  if (!isAuthSurface) {
    return (
      <SurfaceThemeContext.Provider value={surfaceTheme}>
        <div className="flex flex-1 flex-col">{children}</div>
      </SurfaceThemeContext.Provider>
    )
  }

  return (
    <SurfaceThemeContext.Provider value={surfaceTheme}>
      <div className={cn("flex flex-1 flex-col", authSurface)}>
        {/* overflow-hidden contains the decor: its corner artwork is a fixed
            384px square pinned to the physical right edge, which spills past
            narrow viewports. Under dir="rtl" that spill is *leading*, so the
            browser counts it as scrollable and the page gains a horizontal
            scrollbar (64px of it at 320px wide) that LTR never shows. */}
        {decor && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {decor}
          </div>
        )}
        <div className="relative z-10 flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </SurfaceThemeContext.Provider>
  )
}

export { ShellBackground }