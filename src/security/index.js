// CDC OAS — Security Index v4.1
// Fix: autoSubmitRef always checked safely
// Fix: countdown cancel doesn't require fullscreen
// Two buckets: tab (max 3, 8s countdown) | blur (max 10, silent first 7)

import { useRef, useCallback, useState, useEffect } from 'react'
import { detectPlatform } from './detectPlatform'
import { useSecurityDesktop } from './useSecurityDesktop'
import { useSecurityAndroid } from './useSecurityAndroid'
import { useSecurityIOS }     from './useSecurityIOS'

const MAX_TAB_VIOLATIONS  = 3
const MAX_BLUR_VIOLATIONS = 10
const PLATFORM            = detectPlatform()
const COUNTDOWN_SECONDS   = 8

const TAB_VIOLATIONS = new Set([
  'tab_switch', 'app_switch', 'fullscreen_exit',
  'split_screen', 'split_screen_or_ai', 'screen_mirror_or_split',
  'devtools_open', 'possible_screenshot'
])

const BLUR_VIOLATIONS = new Set(['window_blur'])

const VIOLATION_MESSAGES = {
  tab_switch:             '⚠️ Tab switch detected!',
  app_switch:             '⚠️ App switch detected!',
  fullscreen_exit:        '⚠️ Fullscreen exit detected!',
  split_screen:           '⚠️ Split screen detected!',
  split_screen_or_ai:     '⚠️ AI assistant / split screen detected!',
  screen_mirror_or_split: '⚠️ Screen mirroring detected!',
  devtools_open:          '⚠️ Developer tools detected!',
  multiple_monitors:      '⚠️ Multiple monitors detected!',
  possible_screenshot:    '⚠️ Screenshot attempt detected!',
  print_attempt:          '⚠️ Printing is not allowed!',
  window_blur:            '⚠️ Focus lost!',
  idle_detected:          '⚠️ You appear idle. Stay active!',
  back_button:            '⚠️ Back button disabled during exam.',
  back_swipe_ios:         '⚠️ Back swipe disabled during exam.',
  guided_access_reminder: null,
}

export function useSecurity({ tokenRef, autoSubmitRef }) {
  const [warningMsg,     setWarningMsg]     = useState('')
  const [countdownMsg,   setCountdownMsg]   = useState('')
  const [showGuidedAccess, setShowGuidedAccess] = useState(false)

  const tabViolations      = useRef(0)
  const blurViolations     = useRef(0)
  const violationCount     = useRef(0)
  const warnTimer          = useRef(null)
  const countdownInterval  = useRef(null)
  const countdownActive    = useRef(false)
  const studentIsAway      = useRef(false)

  const showWarn = useCallback((msg) => {
    setWarningMsg(msg)
    clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setWarningMsg(''), 8000)
  }, [])

  // Cancel countdown when student comes back
  const cancelCountdown = useCallback(() => {
    if (!countdownActive.current) return
    countdownActive.current = false
    studentIsAway.current   = false
    clearInterval(countdownInterval.current)
    setCountdownMsg('')
  }, [])

  // Listen for student returning — visibilitychange or click
  useEffect(() => {
    const onReturn = () => {
      if (!document.hidden) cancelCountdown()
    }
    const onClick = () => cancelCountdown()

    document.addEventListener('visibilitychange', onReturn)
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onClick)
    return () => {
      document.removeEventListener('visibilitychange', onReturn)
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onClick)
    }
  }, [cancelCountdown])

  const startCountdown = useCallback(() => {
    if (countdownActive.current) return // already counting
    countdownActive.current = true
    studentIsAway.current   = true

    let secs = COUNTDOWN_SECONDS
    setCountdownMsg(`🚨 Return to exam! Auto-submitting in ${secs}s...`)

    countdownInterval.current = setInterval(() => {
      // If student came back — stop countdown
      if (!studentIsAway.current) {
        clearInterval(countdownInterval.current)
        countdownActive.current = false
        setCountdownMsg('')
        return
      }
      secs--
      if (secs <= 0) {
        clearInterval(countdownInterval.current)
        countdownActive.current = false
        setCountdownMsg('')
        // Fire auto-submit — check ref is set
        if (autoSubmitRef.current) {
          autoSubmitRef.current('tab_timeout')
        }
      } else {
        setCountdownMsg(`🚨 Return to exam! Auto-submitting in ${secs}s...`)
      }
    }, 1000)
  }, [autoSubmitRef])

  const handleViolation = useCallback((type) => {
    if (type === 'guided_access_reminder') {
      setShowGuidedAccess(true)
      return
    }

    const msg = VIOLATION_MESSAGES[type]
    if (!msg) return

    // ── TAB BUCKET ──────────────────────────────────────────────────────────
    if (TAB_VIOLATIONS.has(type)) {
      tabViolations.current++
      violationCount.current = tabViolations.current
      studentIsAway.current  = true // mark student as away

      if (tabViolations.current >= MAX_TAB_VIOLATIONS) {
        showWarn(`${msg} (${tabViolations.current}/${MAX_TAB_VIOLATIONS}) — FINAL WARNING!`)
        startCountdown()
      } else {
        showWarn(`${msg} (${tabViolations.current}/${MAX_TAB_VIOLATIONS})`)
        // Start countdown on every tab violation — cancel if they come back
        startCountdown()
      }
      return
    }

    // ── BLUR BUCKET ──────────────────────────────────────────────────────────
    if (BLUR_VIOLATIONS.has(type)) {
      blurViolations.current++
      if (blurViolations.current >= MAX_BLUR_VIOLATIONS) {
        showWarn('🚨 Too many focus losses! Submitting your exam...')
        setTimeout(() => {
          if (autoSubmitRef.current) autoSubmitRef.current('blur_limit')
        }, 2500)
      } else if (blurViolations.current >= MAX_BLUR_VIOLATIONS - 2) {
        showWarn(`⚠️ Focus lost (${blurViolations.current}/${MAX_BLUR_VIOLATIONS}) — Stay on exam window!`)
      }
      // Silent for first 7 blur violations
      return
    }

    // ── OTHER ────────────────────────────────────────────────────────────────
    showWarn(msg)
  }, [showWarn, startCountdown, autoSubmitRef])

  const args    = { tokenRef, onViolation: handleViolation }
  const desktop = useSecurityDesktop(args)
  const android = useSecurityAndroid(args)
  const ios     = useSecurityIOS(args)

  const start = useCallback(() => {
    if (PLATFORM === 'ios')     { ios.start();     return }
    if (PLATFORM === 'android') { android.start(); return }
    desktop.start()
  }, [desktop, android, ios])

  const stop = useCallback(() => {
    desktop.stop()
    android.stop()
    ios.stop()
    clearTimeout(warnTimer.current)
    clearInterval(countdownInterval.current)
    countdownActive.current = false
    setCountdownMsg('')
  }, [desktop, android, ios])

  return {
    start,
    stop,
    warningMsg,
    countdownMsg,
    showGuidedAccess,
    platform: PLATFORM,
    violationCount,
    tabViolations,
    blurViolations,
    cancelCountdown,
  }
}
