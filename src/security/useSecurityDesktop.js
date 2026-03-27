// CDC OAS — Desktop Security Hook v3.2
// Fixes: fullscreen overlay, violation counter, tab switch dedup

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
  const lastFsChangeTime   = useRef(0)
  const IDLE_TIMEOUT_MS    = 120000

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

    // 1. FULLSCREEN - enter on start
    try {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } catch {}

    // Blocking overlay shown when student exits fullscreen
    // Chrome needs user gesture for requestFullscreen, so we use a button
    const overlay = document.createElement('div')
    overlay.id = 'cdc-fs-overlay'
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.93);color:white;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:sans-serif'

    const icon = document.createElement('div')
    icon.textContent = '\u26A0\uFE0F'
    icon.style.cssText = 'font-size:52px;margin-bottom:16px'

    const title = document.createElement('h2')
    title.textContent = 'Fullscreen Required'
    title.style.cssText = 'font-size:22px;font-weight:700;margin-bottom:12px;color:#f87171;margin-top:0'

    const msg1 = document.createElement('p')
    msg1.textContent = 'You have exited fullscreen mode. This violation has been recorded.'
    msg1.style.cssText = 'font-size:15px;color:#d1d5db;margin-bottom:8px;line-height:1.6'

    const msg2 = document.createElement('p')
    msg2.textContent = 'You must return to fullscreen to continue your exam.'
    msg2.style.cssText = 'font-size:13px;color:#9ca3af;margin-bottom:28px'

    const btn = document.createElement('button')
    btn.id = 'cdc-fs-btn'
    btn.textContent = '\uD83D\uDD32 Return to Fullscreen'
    btn.style.cssText = 'padding:14px 32px;background:#2563eb;color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer'

    overlay.appendChild(icon)
    overlay.appendChild(title)
    overlay.appendChild(msg1)
    overlay.appendChild(msg2)
    overlay.appendChild(btn)
    document.body.appendChild(overlay)

    btn.addEventListener('click', () => {
      document.documentElement.requestFullscreen?.().catch(() => {})
    })

    // Track fullscreen changes
    const onFullscreenChange = () => {
      lastFsChangeTime.current = Date.now()
      if (!document.fullscreenElement) {
        overlay.style.display = 'flex'
        logViolation('fullscreen_exit')
        onViolation('fullscreen_exit')
      } else {
        overlay.style.display = 'none'
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

    // 7. TAB SWITCH
    // Ignore visibilitychange caused by fullscreen exit (already counted separately)
    const onVisibility = () => {
      if (document.hidden) {
        const timeSinceFsChange = Date.now() - lastFsChangeTime.current
        if (timeSinceFsChange < 2000) return
        clearTimeout(visGraceTimer.current)
        visGraceTimer.current = setTimeout(() => {
          logViolation('tab_switch')
          onViolation('tab_switch')
        }, 1000)
      } else {
        clearTimeout(visGraceTimer.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    listenersRef.current.push(['visibilitychange', onVisibility, document])

    // 8. WINDOW BLUR — log + call onViolation (counts in blur bucket)
    const onBlur = () => {
      focusLossCount.current++
      logViolation('window_blur', { count: focusLossCount.current })
      onViolation('window_blur')
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
    document.getElementById('cdc-fs-overlay')?.remove()
    try { if (document.fullscreenElement) document.exitFullscreen?.() } catch {}
  }, [])

  return { start, stop }
}
