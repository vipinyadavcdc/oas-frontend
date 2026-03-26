// CDC OAS — Desktop Security Hook
// For: Laptop / PC browsers (Chrome, Firefox, Edge, Safari desktop)

import { useRef, useCallback } from 'react'
import api from '../../utils/api'

export function useSecurityDesktop({ sessionToken, onViolation, onAutoSubmit }) {
  const listenersRef = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval = useRef(null)
  const visGraceTimer = useRef(null)
  const devToolsInterval = useRef(null)
  const idleTimer = useRef(null)
  const focusLossCount = useRef(0)
  const IDLE_TIMEOUT_MS = 120000 // 2 minutes idle = warning

  const logViolation = useCallback(async (type, details = {}) => {
    try {
      await api.post('/exam/violation', {
        session_token: sessionToken,
        violation_type: type,
        details: { ...details, platform: 'desktop' }
      })
    } catch {}
  }, [sessionToken])

  const start = useCallback(() => {
    // ── 1. FULLSCREEN ────────────────────────────────────────────────────────
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch {}

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onViolation('⚠️ Stay in fullscreen mode!')
        setTimeout(() => {
          try { document.documentElement.requestFullscreen?.().catch(() => {}) } catch {}
        }, 800)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    listenersRef.current.push(['fullscreenchange', handleFullscreenChange, document])

    // ── 2. KEYBOARD SHORTCUT BLOCKING ────────────────────────────────────────
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      // DevTools
      if (e.key === 'F12') { e.preventDefault(); return }
      if (e.ctrlKey && e.shiftKey && ['i','j','c','k'].includes(k)) { e.preventDefault(); return }
      if (e.ctrlKey && k === 'u') { e.preventDefault(); return }
      // Print / Save
      if (e.ctrlKey && ['p','s'].includes(k)) { e.preventDefault(); return }
      // Copy / Paste / Cut / Select all
      if (e.ctrlKey && ['c','v','x','a'].includes(k)) { e.preventDefault(); return }
      // View source
      if (e.ctrlKey && k === 'u') { e.preventDefault(); return }
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

    // ── 3. RIGHT CLICK / CONTEXT MENU ────────────────────────────────────────
    const blockRight = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockRight)
    listenersRef.current.push(['contextmenu', blockRight, document])

    // ── 4. COPY / PASTE / CUT ────────────────────────────────────────────────
    const blockClipboard = (e) => e.preventDefault()
    document.addEventListener('copy',  blockClipboard)
    document.addEventListener('paste', blockClipboard)
    document.addEventListener('cut',   blockClipboard)
    listenersRef.current.push(
      ['copy',  blockClipboard, document],
      ['paste', blockClipboard, document],
      ['cut',   blockClipboard, document]
    )

    // ── 5. PRINT BLOCK ───────────────────────────────────────────────────────
    const blockPrint = () => {
      onViolation('⚠️ Printing is not allowed!')
      logViolation('print_attempt')
    }
    window.addEventListener('beforeprint', blockPrint)
    windowListenersRef.current.push(['beforeprint', blockPrint])

    // ── 6. TEXT SELECTION BLOCK ──────────────────────────────────────────────
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.mozUserSelect = 'none'
    document.body.style.msUserSelect = 'none'
    const blockSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSelect)
    listenersRef.current.push(['selectstart', blockSelect, document])

    // Continuously clear any selection
    clearSelInterval.current = setInterval(() => {
      if (window.getSelection) window.getSelection().removeAllRanges()
      if (document.selection) document.selection.empty()
    }, 500)

    // ── 7. TAB SWITCH / VISIBILITY CHANGE ────────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(visGraceTimer.current)
        visGraceTimer.current = setTimeout(() => {
          logViolation('tab_switch')
          onViolation('tab_switch')
        }, 1500) // 1.5s grace for accidental
      } else {
        clearTimeout(visGraceTimer.current)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    listenersRef.current.push(['visibilitychange', handleVisibility, document])

    // ── 8. WINDOW BLUR (focus loss) ──────────────────────────────────────────
    const handleBlur = () => {
      focusLossCount.current++
      logViolation('window_blur', { count: focusLossCount.current })
    }
    window.addEventListener('blur', handleBlur)
    windowListenersRef.current.push(['blur', handleBlur])

    // ── 9. SPLIT SCREEN / WINDOW RESIZE ──────────────────────────────────────
    const origHeight = window.screen.height
    const origWidth  = window.screen.width
    const handleResize = () => {
      const hRatio = window.innerHeight / origHeight
      const wRatio = window.innerWidth  / origWidth
      if (hRatio < 0.75 || wRatio < 0.75) {
        logViolation('split_screen', { hRatio: hRatio.toFixed(2), wRatio: wRatio.toFixed(2) })
        onViolation('split_screen')
      }
    }
    window.addEventListener('resize', handleResize)
    windowListenersRef.current.push(['resize', handleResize])

    // ── 10. DEVTOOLS DETECTION ───────────────────────────────────────────────
    let devToolsOpen = false
    devToolsInterval.current = setInterval(() => {
      const threshold = 160
      const widthDiff  = window.outerWidth  - window.innerWidth  > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      if ((widthDiff || heightDiff) && !devToolsOpen) {
        devToolsOpen = true
        logViolation('devtools_open')
        onViolation('devtools_open')
      } else if (!widthDiff && !heightDiff) {
        devToolsOpen = false
      }
    }, 2000)

    // ── 11. MULTIPLE MONITOR DETECTION ──────────────────────────────────────
    try {
      if (window.screen.isExtended !== undefined && window.screen.isExtended) {
        logViolation('multiple_monitors')
        onViolation('multiple_monitors')
      }
    } catch {}

    // ── 12. IDLE / AFK DETECTION ─────────────────────────────────────────────
    const resetIdle = () => {
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        logViolation('idle_detected', { idle_ms: IDLE_TIMEOUT_MS })
        onViolation('idle_detected')
      }, IDLE_TIMEOUT_MS)
    }
    resetIdle()
    ;['mousemove','keydown','click','scroll'].forEach(ev => {
      window.addEventListener(ev, resetIdle, { passive: true })
      windowListenersRef.current.push([ev, resetIdle])
    })

  }, [sessionToken, onViolation, onAutoSubmit, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, target]) => target.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearInterval(devToolsInterval.current)
    clearTimeout(visGraceTimer.current)
    clearTimeout(idleTimer.current)
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
    document.body.style.mozUserSelect = ''
    document.body.style.msUserSelect = ''
  }, [])

  return { start, stop }
}
