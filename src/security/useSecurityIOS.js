// CDC OAS — iOS Security Hook v3.1
// Fix: uses tokenRef so logViolation always reads latest token
// NO fullscreen API — never causes white screen on iOS

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityIOS({ tokenRef, onViolation }) {
  const listenersRef       = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval   = useRef(null)
  const visGraceTimer      = useRef(null)
  const appSwitchCount     = useRef(0)
  const origHeight         = useRef(window.innerHeight)
  const origWidth          = useRef(window.innerWidth)
  const screenshotInterval = useRef(null)

  const logViolation = useCallback(async (type, details = {}) => {
    const token = tokenRef.current
    if (!token) return
    try {
      await api.post('/exam/violation', {
        session_token:  token,
        violation_type: type,
        details: { ...details, platform: 'ios' }
      })
    } catch {}
  }, [tokenRef])

  const start = useCallback(() => {
    // NO requestFullscreen on iOS — causes white screen / crash

    // Lock scroll instead
    document.body.style.overflow              = 'hidden'
    document.documentElement.style.overflow   = 'hidden'

    // 1. APP SWITCH / HOME BUTTON
    const onVisibility = () => {
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
    document.addEventListener('visibilitychange', onVisibility)
    listenersRef.current.push(['visibilitychange', onVisibility, document])

    const onPageHide = () => {
      appSwitchCount.current++
      logViolation('app_switch', { trigger: 'pagehide', count: appSwitchCount.current })
    }
    window.addEventListener('pagehide', onPageHide)
    windowListenersRef.current.push(['pagehide', onPageHide])

    // 2. SCREENSHOT DETECTION (brief resize on some iOS versions)
    screenshotInterval.current = setInterval(() => {
      const hDiff = Math.abs(window.innerHeight - origHeight.current)
      const wDiff = Math.abs(window.innerWidth  - origWidth.current)
      if (hDiff > 0 && hDiff < 10 && wDiff === 0) {
        logViolation('possible_screenshot', { hDiff, wDiff })
        onViolation('possible_screenshot')
      }
    }, 200)

    // 3. AIRPLAY / SCREEN MIRROR / SPLIT VIEW
    const onResize = () => {
      const hR = window.innerHeight / origHeight.current
      const wR = window.innerWidth  / origWidth.current
      if (hR < 0.75 || wR < 0.75) {
        logViolation('screen_mirror_or_split', { hR: hR.toFixed(2), wR: wR.toFixed(2) })
        onViolation('split_screen')
      }
    }
    window.addEventListener('resize', onResize)
    windowListenersRef.current.push(['resize', onResize])

    // 4. CLIPBOARD
    const blockClip = (e) => e.preventDefault()
    ;['copy','paste','cut'].forEach(ev => {
      document.addEventListener(ev, blockClip)
      listenersRef.current.push([ev, blockClip, document])
    })

    // 5. TEXT SELECTION
    document.body.style.webkitUserSelect   = 'none'
    document.body.style.webkitTouchCallout = 'none'
    document.body.style.userSelect         = 'none'
    const blockSel = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSel)
    listenersRef.current.push(['selectstart', blockSel, document])
    clearSelInterval.current = setInterval(() => {
      window.getSelection?.().removeAllRanges()
    }, 400)

    // 6. CONTEXT MENU
    const blockCtx = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockCtx)
    listenersRef.current.push(['contextmenu', blockCtx, document])

    // 7. PINCH ZOOM DISABLE
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }, { passive: false })

    // 8. DOUBLE TAP ZOOM
    let lastTap = 0
    const noDoubleTap = (e) => {
      const now = Date.now()
      if (now - lastTap < 300) e.preventDefault()
      lastTap = now
    }
    document.addEventListener('touchend', noDoubleTap, { passive: false })
    listenersRef.current.push(['touchend', noDoubleTap, document])

    // 9. BACK SWIPE
    history.pushState(null, '', location.href)
    const onPopState = () => {
      history.pushState(null, '', location.href)
      logViolation('back_swipe_ios')
    }
    window.addEventListener('popstate', onPopState)
    windowListenersRef.current.push(['popstate', onPopState])

    // 10. GUIDED ACCESS REMINDER (not a violation — just a banner)
    onViolation('guided_access_reminder')

    // 11. KEYBOARD META KEYS
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.ctrlKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
      if (e.metaKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

  }, [tokenRef, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, t]) => t.removeEventListener(ev, fn))
    windowListenersRef.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn))
    listenersRef.current       = []
    windowListenersRef.current = []
    clearInterval(clearSelInterval.current)
    clearInterval(screenshotInterval.current)
    clearTimeout(visGraceTimer.current)
    document.body.style.overflow              = ''
    document.documentElement.style.overflow   = ''
    document.body.style.userSelect            = ''
    document.body.style.webkitUserSelect      = ''
    document.body.style.webkitTouchCallout    = ''
  }, [])

  return { start, stop }
}
