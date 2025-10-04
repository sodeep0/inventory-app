"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark" | "system"

function getSystemPreference(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const effective = theme === "system" ? getSystemPreference() : theme
  if (effective === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return
    
    applyTheme(theme)
    localStorage.setItem("theme", theme)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if ((localStorage.getItem("theme") as Theme) === "system") applyTheme("system")
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme, mounted])

  const cycleTheme = () => {
    const order: Theme[] = ["light", "dark", "system"]
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const icon = theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : (
    <>
      <Sun className="h-4 w-4" />
    </>
  )

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={cycleTheme}>
      {icon}
    </Button>
  )
}


