// CDC OAS — Platform Detector
// Returns: 'ios' | 'android' | 'desktop'

export function detectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

export const IS_IOS     = detectPlatform() === 'ios'
export const IS_ANDROID = detectPlatform() === 'android'
export const IS_DESKTOP = detectPlatform() === 'desktop'
export const IS_MOBILE  = IS_IOS || IS_ANDROID
