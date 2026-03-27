// CDC OAS — Security Index v4.0
// Two separate violation buckets:
//   Tab bucket  — tab switch + fullscreen exit: max 3, 8s countdown auto-submit
//   Blur bucket — window blur/taskbar/popups:   max 10, no countdown

import { useRef, useCallback, useState } from 'react'
import { detectPlatform } from './detectPlatform'
import { useSecurityDesktop } from './useSecurityDesktop'
import { useSecurityAndroid } from './useSecurityAndroid'
import { useSecurityIOS }     from './useSecurityIOS'

const MAX_TAB_VIOLATIONS  = 3   // tab switch + fullscreen exit
const MAX_BLUR_VIOLATIONS = 10  // window blur / taskbar / popups
const PLATFORM            = detectPlatform()

// Which bucket each violation goes into
const TAB_VIOLATIONS = new Set([
  'tab_switch', 'app_switch', 'fullscreen_exit',
  'split_screen', 'split_screen_or_ai', 'screen_mirror_or_split',
  'devtools_open', 'possible_screenshot'
])

const BLUR_VIOLATIONS = new Set([
  'window_blur'
])

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
  const [warningMsg, setWarningMsg]             = useState('')
  const [countdownMsg, setCountdownMsg]         = useState('')
  const [showGuidedAccess, setShowGuidedAccess] = useState(false)

  const tabViolations  = useRef(0)  // tab switch bucket
  const blurViolations = useRef(0)  // window blur bucket
  const warnTimer      = useRef(null)
  const countdownTimer = useRef(null)
  const countdownInterval = useRef(null)

  // expose for resume reset
  const violationCount = useRef(0)

  const showWarn = useCallback((msg) => {
    setWarningMsg(msg)
    clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setWarningMsg(''), 7000)
  }, [])

  // 8-second countdown before auto-submit on tab violations
  const startCountdown = useCallback(() => {
    let secs = 8
    setCountdownMsg(`🚨 Return to exam! Auto-submitting in ${secs}s...`)

    countdownInterval.current = setInterval(() => {
      secs--
      if (secs <= 0) {
        clearInterval(countdownInterval.current)
        setCountdownMsg('')
        autoSubmitRef.current?.('tab_timeout')
      } else {
        setCountdownMsg(`🚨 Return to exam! Auto-submitting in ${secs}s...`)
      }
    }, 1000)

    // Clear countdown if student comes back
    const cancelOnReturn = () => {
      if (!document.hidden && document.fullscreenElement) {
        clearInterval(countdownInterval.current)
        setCountdownMsg('')
        document.removeEventListener('visibilitychange', cancelOnReturn)
        document.removeEventListener('fullscreenchange', cancelOnReturn)
      }
    }
    document.addEventListener('visibilitychange', cancelOnReturn)
    document.addEventListener('fullscreenchange', cancelOnReturn)
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

      if (tabViolations.current >= MAX_TAB_VIOLATIONS) {
        // Final violation — start 8s countdown
        showWarn(`${msg} (${tabViolations.current}/${MAX_TAB_VIOLATIONS}) — Last warning!`)
        startCountdown()
      } else {
        showWarn(`${msg} (${tabViolations.current}/${MAX_TAB_VIOLATIONS})`)
      }
      return
    }

    // ── BLUR BUCKET ──────────────────────────────────────────────────────────
    if (BLUR_VIOLATIONS.has(type)) {
      blurViolations.current++
      if (blurViolations.current >= MAX_BLUR_VIOLATIONS) {
        showWarn('🚨 Too many focus losses! Submitting your exam...')
        setTimeout(() => autoSubmitRef.current?.('blur_limit'), 2500)
      } else if (blurViolations.current >= MAX_BLUR_VIOLATIONS - 3) {
        // Warn when getting close (last 3)
        showWarn(`${msg} (${blurViolations.current}/${MAX_BLUR_VIOLATIONS} focus losses)`)
      }
      // Silent for first few blur violations — don't distract student
      return
    }

    // ── OTHER (non-counted, just warn) ────────────────────────────────────────
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
    clearTimeout(countdownTimer.current)
    clearInterval(countdownInterval.current)
    setCountdownMsg('')
  }, [desktop, android, ios])

  return {
    start,
    stop,
    warningMsg,
    countdownMsg,   // 8s countdown message for StudentExamPage to display
    showGuidedAccess,
    platform: PLATFORM,
    violationCount,
    tabViolations,
    blurViolations,
  }
}
