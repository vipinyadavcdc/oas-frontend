// CDC OAS — Security Index
// Auto-detects platform and returns the right security hook
// Drop-in replacement for old startAntiCheat()

import { useRef, useCallback, useState } from 'react'
import { detectPlatform } from './detectPlatform'
import { useSecurityDesktop } from './useSecurityDesktop'
import { useSecurityAndroid } from './useSecurityAndroid'
import { useSecurityIOS }     from './useSecurityIOS'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const MAX_VIOLATIONS = 3
const PLATFORM = detectPlatform()

// Violation type → human-readable message
const VIOLATION_MESSAGES = {
  tab_switch:            '⚠️ Tab switch detected!',
  app_switch:            '⚠️ App switch detected! Stay in the exam.',
  split_screen:          '⚠️ Split screen detected!',
  split_screen_or_ai:    '⚠️ AI assistant / split screen detected!',
  screen_mirror_or_split:'⚠️ Screen mirroring detected!',
  devtools_open:         '⚠️ Developer tools detected!',
  multiple_monitors:     '⚠️ Multiple monitors detected!',
  idle_detected:         '⚠️ You appear to be idle. Stay active!',
  back_button:           '⚠️ Back button is disabled during exam.',
  back_swipe_ios:        '⚠️ Back swipe is disabled during exam.',
  possible_screenshot:   '⚠️ Screenshot attempt detected!',
  print_attempt:         '⚠️ Printing is not allowed!',
  guided_access_reminder:null, // handled separately — not a violation
}

// Violations that actually count toward auto-submit
const COUNTED_VIOLATIONS = new Set([
  'tab_switch', 'app_switch', 'split_screen', 'split_screen_or_ai',
  'screen_mirror_or_split', 'devtools_open', 'possible_screenshot'
])

export function useSecurity({ sessionToken, onAutoSubmit }) {
  const [warningMsg, setWarningMsg]               = useState('')
  const [showGuidedAccess, setShowGuidedAccess]   = useState(false)
  const violationCount = useRef(0)
  const warnTimer = useRef(null)

  const showWarn = useCallback((msg) => {
    setWarningMsg(msg)
    clearTimeout(warnTimer.current)
    warnTimer.current = setTimeout(() => setWarningMsg(''), 7000)
  }, [])

  const handleViolation = useCallback((type) => {
    // Guided Access reminder for iOS — show banner, not a violation count
    if (type === 'guided_access_reminder') {
      setShowGuidedAccess(true)
      return
    }

    const msg = VIOLATION_MESSAGES[type]
    if (!msg) return

    if (COUNTED_VIOLATIONS.has(type)) {
      violationCount.current++
      const countMsg = `${msg} (${violationCount.current}/${MAX_VIOLATIONS})`
      showWarn(countMsg)

      if (violationCount.current >= MAX_VIOLATIONS) {
        showWarn('🚨 Too many violations! Submitting your exam...')
        setTimeout(() => onAutoSubmit('violation_limit'), 2500)
      }
    } else {
      // Non-counted violations just show warning
      showWarn(msg)
    }
  }, [showWarn, onAutoSubmit])

  // Pick the right platform hook
  const secArgs = { sessionToken, onViolation: handleViolation, onAutoSubmit }
  const desktop = useSecurityDesktop(secArgs)
  const android = useSecurityAndroid(secArgs)
  const ios     = useSecurityIOS(secArgs)

  const getHook = () => {
    if (PLATFORM === 'ios')     return ios
    if (PLATFORM === 'android') return android
    return desktop
  }

  const start = useCallback(() => {
    getHook().start()
  }, [PLATFORM, desktop, android, ios])

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
    violationCount: violationCount.current,
  }
}
