import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, Monitor, Smartphone, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const DEPARTMENTS = [
  'Computer Science & Engineering','Information Technology','Electronics & Communication',
  'Electrical Engineering','Mechanical Engineering','Civil Engineering',
  'MBA','BBA','B.Com','MCA','BCA','Other'
]

function detectDevice() {
  const ua = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) || window.innerWidth < 768
  return isMobile ? 'mobile' : 'desktop'
}

export default function StudentEntryPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [roomCode, setRoomCode] = useState('')
  const [exam, setExam] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [starting, setStarting] = useState(false)
  const [deviceError, setDeviceError] = useState(null)
  const [details, setDetails] = useState({
    name: '', roll_number: '', mobile: '', email: '',
    university: '', department: '', section: ''
  })

  const verifyCode = async (e) => {
    e.preventDefault()
    if (!roomCode.trim()) return toast.error('Enter room code')
    setVerifying(true)
    try {
      const res = await api.post('/exam/verify', { room_code: roomCode.trim() })
      const examData = res.data.exam

      // Device check
      const deviceAllowed = examData.device_allowed || 'both'
      const currentDevice = detectDevice()
      if (deviceAllowed !== 'both') {
        if (deviceAllowed === 'desktop' && currentDevice === 'mobile') {
          setDeviceError({ allowed: 'desktop', current: 'mobile', title: examData.title })
          setVerifying(false)
          return
        }
        if (deviceAllowed === 'mobile' && currentDevice === 'desktop') {
          setDeviceError({ allowed: 'mobile', current: 'desktop', title: examData.title })
          setVerifying(false)
          return
        }
      }

      setExam(examData)
      setDetails(d => ({ ...d, university: examData.university !== 'BOTH' ? examData.university : '' }))
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid room code')
    } finally { setVerifying(false) }
  }

  const startExam = async (e) => {
    e.preventDefault()
    for (const [k, v] of Object.entries(details)) {
      if (!v.trim()) return toast.error('Please fill: ' + k.replace('_', ' '))
    }
    setStarting(true)
    try {
      let geo = null
      try {
        await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
            pos => { geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }; res() },
            () => res(), { timeout: 5000 }
          )
        })
      } catch {}

      const res = await api.post('/exam/start', {
        exam_id: exam.id, room_code: roomCode.trim(), ...details, geolocation: geo
      })
      sessionStorage.setItem('cdc_session', JSON.stringify({
        session: res.data.session,
        exam: res.data.exam,
        questions: res.data.questions
      }))
      navigate('/exam/start')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start exam')
    } finally { setStarting(false) }
  }

  // Device not supported screen
  if (deviceError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-md text-center">
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {deviceError.current === 'mobile' ? '📱' : '🖥️'}
          </div>
          <div style={{
            background: 'var(--color-danger)15', border: '2px solid var(--color-danger)',
            borderRadius: 16, padding: 32, marginBottom: 20
          }}>
            <AlertTriangle size={32} style={{ color: 'var(--color-danger)', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>
              Device Not Supported
            </h2>
            <p style={{ color: 'var(--color-text)', marginBottom: 8 }}>
              <strong>{deviceError.title}</strong>
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              This exam is only accessible on <strong>{deviceError.allowed === 'desktop' ? 'Desktop / Laptop' : 'Mobile devices'}</strong>.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 8 }}>
              You are currently on a <strong>{deviceError.current === 'mobile' ? 'Mobile device' : 'Desktop / Laptop'}</strong>.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 12 }}>
              Please switch to the correct device and try again.
            </p>
          </div>
          <button onClick={() => setDeviceError(null)} className="btn-secondary">
            Try Different Code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg"
            style={{ background: 'var(--color-primary)' }}>CDC</div>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Online Exam</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Career Development Centre — MREI</p>
        </div>

        {step === 1 && (
          <div className="card shadow-xl fade-in">
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>Enter Room Code</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Your trainer will share the 6-digit room code before the exam starts.
            </p>
            <form onSubmit={verifyCode} className="space-y-4">
              <input className="input text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="XXXXXX" maxLength={8} value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())} autoFocus />
              <button type="submit" disabled={verifying} className="btn-primary w-full justify-center py-3">
                {verifying ? <div className="spinner w-4 h-4" /> : <ArrowRight size={18} />}
                {verifying ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && exam && (
          <div className="fade-in space-y-4">
            <div className="card" style={{ borderColor: 'var(--color-primary)', borderWidth: '2px' }}>
              <div className="flex items-start gap-3">
                <BookOpen size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>{exam.title}</h2>
                  <div className="flex gap-3 mt-1 text-sm flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                    <span>⏱️ {exam.duration_minutes} mins</span>
                    <span>📝 {exam.total_questions} questions</span>
                    <span className="badge badge-info">{exam.exam_type}</span>
                  </div>
                  {/* Section time breakdown */}
                  {(exam.aptitude_time_minutes > 0 || exam.verbal_time_minutes > 0) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {exam.aptitude_time_minutes > 0 && (
                        <span style={{ fontSize: 12, background: 'var(--color-primary)20', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 6 }}>
                          🧮 Aptitude: {exam.aptitude_time_minutes} min
                        </span>
                      )}
                      {exam.verbal_time_minutes > 0 && (
                        <span style={{ fontSize: 12, background: 'var(--color-warning)20', color: 'var(--color-warning)', padding: '2px 8px', borderRadius: 6 }}>
                          📝 Verbal: {exam.verbal_time_minutes} min
                        </span>
                      )}
                    </div>
                  )}
                  {/* Device indicator */}
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {exam.device_allowed === 'desktop' ? <Monitor size={12} /> : exam.device_allowed === 'mobile' ? <Smartphone size={12} /> : null}
                    {exam.device_allowed === 'both' ? 'All devices allowed' : exam.device_allowed === 'desktop' ? 'Desktop only' : 'Mobile only'}
                  </div>
                  {exam.description && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{exam.description}</p>}
                </div>
              </div>
            </div>

            <div className="card shadow-xl">
              <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Your Details</h3>
              <form onSubmit={startExam} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Full Name *</label>
                    <input className="input" placeholder="Enter your full name" value={details.name}
                      onChange={e => setDetails({...details, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Roll Number *</label>
                    <input className="input" placeholder="e.g. 02114802821" value={details.roll_number}
                      onChange={e => setDetails({...details, roll_number: e.target.value.toUpperCase()})} required />
                  </div>
                  <div>
                    <label className="label">Mobile Number *</label>
                    <input className="input" type="tel" placeholder="10-digit mobile" value={details.mobile}
                      onChange={e => setDetails({...details, mobile: e.target.value})} required maxLength={10} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email Address *</label>
                    <input className="input" type="email" placeholder="your@email.com" value={details.email}
                      onChange={e => setDetails({...details, email: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">University *</label>
                    <select className="input" value={details.university}
                      onChange={e => setDetails({...details, university: e.target.value})} required>
                      <option value="">Select</option>
                      <option value="MRIIRS">MRIIRS</option>
                      <option value="MRU">MRU</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Section *</label>
                    <input className="input" placeholder="e.g. A, B, C1" value={details.section}
                      onChange={e => setDetails({...details, section: e.target.value.toUpperCase()})} required />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Department *</label>
                    <select className="input" value={details.department}
                      onChange={e => setDetails({...details, department: e.target.value})} required>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--color-surface2)' }}>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>⚠️ Important Instructions:</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• Do NOT switch tabs or windows — 3 violations = auto-submit</p>
                  {(exam.aptitude_time_minutes > 0 || exam.verbal_time_minutes > 0) && (
                    <p style={{ color: 'var(--color-text-muted)' }}>• Each section has its own timer — unused time is NOT carried over</p>
                  )}
                  {(exam.aptitude_time_minutes > 0 || exam.verbal_time_minutes > 0) && (
                    <p style={{ color: 'var(--color-text-muted)' }}>• Once a section is submitted, you CANNOT go back</p>
                  )}
                  <p style={{ color: 'var(--color-text-muted)' }}>• Answers auto-save every 30 seconds</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• You cannot attempt this exam twice</p>
                </div>

                <button type="submit" disabled={starting} className="btn-primary w-full justify-center py-3">
                  {starting ? <div className="spinner w-4 h-4" /> : <BookOpen size={18} />}
                  {starting ? 'Starting...' : 'Start Exam'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
