"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "ai-mentor-theme"
/** Read by the root layout on the server; see `readThemeCookie`. */
export const THEME_COOKIE = "ai-mentor-theme"
const COOKIE_KEY = THEME_COOKIE

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "dark" || stored === "light" ? stored : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("dark", "light")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

/**
 * The theme starts from `initialTheme`: the value the server read from the
 * theme cookie and already used for the <html> class. Server and client
 * therefore render the same markup (React #418 came from the client starting
 * from localStorage while the server started from "light"). The cookie and
 * localStorage are always written together; if only localStorage has a value
 * (an old visit, a cleared cookie), it is applied after hydration.
 */
function ThemeProvider({ children, initialTheme = "light" }: { children: ReactNode; initialTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  useEffect(() => {
    const stored = storedTheme()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration sync with the stored preference.
    if (stored && stored !== initialTheme) setThemeState(stored)
  }, [initialTheme])

  useEffect(() => {
    applyTheme(theme)
    setCookie(COOKIE_KEY, theme, 365)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the cookie still carries the choice.
    }
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
