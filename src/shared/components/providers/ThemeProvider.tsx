"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "ai-mentor-theme"
const COOKIE_KEY = "ai-mentor-theme"

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") return stored
  return "dark"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("dark", "light")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    setCookie(COOKIE_KEY, theme, 365)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    setCookie(COOKIE_KEY, next, 365)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export { ThemeProvider, useTheme }
