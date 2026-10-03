import { cn } from "@/lib/utils"
import { useT } from "@/shared/hooks/useT"
import { LOGO_VIEWBOX, WORDMARK_PATHS } from "./brand-logo-paths"

interface BrandLogoProps {
  /**
   * "auto" follows the theme; "onDark" always uses the on-dark colors (e.g.
   * the footer, which is navy in both themes).
   */
  tone?: "auto" | "onDark"
  /** Sets the rendered height; the width follows the logo's ratio. */
  className?: string
}

/**
 * The Khatwa logo — mark (dot + two chevrons) and the Arabic and English
 * name — as one inline SVG with no background, so it sits directly on
 * whatever is behind it.
 *
 * Colors are the `--logo-ink` / `--logo-accent` theme tokens (globals.css):
 * navy #12314D and #4683CB in light, white and #93BDFF in dark. They switch
 * with the theme class in CSS, so server and client render the same markup.
 * "onDark" applies the `dark` class to the logo itself.
 *
 * The full logo carries a wordmark, so it is never mirrored in RTL.
 */
function BrandLogo({ tone = "auto", className = "h-10" }: BrandLogoProps) {
  const t = useT("nav")
  const name = t("brand", "Khatwa")

  return (
    <svg
      role="img"
      aria-label={name}
      viewBox={LOGO_VIEWBOX}
      className={cn("w-auto shrink-0 select-none", tone === "onDark" && "dark", className)}
    >
      <circle cx="389" cy="435" r="55" className="fill-logo-ink" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="475,330 580,435 475,540" strokeWidth="97" className="stroke-logo-ink" />
        <polyline points="618,326 728,435 618,544" strokeWidth="75" className="stroke-logo-accent" />
      </g>
      {WORDMARK_PATHS.map((path) => (
        <path key={path.transform} transform={path.transform} d={path.d} className="fill-logo-ink" />
      ))}
    </svg>
  )
}

export { BrandLogo }
