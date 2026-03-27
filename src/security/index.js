// CDC OAS — Security Index v3.1
// Key fix: accepts tokenRef (a ref object) instead of a plain string
// This means all hooks ALWAYS read the latest token even after async init

import { useRef, useCallback, useState } from 'react'
import { detectPlatform } from './detectPlatform'
import { useSecurityDesktop } from './useSecurityDesktop'
import { useSecurityAndroid } from './useSecurityAndroid'
import { useSecurityIOS }     from './useSecurityIOS'

const MAX_VIOLATIONS = 3
const PLATFORM       = detectPlatform()

const VIOLATION_MESSAGES = {
  tab_switch:             '⚠️ Tab switch detected!',
  app_switch:             '⚠️ App switch detected! Stay in exam.',
  split_screen:           '⚠️ Split screen detected!',
  split_screen_or_ai:     '⚠️ AI assistant / split screen detected!',
  screen_mirror_or_split: '⚠️ Screen mirroring detected!',
  devtools_open:          '⚠️ Developer tools detected!',
  multiple_monitors:      '⚠️ Multiple monitors detected!',
  idle_detected:          '⚠️ You appear idle. Stay active!',
  back_button:            '⚠️ Back button disabled during exam.',
  back_swipe_ios:         '⚠️ Back swipe disabled during exam.',
  possible_screenshot:    '⚠️ Screenshot attempt detected!',
  print_attempt:          '⚠️ Printing is not allowed!',
  fullscreen_exit:        '⚠️ Please stay in fullscreen mode!',
  guided_access_reminder: null, // shown as a banner, not a violation
}

// Only these count toward the auto-submit limit
const COUNTED_VIOLATIONS = new Set([
  'tab_switch', 'app_switch', 'split_screen', 'split_screen_or_ai',
  'screen_mirror_or_split', 'devtools_open', 'possible_screenshot'
])

export function useSecurity({ tokenRef, onAutoSubmit }) {
  const [warningMsg, setWarningMsg]           = useState('')
  const [showGuidedAccess, setShowGuidedAccess] = useState(false)
  const violationCount = useRef(0)
  const warnTimer      = useRef(null)

  const showWarn = useCallback((msg) => {
    setWarningMsg(msg)
    clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setWarningMsg(''), 7000)
  }, [])

  const handleViolation = useCallback((type) => {
    if (type === 'guided_access_reminder') {
      setShowGuidedAccess(true)
      return
    }
    const msg = VIOLATION_MESSAGES[type]
    if (!msg) return
    if (COUNTED_VIOLATIONS.has(type)) {
      violationCount.current++
      showWarn(`${msg} (${violationCount.current}/${MAX_VIOLATIONS})`)
      if (violationCount.current >= MAX_VIOLATIONS) {
        showWarn('🚨 Too many violations! Submitting your exam...')
        setTimeout(() => onAutoSubmit('violation_limit'), 2500)
      }
    } else {
      showWarn(msg)
    }
  }, [showWarn, onAutoSubmit])

  // Pass tokenRef (not token value) to each hook
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
  }, [desktop, android, ios])

  return {
    start,
    stop,
    warningMsg,
    showGuidedAccess,
    platform: PLATFORM,
  }
}
