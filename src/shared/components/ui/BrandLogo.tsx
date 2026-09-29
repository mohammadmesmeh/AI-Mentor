import Image from "next/image"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/hooks/useT"

/** The logo's own aspect ratio (SVG viewBox 1104 × 425). */
const WIDTH = 1104
const HEIGHT = 425

interface BrandLogoProps {
  /**
   * "auto" follows the theme (navy logo on light, light logo on dark);
   * "onDark" always uses the light version (e.g. the navy footer).
   */
  tone?: "auto" | "onDark"
  /** Sets the rendered height; the width follows the logo's ratio. */
  className?: string
  priority?: boolean
}

/**
 * The Khatwa logo (mark + Arabic and English name) from /public. The image
 * carries the name, so its alt text is the brand name.
 */
function BrandLogo({ tone = "auto", className = "h-10", priority }: BrandLogoProps) {
  const t = useT("nav")
  const alt = t("brand", "Khatwa")
  const imageClass = cn("w-auto select-none", className)

  if (tone === "onDark") {
    return (
      <Image src="/khatwa-logo-on-dark.svg" alt={alt} width={WIDTH} height={HEIGHT} unoptimized priority={priority} className={imageClass} />
    )
  }

  return (
    <>
      <Image
        src="/khatwa-logo.svg"
        alt={alt}
        width={WIDTH}
        height={HEIGHT}
        unoptimized
        priority={priority}
        className={cn(imageClass, "dark:hidden")}
      />
      <Image
        src="/khatwa-logo-on-dark.svg"
        alt={alt}
        width={WIDTH}
        height={HEIGHT}
        unoptimized
        priority={priority}
        className={cn(imageClass, "hidden dark:block")}
      />
    </>
  )
}

export { BrandLogo }
