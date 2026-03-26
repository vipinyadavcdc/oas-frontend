// CDC OAS — Android Security Hook v3.1 (FIXED)
// Fix: sessionToken read as ref object (sessionToken.current) at call time
// For: Android Chrome / WebView

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityAndroid({ sessionToken, onViolation, onAutoSubmit }) {
  const listenersRef       = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval   = useRef(null)
  const visGraceTimer      = useRef(null)
  const appSwitchCount     = useRef(0)

  // ── KEY FIX: always read sessionToken.current at call time ──────────────────
  const logViolation = useCallback(async (type, details = {}) => {
    try {
      const token = typeof sessionToken === 'object' ? sessionToken.current : sessionToken
      if (!token) return
      await api.post('/exam/violation', {
        session_token: token,
        violation_type: type,
        details: { ...details, platform: 'android' }
      })
    } catch {}
  }, [sessionToken])

  const start = useCallback(() => {

    // ── 1. FULLSCREEN ──────────────────────────────────────────────────────────
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen()
      }
    } catch {}

    // ── 2. APP SWITCH / TAB SWITCH DETECTION ──────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(visGraceTimer.current)
        visGraceTimer.current = setTimeout(() => {
          appSwitchCount.current++
          logViolation('app_switch', { count: appSwitchCount.current })
          onViolation('app_switch')
        }, 800)
      } else {
        clearTimeout(visGraceTimer.current)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    listenersRef.current.push(['visibilitychange', handleVisibility, document])

    const handlePageHide = () => {
      appSwitchCount.current++
      logViolation('app_switch', { trigger: 'pagehide', count: appSwitchCount.current })
      onViolation('app_switch')
    }
    window.addEventListener('pagehide', handlePageHide)
    windowListenersRef.current.push(['pagehide', handlePageHide])

    // ── 3. CIRCLE TO SEARCH / SPLIT SCREEN ────────────────────────────────────
    const origHeight = window.innerHeight
    const origWidth  = window.innerWidth
    const handleResize = () => {
      const hRatio = window.innerHeight / origHeight
      const wRatio = window.innerWidth  / origWidth
      if (hRatio < 0.75 || wRatio < 0.75) {
        logViolation('split_screen_or_ai', { hRatio: hRatio.toFixed(2), wRatio: wRatio.toFixed(2) })
        onViolation('split_screen_or_ai')
      }
    }
    window.addEventListener('resize', handleResize)
    windowListenersRef.current.push(['resize', handleResize])

    // ── 4. CONTEXT MENU / LONG PRESS BLOCK ────────────────────────────────────
    const blockContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockContextMenu)
    listenersRef.current.push(['contextmenu', blockContextMenu, document])

    // ── 5. TEXT SELECTION BLOCK ────────────────────────────────────────────────
    const blockSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSelect)
    listenersRef.current.push(['selectstart', blockSelect, document])

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }, { passive: false })

    document.addEventListener('touchend', () => {
      if (window.getSelection) window.getSelection().removeAllRanges()
    }, { passive: false })

    document.addEventListener('touchmove', () => {
      if (window.getSelection) window.getSelection().removeAllRanges()
    }, { passive: true })

    clearSelInterval.current = setInterval(() => {
      if (window.getSelection) window.getSelection().removeAllRanges()
      if (document.selection)  document.selection.empty()
    }, 300)

    // ── 6. TEXT SELECTION CSS BLOCK ────────────────────────────────────────────
    document.body.style.userSelect          = 'none'
    document.body.style.webkitUserSelect    = 'none'
    document.body.style.webkitTouchCallout  = 'none'

    // ── 7. BACK BUTTON BLOCK ──────────────────────────────────────────────────
    history.pushState(null, '', location.href)
    const handlePopState = () => {
      history.pushState(null, '', location.href)
      logViolation('back_button_press')
      onViolation('back_button')
    }
    window.addEventListener('popstate', handlePopState)
    windowListenersRef.current.push(['popstate', handlePopState])

    // ── 8. COPY / PASTE / CUT BLOCK ───────────────────────────────────────────
    const blockClipboard = (e) => e.preventDefault()
    document.addEventListener('copy',  blockClipboard)
    document.addEventListener('paste', blockClipboard)
    document.addEventListener('cut',   blockClipboard)
    listenersRef.current.push(
      ['copy',  blockClipboard, document],
      ['paste', blockClipboard, document],
      ['cut',   blockClipboard, document]
    )

    // ── 9. KEYBOARD SHORTCUT BLOCK ─────────────────────────────────────────────
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.ctrlKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
      if (e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

    // ── 10. TOUCH OUTSIDE TOP AREA BLOCK ──────────────────────────────────────
    const blockTopTouch = (e) => {
      if (e.touches[0]?.clientY < 20) e.preventDefault()
    }
    document.addEventListener('touchstart', blockTopTouch, { passive: false })
    listenersRef.current.push(['touchstart', blockTopTouch, document])

    // ── 11. ORIENTATION LOCK ───────────────────────────────────────────────────
    try {
      if (screen.orientation?.lock) {
        screen.orientation.lock('portrait').catch(() => {})
      }
    } catch {}

  }, [sessionToken, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, target]) => target.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current       = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearTimeout(visGraceTimer.current)
    document.body.style.userSelect         = ''
    document.body.style.webkitUserSelect   = ''
    document.body.style.webkitTouchCallout = ''
    try { screen.orientation?.unlock?.() } catch {}
  }, [])

  return { start, stop }
}
