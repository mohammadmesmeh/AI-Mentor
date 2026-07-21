"use client"

import { useState, useEffect, type ReactNode } from "react"
import { LoadingScreen } from "@/shared/components/ui/LoadingScreen"

interface AppLoaderProps {
  children: ReactNode
  displayTime?: number
}

function AppLoader({ children, displayTime = 2000 }: AppLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, displayTime)

    return () => clearTimeout(timer)
  }, [displayTime])

  return (
    <div style={{ position: "relative" }}>
      <LoadingScreen isLoading={isLoading} />
      <div
        aria-hidden={isLoading}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { AppLoader }
