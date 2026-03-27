// CDC OAS — Desktop Security Hook v3.1
// Fix: uses tokenRef (object) so logViolation always reads the latest token
// even if security starts before token is set

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityDesktop({ tokenRef, onViolation }) {
  const listenersRef       = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval   = useRef(null)
  const visGraceTimer      = useRef(null)
  const devToolsInterval   = useRef(null)
  const idleTimer          = useRef(null)
  const focusLossCount     = useRef(0)
  const IDLE_TIMEOUT_MS    = 120000 // 2 min

  // Always reads tokenRef.current — never stale
  const logViolation = useCallback(async (type, details = {}) => {
    const token = tokenRef.current
    if (!token) return
    try {
      await api.post('/exam/violation', {
        session_token:  token,
        violation_type: type,
        details: { ...details, platform: 'desktop' }
      })
    } catch {}
  }, [tokenRef])

  const start = useCallback(() => {

    // 1. FULLSCREEN
    try {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } catch {}

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onViolation('fullscreen_exit')
        setTimeout(() => {
          try { document.documentElement.requestFullscreen?.().catch(() => {}) } catch {}
        }, 800)
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    listenersRef.current.push(['fullscreenchange', onFullscreenChange, document])

    // 2. KEYBOARD SHORTCUTS
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.key === 'F12')                                          { e.preventDefault(); return }
      if (e.ctrlKey && e.shiftKey && ['i','j','c','k'].includes(k)) { e.preventDefault(); return }
      if (e.ctrlKey && ['u','p','s','c','v','x','a'].includes(k))   { e.preventDefault(); return }
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

    // 3. RIGHT CLICK
    const blockRight = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockRight)
    listenersRef.current.push(['contextmenu', blockRight, document])

    // 4. CLIPBOARD
    const blockClip = (e) => e.preventDefault()
    ;['copy','paste','cut'].forEach(ev => {
      document.addEventListener(ev, blockClip)
      listenersRef.current.push([ev, blockClip, document])
    })

    // 5. PRINT
    const blockPrint = () => {
      logViolation('print_attempt')
      onViolation('print_attempt')
    }
    window.addEventListener('beforeprint', blockPrint)
    windowListenersRef.current.push(['beforeprint', blockPrint])

    // 6. TEXT SELECTION
    document.body.style.userSelect       = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.mozUserSelect    = 'none'
    document.body.style.msUserSelect     = 'none'
    const blockSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSelect)
    listenersRef.current.push(['selectstart', blockSelect, document])
    clearSelInterval.current = setInterval(() => {
      window.getSelection?.().removeAllRanges()
      document.selection?.empty()
    }, 500)

    // 7. TAB SWITCH — visibilitychange with 1.5s grace
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(visGraceTimer.current)
        visGraceTimer.current = setTimeout(() => {
          logViolation('tab_switch')
          onViolation('tab_switch')
        }, 1500)
      } else {
        clearTimeout(visGraceTimer.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    listenersRef.current.push(['visibilitychange', onVisibility, document])

    // 8. WINDOW BLUR
    const onBlur = () => {
      focusLossCount.current++
      logViolation('window_blur', { count: focusLossCount.current })
    }
    window.addEventListener('blur', onBlur)
    windowListenersRef.current.push(['blur', onBlur])

    // 9. SPLIT SCREEN / RESIZE
    const origH = window.screen.height
    const origW = window.screen.width
    const onResize = () => {
      const hR = window.innerHeight / origH
      const wR = window.innerWidth  / origW
      if (hR < 0.75 || wR < 0.75) {
        logViolation('split_screen', { hR: hR.toFixed(2), wR: wR.toFixed(2) })
        onViolation('split_screen')
      }
    }
    window.addEventListener('resize', onResize)
    windowListenersRef.current.push(['resize', onResize])

    // 10. DEVTOOLS DETECTION
    let devOpen = false
    devToolsInterval.current = setInterval(() => {
      const wDiff = window.outerWidth  - window.innerWidth  > 160
      const hDiff = window.outerHeight - window.innerHeight > 160
      if ((wDiff || hDiff) && !devOpen) {
        devOpen = true
        logViolation('devtools_open')
        onViolation('devtools_open')
      } else if (!wDiff && !hDiff) {
        devOpen = false
      }
    }, 2000)

    // 11. MULTIPLE MONITORS
    try {
      if (window.screen.isExtended) {
        logViolation('multiple_monitors')
        onViolation('multiple_monitors')
      }
    } catch {}

    // 12. IDLE DETECTION
    const resetIdle = () => {
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        logViolation('idle_detected')
        onViolation('idle_detected')
      }, IDLE_TIMEOUT_MS)
    }
    resetIdle()
    ;['mousemove','keydown','click','scroll'].forEach(ev => {
      window.addEventListener(ev, resetIdle, { passive: true })
      windowListenersRef.current.push([ev, resetIdle])
    })

  }, [tokenRef, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, t]) => t.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current       = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearInterval(devToolsInterval.current)
    clearTimeout(visGraceTimer.current)
    clearTimeout(idleTimer.current)
    document.body.style.userSelect       = ''
    document.body.style.webkitUserSelect = ''
    document.body.style.mozUserSelect    = ''
    document.body.style.msUserSelect     = ''
  }, [])

  return { start, stop }
}
