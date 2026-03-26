// CDC OAS — Security Index
import { useRef, useCallback, useState } from 'react'
import { detectPlatform } from './detectPlatform'
import { useSecurityDesktop } from './useSecurityDesktop'
import { useSecurityAndroid } from './useSecurityAndroid'
import { useSecurityIOS }     from './useSecurityIOS'
import toast from 'react-hot-toast'

const MAX_VIOLATIONS = 3
const PLATFORM = detectPlatform()

const VIOLATION_MESSAGES = {
  tab_switch:            '⚠️ Tab switch detected!',
  app_switch:            '⚠️ App switch detected! Stay in the exam.',
  split_screen:          '⚠️ Split screen detected!',
  split_screen_or_ai:    '⚠️ AI assistant / split screen detected!',
  screen_mirror_or_split:'⚠️ Screen mirroring detected!',
  devtools_open:         '⚠️ Developer tools detected!',
  multiple_monitors:     '⚠️ Multiple monitors detected!',
  idle_detected:         '⚠️ You appear idle. Stay active!',
  back_button:           '⚠️ Back button disabled during exam.',
  back_swipe_ios:        '⚠️ Back swipe disabled during exam.',
  possible_screenshot:   '⚠️ Screenshot attempt detected!',
  print_attempt:         '⚠️ Printing is not allowed!',
  guided_access_reminder: null,
}

const COUNTED_VIOLATIONS = new Set([
  'tab_switch', 'app_switch', 'split_screen', 'split_screen_or_ai',
  'screen_mirror_or_split', 'devtools_open', 'possible_screenshot'
])

export function useSecurity({ sessionToken, onAutoSubmit }) {
  const [warningMsg, setWarningMsg]             = useState('')
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

  const secArgs = { sessionToken, onViolation: handleViolation, onAutoSubmit }
  const desktop = useSecurityDesktop(secArgs)
  const android = useSecurityAndroid(secArgs)
  const ios     = useSecurityIOS(secArgs)

  const start = useCallback(() => {
    if (PLATFORM === 'ios')     return ios.start()
    if (PLATFORM === 'android') return android.start()
    return desktop.start()
  }, [PLATFORM, desktop, android, ios])

  const stop = useCallback(() => {
    desktop.stop()
    android.stop()
    ios.stop()
    clearTimeout(warnTimer.current)
  }, [desktop, android, ios])

  return { start, stop, warningMsg, showGuidedAccess, platform: PLATFORM }
}
