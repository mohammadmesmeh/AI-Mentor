import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Space left for the sticky navbar when a section is scrolled into view. */
export const SECTION_SCROLL_OFFSET = 88

/**
 * Scrolls `target` to just below the sticky navbar — smoothly, or instantly
 * when the user prefers reduced motion. Browser-only: call it from event
 * handlers, never during render.
 */
export function scrollToElement(target: Element): void {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const y = target.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_OFFSET
  window.scrollTo({ top: Math.max(y, 0), behavior: reduceMotion ? "auto" : "smooth" })
}
