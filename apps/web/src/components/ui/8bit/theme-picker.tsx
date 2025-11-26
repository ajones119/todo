import * as React from "react"
import { Moon, Sun, Monitor, Sword, Sparkles, Eye } from "lucide-react"
import { Button as BitButton } from "@/components/ui/8bit/button"
import {
  Select as BitSelect,
  SelectContent as BitSelectContent,
  SelectItem as BitSelectItem,
  SelectTrigger as BitSelectTrigger,
  SelectValue as BitSelectValue,
} from "@/components/ui/8bit/select"

type Theme = "light" | "dark" | "fighter" | "wizard" | "rogue" | "system"

// Helper function to apply theme classes
const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement
  
  // Remove all theme classes
  root.classList.remove('dark', 'fighter', 'wizard', 'rogue')
  
  if (newTheme === 'dark') {
    root.classList.add('dark')
  } else if (newTheme === 'fighter') {
    root.classList.add('fighter')
  } else if (newTheme === 'wizard') {
    root.classList.add('wizard')
  } else if (newTheme === 'rogue') {
    root.classList.add('rogue')
  } else if (newTheme === 'light') {
    // Light is default, no class needed
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    }
  }
}

export function ThemePicker() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('initiative-tracker-theme') as Theme) || 'system'
  })
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch and apply theme on mount
  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('initiative-tracker-theme') as Theme
    if (stored) {
      setTheme(stored)
      // Apply the theme immediately to ensure it's set
      applyTheme(stored)
    }
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('initiative-tracker-theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return (
      <BitSelect disabled>
        <BitSelectTrigger>
          <BitSelectValue placeholder="Theme" />
        </BitSelectTrigger>
      </BitSelect>
    )
  }

  return (
    <BitSelect value={theme} onValueChange={handleThemeChange}>
      <BitSelectTrigger>
        <BitSelectValue placeholder="Select theme">
          <div className="flex items-center gap-2">
            {theme === "light" && <Sun className="h-4 w-4" />}
            {theme === "dark" && <Moon className="h-4 w-4" />}
            {theme === "fighter" && <Sword className="h-4 w-4" />}
            {theme === "wizard" && <Sparkles className="h-4 w-4" />}
            {theme === "rogue" && <Eye className="h-4 w-4" />}
            {theme === "system" && <Monitor className="h-4 w-4" />}
            <span className="capitalize">{theme || "system"}</span>
          </div>
        </BitSelectValue>
      </BitSelectTrigger>
      <BitSelectContent>
        <BitSelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
        </BitSelectItem>
        <BitSelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
        </BitSelectItem>
        <BitSelectItem value="fighter">
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4" />
            <span>Fighter</span>
          </div>
        </BitSelectItem>
        <BitSelectItem value="wizard">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Wizard</span>
          </div>
        </BitSelectItem>
        <BitSelectItem value="rogue">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Rogue</span>
          </div>
        </BitSelectItem>
        <BitSelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
        </BitSelectItem>
      </BitSelectContent>
    </BitSelect>
  )
}

