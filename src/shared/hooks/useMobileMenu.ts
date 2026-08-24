"use client"

import { useState, useCallback } from "react"

interface UseMobileMenuReturn {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

function useMobileMenu(initialState = false): UseMobileMenuReturn {
  const [isOpen, setIsOpen] = useState(initialState)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, toggle, open, close }
}

export { useMobileMenu }
export type { UseMobileMenuReturn }
