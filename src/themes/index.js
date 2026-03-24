export const THEMES = {
  ocean: {
    name: 'Ocean Blue',
    emoji: '🔵',
    vars: {
      '--color-primary': '#1a6fbf',
      '--color-primary-dark': '#1458a0',
      '--color-accent': '#0ea5e9',
      '--color-bg': '#f0f7ff',
      '--color-surface': '#ffffff',
      '--color-surface2': '#e8f1fb',
      '--color-text': '#0f2744',
      '--color-text-muted': '#4a6fa5',
      '--color-border': '#bdd4ee',
      '--color-success': '#16a34a',
      '--color-danger': '#dc2626',
      '--color-warning': '#d97706',
    }
  },
  royal: {
    name: 'Royal Purple',
    emoji: '🟣',
    vars: {
      '--color-primary': '#7c3aed',
      '--color-primary-dark': '#6d28d9',
      '--color-accent': '#a855f7',
      '--color-bg': '#f5f3ff',
      '--color-surface': '#ffffff',
      '--color-surface2': '#ede9fe',
      '--color-text': '#1e1b4b',
      '--color-text-muted': '#5b4fa8',
      '--color-border': '#c4b5fd',
      '--color-success': '#16a34a',
      '--color-danger': '#dc2626',
      '--color-warning': '#d97706',
    }
  },
  forest: {
    name: 'Forest Green',
    emoji: '🟢',
    vars: {
      '--color-primary': '#15803d',
      '--color-primary-dark': '#166534',
      '--color-accent': '#22c55e',
      '--color-bg': '#f0fdf4',
      '--color-surface': '#ffffff',
      '--color-surface2': '#dcfce7',
      '--color-text': '#052e16',
      '--color-text-muted': '#166534',
      '--color-border': '#86efac',
      '--color-success': '#16a34a',
      '--color-danger': '#dc2626',
      '--color-warning': '#d97706',
    }
  },
  mriu: {
    name: 'MRIU Maroon',
    emoji: '🔴',
    vars: {
      '--color-primary': '#8b1a1a',
      '--color-primary-dark': '#6f1515',
      '--color-accent': '#c0392b',
      '--color-bg': '#fdf2f2',
      '--color-surface': '#ffffff',
      '--color-surface2': '#fde8e8',
      '--color-text': '#2d0a0a',
      '--color-text-muted': '#7f1d1d',
      '--color-border': '#fca5a5',
      '--color-success': '#16a34a',
      '--color-danger': '#dc2626',
      '--color-warning': '#d97706',
    }
  },
  dark: {
    name: 'Dark Mode',
    emoji: '⚫',
    vars: {
      '--color-primary': '#3b82f6',
      '--color-primary-dark': '#2563eb',
      '--color-accent': '#60a5fa',
      '--color-bg': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-surface2': '#263248',
      '--color-text': '#f1f5f9',
      '--color-text-muted': '#94a3b8',
      '--color-border': '#334155',
      '--color-success': '#22c55e',
      '--color-danger': '#ef4444',
      '--color-warning': '#f59e0b',
    }
  }
}

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey]
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  if (themeKey === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem('cdc_theme', themeKey)
}

export function loadSavedTheme() {
  const saved = localStorage.getItem('cdc_theme') || 'ocean'
  applyTheme(saved)
  return saved
}
