import { useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

const themes = {
  dark: {
    '--bg-primary': '#0a0a0f',
    '--bg-secondary': '#13131a',
    '--bg-tertiary': '#1a1a24',
    '--bg-card': '#1f1f2e',
    '--border': '#2a2a3a',
    '--text-primary': '#e4e4e7',
    '--text-secondary': '#a1a1aa',
    '--text-muted': '#71717a',
    '--accent': '#6366f1',
    '--accent-glow': 'rgba(99, 102, 241, 0.3)',
    '--green': '#10b981',
    '--green-glow': 'rgba(16, 185, 129, 0.2)',
    '--red': '#ef4444',
    '--yellow': '#f59e0b',
    '--purple': '#a855f7',
    '--blue': '#3b82f6',
    '--cyan': '#06b6d4',
  },
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f5f5f7',
    '--bg-tertiary': '#e5e5ea',
    '--bg-card': '#ffffff',
    '--border': '#d1d1d6',
    '--text-primary': '#1c1c1e',
    '--text-secondary': '#636366',
    '--text-muted': '#8e8e93',
    '--accent': '#5856d6',
    '--accent-glow': 'rgba(88, 86, 214, 0.3)',
    '--green': '#34c759',
    '--green-glow': 'rgba(52, 199, 89, 0.2)',
    '--red': '#ff3b30',
    '--yellow': '#ff9500',
    '--purple': '#af52de',
    '--blue': '#007aff',
    '--cyan': '#5ac8fa',
  },
}

export function useTheme() {
  const { theme, setTheme: setStoreTheme } = useAppStore()

  const applyTheme = useCallback((themeName: 'dark' | 'light', customVars?: Record<string, string>) => {
    const themeVars = themes[themeName] || themes.dark
    const root = document.documentElement

    // Remove existing theme class
    root.classList.remove('light-theme', 'dark-theme')
    root.classList.add(themeName === 'light' ? 'light-theme' : 'dark-theme')

    // Apply CSS variables
    Object.entries({ ...themeVars, ...customVars }).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Save to localStorage
    localStorage.setItem('theme', themeName)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setStoreTheme(newTheme)
    applyTheme(newTheme)
  }, [theme, setStoreTheme, applyTheme])

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
    const initialTheme = savedTheme || 'light'
    setStoreTheme(initialTheme)
    applyTheme(initialTheme)
  }, [applyTheme, setStoreTheme])

  return {
    theme,
    setTheme: (name: 'dark' | 'light') => {
      setStoreTheme(name)
      applyTheme(name)
    },
    toggleTheme,
    applyTheme,
  }
}