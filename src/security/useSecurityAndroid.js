// CDC OAS — Android Security Hook v3.1
// Fix: uses tokenRef so logViolation always reads latest token

import { useRef, useCallback } from 'react'
import api from '../utils/api'

export function useSecurityAndroid({ tokenRef, onViolation }) {
  const listenersRef       = useRef([])
  const windowListenersRef = useRef([])
  const clearSelInterval   = useRef(null)
  const visGraceTimer      = useRef(null)
  const appSwitchCount     = useRef(0)

  const logViolation = useCallback(async (type, details = {}) => {
    const token = tokenRef.current
    if (!token) return
    try {
      await api.post('/exam/violation', {
        session_token:  token,
        violation_type: type,
        details: { ...details, platform: 'android' }
      })
    } catch {}
  }, [tokenRef])

  const start = useCallback(() => {

    // 1. FULLSCREEN
    try {
      document.documentElement.requestFullscreen?.().catch(() => {})
      document.documentElement.webkitRequestFullscreen?.()
    } catch {}

    // 2. APP SWITCH (visibilitychange + pagehide)
    const onVisibility = () => {
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
    document.addEventListener('visibilitychange', onVisibility)
    listenersRef.current.push(['visibilitychange', onVisibility, document])

    const onPageHide = () => {
      appSwitchCount.current++
      logViolation('app_switch', { trigger: 'pagehide', count: appSwitchCount.current })
    }
    window.addEventListener('pagehide', onPageHide)
    windowListenersRef.current.push(['pagehide', onPageHide])

    // 3. CIRCLE TO SEARCH / SPLIT SCREEN (resize)
    const origH = window.innerHeight
    const origW = window.innerWidth
    const onResize = () => {
      const hR = window.innerHeight / origH
      const wR = window.innerWidth  / origW
      if (hR < 0.75 || wR < 0.75) {
        logViolation('split_screen_or_ai', { hR: hR.toFixed(2), wR: wR.toFixed(2) })
        onViolation('split_screen')
      }
    }
    window.addEventListener('resize', onResize)
    windowListenersRef.current.push(['resize', onResize])

    // 4. CONTEXT MENU / LONG PRESS
    const blockCtx = (e) => e.preventDefault()
    document.addEventListener('contextmenu', blockCtx)
    listenersRef.current.push(['contextmenu', blockCtx, document])

    // 5. TEXT SELECTION
    const blockSel = (e) => e.preventDefault()
    document.addEventListener('selectstart', blockSel)
    listenersRef.current.push(['selectstart', blockSel, document])
    document.body.style.userSelect          = 'none'
    document.body.style.webkitUserSelect    = 'none'
    document.body.style.webkitTouchCallout  = 'none'

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }, { passive: false })
    document.addEventListener('touchend', () => {
      window.getSelection?.().removeAllRanges()
    }, { passive: false })
    document.addEventListener('touchmove', () => {
      window.getSelection?.().removeAllRanges()
    }, { passive: true })

    clearSelInterval.current = setInterval(() => {
      window.getSelection?.().removeAllRanges()
      document.selection?.empty()
    }, 300)

    // 6. CLIPBOARD
    const blockClip = (e) => e.preventDefault()
    ;['copy','paste','cut'].forEach(ev => {
      document.addEventListener(ev, blockClip)
      listenersRef.current.push([ev, blockClip, document])
    })

    // 7. BACK BUTTON
    history.pushState(null, '', location.href)
    const onPopState = () => {
      history.pushState(null, '', location.href)
      logViolation('back_button_press')
      onViolation('back_button')
    }
    window.addEventListener('popstate', onPopState)
    windowListenersRef.current.push(['popstate', onPopState])

    // 8. KEYBOARD SHORTCUTS
    const blockKeys = (e) => {
      const k = e.key?.toLowerCase()
      if (e.ctrlKey && ['c','v','x','a','p','s'].includes(k)) e.preventDefault()
      if (e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('keydown', blockKeys)
    listenersRef.current.push(['keydown', blockKeys, document])

    // 9. BLOCK TOP-EDGE TOUCH (notification bar)
    const blockTopTouch = (e) => {
      if (e.touches[0]?.clientY < 20) e.preventDefault()
    }
    document.addEventListener('touchstart', blockTopTouch, { passive: false })
    listenersRef.current.push(['touchstart', blockTopTouch, document])

    // 10. ORIENTATION LOCK
    try { screen.orientation?.lock('portrait').catch(() => {}) } catch {}

  }, [tokenRef, onViolation, logViolation])

  const stop = useCallback(() => {
    listenersRef.current.forEach(([ev, fn, t]) => t.removeEventListener(ev, fn))
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
