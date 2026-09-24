"use client"

import { useEffect } from "react"

/**
 * Stops the page behind an overlay (e.g. an open mobile menu) from scrolling
 * while `locked` is true. Cleanup always releases the lock, so unmounting
 * mid-open can't leave the page stuck.
 */
function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [locked])
}

export { useBodyScrollLock }
