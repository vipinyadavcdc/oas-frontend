// CDC OAS — iOS Security Hook
// For: iPhone / iPad Safari / Chrome on iOS
// NOTE: iOS does NOT support Fullscreen API, DevTools detection, or screen.orientation.lock
// We work WITHIN iOS limitations — no crashes, no white screens

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityIOS({ sessionToken, onViolation, onAutoSubmit }) {
  const listenersRef = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval = useRef(null)
  const visGraceTimer = useRef(null)
  const appSwitchCount = useRef(0)
  const origHeight = useRef(window.innerHeight)
  const origWidth  = useRef(window.innerWidth)
  const screenshotCheckRef = useRef(null)

  const logViolation = useCallback(async (type, details = {}) => {
    try {
      await api.post('/exam/violation', {
        session_token: sessionToken,
        violation_type: type,
        details: { ...details, platform: 'ios' }
      })
    } catch {}
  }, [sessionToken])

  const start = useCallback(() => {
    // NOTE: NO fullscreen on iOS — Safari blocks it. Never call requestFullscreen.
    // Instead we lock the viewport and prevent scrolling.
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // ── 1. APP SWITCH / HOME BUTTON (visibilitychange is reliable on iOS) ────
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

    // pagehide fires on iOS when user goes to home screen or app switcher
    const handlePageHide = () => {
      appSwitchCount.current++
      logViolation('app_switch', { trigger: 'pagehide', count: appSwitchCount.current })
    }
    window.addEventListener('pagehide', handlePageHide)
    windowListenersRef.current.push(['pagehide', handlePageHide])

    // ── 2. SCREENSHOT DETECTION (iOS resize trick) ────────────────────────────
    // On some iOS versions, taking a screenshot briefly resizes the viewport
    screenshotCheckRef.current = setInterval(() => {
      const currentH = window.innerHeight
      const currentW = window.innerWidth
      // A very small resize (1-5px) that snaps back = screenshot indicator
      const hDiff = Math.abs(currentH - origHeight.current)
      const wDiff = Math.abs(currentW - origWidth.current)
      if (hDiff > 0 && hDiff < 10 && wDiff === 0) {
        logViolation('possible_screenshot', { hDiff, wDiff })
        onViolation('possible_screenshot')
      }
    }, 200)

    // ── 3. AIRPLAY / SCREEN MIRROR DETECTION ─────────────────────────────────
    const handleResize = () => {
      const hRatio = window.innerHeight / origHeight.current
      const wRatio = window.innerWidth  / origWidth.current
      // Large resize = screen mirroring or split view
      if (hRatio < 0.75 || wRatio < 0.75) {
        logViolation('screen_mirror_or_split', { hRatio: hRatio.toFixed(2), wRatio: wRatio.toFixed(2) })
        onViolation('split_screen')
      }
    }
    window.addEventListener('resize', handleResize)
    windowListenersRef.current.push(['resize', handleResize])

    // ── 4. COPY / PASTE / TEXT SELECTION BLOCK ───────────────────────────────
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

    // iOS-specific: block callout (the "Copy | Look Up" popup)
    document.body.style.webkitUserSelect = 'none'
    document.body.style.webkitTouchCallout = 'none'
    document.body.style.userSelect = 'none'

    // Continuously clear selection
    clearSelInterval.current = setInterval(() => {
      if (window.getSelection) window.getSelection().removeAllRanges()
    }, 400)

    // ── 5. CONTEXT MENU BLOCK ────────────────────────────────────────────────
    const blockContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockContextMenu)
    listenersRef.current.push(['contextmenu', blockContextMenu, document])

    // ── 6. ZOOM DISABLE ──────────────────────────────────────────────────────
    // Prevent pinch-to-zoom (can expose content outside viewport)
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }, { passive: false })

    // Double-tap zoom prevention
    let lastTap = 0
    const preventDoubleTap = (e) => {
      const now = Date.now()
      if (now - lastTap < 300) e.preventDefault()
      lastTap = now
    }
    document.addEventListener('touchend', preventDoubleTap, { passive: false })
    listenersRef.current.push(['touchend', preventDoubleTap, document])

    // ── 7. BACK BUTTON / SWIPE BACK BLOCK ────────────────────────────────────
    history.pushState(null, '', location.href)
    const handlePopState = () => {
      history.pushState(null, '', location.href)
      logViolation('back_swipe_ios')
    }
    window.addEventListener('popstate', handlePopState)
    windowListenersRef.current.push(['popstate', handlePopState])

    // ── 8. GUIDED ACCESS REMINDER (show once) ────────────────────────────────
    // We can't ENFORCE Guided Access, but we remind the student
    // This is shown via onViolation with special type so UI can show a persistent banner
    onViolation('guided_access_reminder')

    // ── 9. KEYBOARD SHORTCUTS ────────────────────────────────────────────────
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.ctrlKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
      if (e.metaKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault() // Cmd key on iOS keyboard
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

  }, [sessionToken, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, target]) => target.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearInterval(screenshotCheckRef.current)
    clearTimeout(visGraceTimer.current)
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
    document.body.style.webkitTouchCallout = ''
  }, [])

  return { start, stop }
}
