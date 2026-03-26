// CDC OAS — Device Fingerprint
// Generates a stable device ID from browser/hardware characteristics
// Used to detect proxy candidates (same device, different student)

export async function getDeviceFingerprint() {
  const components = []

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Language
  components.push(navigator.language || '')

  // Platform
  components.push(navigator.platform || '')

  // Hardware concurrency (CPU cores)
  components.push(navigator.hardwareConcurrency || 0)

  // Device memory
  components.push(navigator.deviceMemory || 0)

  // Touch support
  components.push(navigator.maxTouchPoints || 0)

  // Canvas fingerprint (most stable)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 200; canvas.height = 50
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('CDC-OAS-2025', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('CDC-OAS-2025', 4, 17)
    components.push(canvas.toDataURL().slice(-50))
  } catch {}

  // Audio fingerprint
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const analyser = ctx.createAnalyser()
    const gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(analyser)
    analyser.connect(gain)
    gain.connect(ctx.destination)
    osc.start(0)
    const data = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(data)
    components.push(data.slice(0, 10).join(','))
    osc.stop()
    ctx.close()
  } catch {}

  // Hash all components
  const raw = components.join('|')
  const fingerprint = await hashString(raw)
  return fingerprint
}

async function hashString(str) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
  } catch {
    // Fallback simple hash
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
}
