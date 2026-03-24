import { useState, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { THEMES, applyTheme } from '../../themes'

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(localStorage.getItem('cdc_theme') || 'ocean')
  const [open, setOpen] = useState(false)

  const handleTheme = (key) => {
    applyTheme(key)
    setCurrent(key)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}>
        <Palette size={16} />
        <span className="hidden sm:inline">{THEMES[current]?.emoji} {THEMES[current]?.name}</span>
        <span className="sm:hidden">{THEMES[current]?.emoji}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-lg z-20 overflow-hidden border"
               style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-2">
              <div className="text-xs font-semibold px-2 py-1.5 uppercase tracking-wider"
                   style={{ color: 'var(--color-text-muted)' }}>Choose Theme</div>
              {Object.entries(THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => handleTheme(key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
                  style={{
                    background: current === key ? 'var(--color-surface2)' : 'transparent',
                    color: 'var(--color-text)',
                    fontWeight: current === key ? '600' : '400'
                  }}>
                  <span className="text-lg">{theme.emoji}</span>
                  <span>{theme.name}</span>
                  {current === key && <span className="ml-auto text-xs" style={{ color: 'var(--color-primary)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
