"use client"

import { useEffect, useState } from "react"

/**
 * Whether the window has scrolled more than `threshold` pixels. The position is
 * read once on mount too, so reloading mid-page starts in the right state.
 */
function useScrolledPast(threshold: number): boolean {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return isScrolled
}

export { useScrolledPast }
