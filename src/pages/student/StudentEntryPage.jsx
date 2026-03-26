// CDC OAS — StudentEntryPage v3.0
// Added: device fingerprint collection before exam start

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, MapPin } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { getDeviceFingerprint } from '../../security/deviceFingerprint'

const DEPARTMENTS = [
  'Computer Science & Engineering', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'MBA', 'BBA', 'B.Com', 'MCA', 'BCA', 'Other'
]

export default function StudentEntryPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(1)
  const [roomCode, setRoomCode]   = useState('')
  const [exam, setExam]           = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [starting, setStarting]   = useState(false)
  const [details, setDetails]     = useState({
    name: '', roll_number: '', mobile: '', email: '',
    university: '', department: '', section: ''
  })

  const verifyCode = async (e) => {
    e.preventDefault()
    if (!roomCode.trim()) return toast.error('Enter room code')
    setVerifying(true)
    try {
      const res = await api.post('/exam/verify', { room_code: roomCode.trim() })
      setExam(res.data.exam)
      setDetails(d => ({ ...d, university: res.data.exam.university !== 'BOTH' ? res.data.exam.university : '' }))
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid room code')
    } finally { setVerifying(false) }
  }

  const startExam = async (e) => {
    e.preventDefault()
    for (const [k, v] of Object.entries(details)) {
      if (!v.trim()) return toast.error(`Please fill: ${k.replace('_', ' ')}`)
    }
    setStarting(true)
    try {
      // Collect geolocation
      let geo = null
      try {
        await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
            pos => { geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }; res() },
            () => res(),
            { timeout: 5000 }
          )
        })
      } catch {}

      // Collect device fingerprint (runs in background, non-blocking)
      let fingerprint = null
      try {
        fingerprint = await getDeviceFingerprint()
      } catch {}

      const res = await api.post('/exam/start', {
        exam_id: exam.id,
        room_code: roomCode.trim(),
        ...details,
        geolocation: geo,
        device_fingerprint: fingerprint
      })

      sessionStorage.setItem('cdc_session', JSON.stringify({
        session:   res.data.session,
        exam:      res.data.exam,
        questions: res.data.questions
      }))
      navigate('/exam/start')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start exam')
    } finally { setStarting(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg"
               style={{ background: 'var(--color-primary)' }}>
            CDC
          </div>
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
              <input
                className="input text-center text-2xl font-mono tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={8}
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                autoFocus
              />
              <button type="submit" disabled={verifying} className="btn-primary w-full justify-center py-3">
                {verifying ? <div className="spinner w-4 h-4" /> : <ArrowRight size={18} />}
                {verifying ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && exam && (
          <div className="fade-in space-y-4">
            {/* Exam info */}
            <div className="card" style={{ borderColor: 'var(--color-primary)', borderWidth: '2px' }}>
              <div className="flex items-start gap-3">
                <BookOpen size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>{exam.title}</h2>
                  <div className="flex gap-3 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span>⏱️ {exam.duration_minutes} mins</span>
                    <span>📝 {exam.total_questions} questions</span>
                    <span className="badge badge-info">{exam.exam_type}</span>
                  </div>
                  {exam.description && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{exam.description}</p>}
                </div>
              </div>
            </div>

            {/* Student details */}
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

                {/* Instructions */}
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--color-surface2)' }}>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>⚠️ Important Instructions:</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• Do NOT switch tabs or apps — 3 violations = auto-submit</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• Exam runs in fullscreen / locked mode</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• All violations are recorded and shown to trainer</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• Answers auto-save every 30 seconds</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• You cannot attempt this exam twice</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>• This device is fingerprinted for security</p>
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
