// CDC OAS — iOS Security Hook v3.1 (FIXED)
// Fix: sessionToken read as ref object (sessionToken.current) at call time
// For: iPhone / iPad Safari / Chrome on iOS
// NOTE: iOS does NOT support Fullscreen API — never call requestFullscreen here

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityIOS({ sessionToken, onViolation, onAutoSubmit }) {
  const listenersRef       = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval   = useRef(null)
  const visGraceTimer      = useRef(null)
  const appSwitchCount     = useRef(0)
  const origHeight         = useRef(window.innerHeight)
  const origWidth          = useRef(window.innerWidth)
  const screenshotCheckRef = useRef(null)

  // ── KEY FIX: always read sessionToken.current at call time ──────────────────
  const logViolation = useCallback(async (type, details = {}) => {
    try {
      const token = typeof sessionToken === 'object' ? sessionToken.current : sessionToken
      if (!token) return
      await api.post('/exam/violation', {
        session_token: token,
        violation_type: type,
        details: { ...details, platform: 'ios' }
      })
    } catch {}
  }, [sessionToken])

  const start = useCallback(() => {
    // Lock viewport — no fullscreen on iOS
    document.body.style.overflow              = 'hidden'
    document.documentElement.style.overflow   = 'hidden'

    // ── 1. APP SWITCH / HOME BUTTON ────────────────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(visGraceTimer.current)
        visGraceTimer.current = setTimeout(() => {
          appSwitchCount.current++
          logViolation('app_switch', { trigger: 'visibilitychange', count: appSwitchCount.current })
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
    }
    window.addEventListener('pagehide', handlePageHide)
    windowListenersRef.current.push(['pagehide', handlePageHide])

    // ── 2. SCREENSHOT DETECTION ────────────────────────────────────────────────
    screenshotCheckRef.current = setInterval(() => {
      const hDiff = Math.abs(window.innerHeight - origHeight.current)
      const wDiff = Math.abs(window.innerWidth  - origWidth.current)
      if (hDiff > 0 && hDiff < 10 && wDiff === 0) {
        logViolation('possible_screenshot', { hDiff, wDiff })
        onViolation('possible_screenshot')
      }
    }, 200)

    // ── 3. AIRPLAY / SCREEN MIRROR DETECTION ──────────────────────────────────
    const handleResize = () => {
      const hRatio = window.innerHeight / origHeight.current
      const wRatio = window.innerWidth  / origWidth.current
      if (hRatio < 0.75 || wRatio < 0.75) {
        logViolation('screen_mirror_or_split', { hRatio: hRatio.toFixed(2), wRatio: wRatio.toFixed(2) })
        onViolation('screen_mirror_or_split')
      }
    }
    window.addEventListener('resize', handleResize)
    windowListenersRef.current.push(['resize', handleResize])

    // ── 4. COPY / PASTE / TEXT SELECTION BLOCK ────────────────────────────────
    const blockClipboard = (e) => e.preventDefault()
    document.addEventListener('copy',  blockClipboard)
    document.addEventListener('paste', blockClipboard)
    document.addEventListener('cut',   blockClipboard)
    listenersRef.current.push(
      ['copy',  blockClipboard, document],
      ['paste', blockClipboard, document],
      ['cut',   blockClipboard, document]
    )

    const blockSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSelect)
    listenersRef.current.push(['selectstart', blockSelect, document])

    document.body.style.webkitUserSelect   = 'none'
    document.body.style.webkitTouchCallout = 'none'
    document.body.style.userSelect         = 'none'

    clearSelInterval.current = setInterval(() => {
      if (window.getSelection) window.getSelection().removeAllRanges()
    }, 400)

    // ── 5. CONTEXT MENU BLOCK ─────────────────────────────────────────────────
    const blockContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockContextMenu)
    listenersRef.current.push(['contextmenu', blockContextMenu, document])

    // ── 6. ZOOM DISABLE ───────────────────────────────────────────────────────
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }, { passive: false })

    let lastTap = 0
    const preventDoubleTap = (e) => {
      const now = Date.now()
      if (now - lastTap < 300) e.preventDefault()
      lastTap = now
    }
    document.addEventListener('touchend', preventDoubleTap, { passive: false })
    listenersRef.current.push(['touchend', preventDoubleTap, document])

    // ── 7. BACK SWIPE BLOCK ───────────────────────────────────────────────────
    history.pushState(null, '', location.href)
    const handlePopState = () => {
      history.pushState(null, '', location.href)
      logViolation('back_swipe_ios')
      onViolation('back_swipe_ios')
    }
    window.addEventListener('popstate', handlePopState)
    windowListenersRef.current.push(['popstate', handlePopState])

    // ── 8. GUIDED ACCESS REMINDER ─────────────────────────────────────────────
    onViolation('guided_access_reminder')

    // ── 9. KEYBOARD SHORTCUTS ─────────────────────────────────────────────────
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.ctrlKey  && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
      if (e.metaKey  && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

  }, [sessionToken, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, target]) => target.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current       = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearInterval(screenshotCheckRef.current)
    clearTimeout(visGraceTimer.current)
    document.body.style.overflow              = ''
    document.documentElement.style.overflow   = ''
    document.body.style.userSelect            = ''
    document.body.style.webkitUserSelect      = ''
    document.body.style.webkitTouchCallout    = ''
  }, [])

  return { start, stop }
}
