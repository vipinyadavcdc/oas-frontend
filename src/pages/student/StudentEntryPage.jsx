// CDC OAS — StudentEntryPage v5.0
// Two clear options: Start Exam / Resume Exam
// Normal flow: room code → details → participant ID screen → exam
// Resume flow: master code (5-digit) → roll number → participant ID → exam
// After 15 min on same normal room code → error → must use master code

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, RefreshCw, KeyRound, ClipboardCheck } from 'lucide-react'
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

  // mode: 'choose' | 'start' | 'resume'
  const [mode, setMode]             = useState('choose')

  // Normal start flow steps: 1=roomcode, 2=details, 3=participantID
  const [startStep, setStartStep]   = useState(1)

  // Resume flow steps: 1=mastercode, 2=rollno+participantID
  const [resumeStep, setResumeStep] = useState(1)

  const [roomCode, setRoomCode]     = useState('')
  const [masterCode, setMasterCode] = useState('')
  const [exam, setExam]             = useState(null)
  const [verifying, setVerifying]   = useState(false)
  const [starting, setStarting]     = useState(false)
  const [participantId, setParticipantId] = useState('')

  // Resume inputs
  const [resumeRoll, setResumeRoll]         = useState('')
  const [resumePartId, setResumePartId]     = useState('')

  const [details, setDetails] = useState({
    name: '', roll_number: '', mobile: '', email: '',
    university: '', department: '', section: ''
  })

  // ── Verify normal room code ─────────────────────────────────────────────────
  const verifyRoomCode = async (e) => {
    e.preventDefault()
    if (!roomCode.trim()) return toast.error('Enter room code')
    setVerifying(true)
    try {
      const res = await api.post('/exam/verify', { room_code: roomCode.trim() })

      // If they accidentally entered master code in start flow — redirect
      if (res.data.is_master_code) {
        toast.error('That is a Master Code. Please use "Resume Exam" instead.')
        setVerifying(false)
        return
      }

      setExam(res.data.exam)
      setDetails(d => ({ ...d, university: res.data.exam.university !== 'BOTH' ? res.data.exam.university : '' }))
      setStartStep(2)
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid room code'
      // If backend says needs_master_code
      if (err.response?.data?.needs_master_code) {
        toast.error('Session active. Use "Resume Exam" with Master Code from CDC team member.')
      } else {
        toast.error(msg)
      }
    } finally { setVerifying(false) }
  }

  // ── Start exam (submit details form) ───────────────────────────────────────
  const startExam = async (e) => {
    e.preventDefault()
    for (const [k, v] of Object.entries(details)) {
      if (!v.trim()) return toast.error(`Please fill: ${k.replace(/_/g, ' ')}`)
    }
    setStarting(true)
    try {
      let geo = null
      try {
        await new Promise(res => {
          navigator.geolocation.getCurrentPosition(
            pos => { geo = { lat: pos.coords.latitude, lng: pos.coords.longitude }; res() },
            () => res(), { timeout: 5000 }
          )
        })
      } catch {}

      let fingerprint = null
      try { fingerprint = await getDeviceFingerprint() } catch {}

      const res = await api.post('/exam/start', {
        exam_id: exam.id, room_code: roomCode.trim(),
        ...details, geolocation: geo, device_fingerprint: fingerprint
      })

      // Store session
      sessionStorage.setItem('cdc_session', JSON.stringify({
        session:   res.data.session,
        exam:      res.data.exam,
        questions: res.data.questions
      }))

      // Show participant ID screen
      setParticipantId(res.data.session.participant_id)
      setStartStep(3)

    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to start exam'
      if (err.response?.data?.needs_master_code) {
        toast.error('Session already active. Use "Resume Exam" with Master Code from CDC team member.')
        setMode('choose')
      } else {
        toast.error(errMsg)
      }
    } finally { setStarting(false) }
  }

  // ── Confirm participant ID written — enter exam ─────────────────────────────
  const confirmAndEnterExam = () => {
    navigate('/exam/start')
  }

  // ── Verify master code ──────────────────────────────────────────────────────
  const verifyMasterCode = async (e) => {
    e.preventDefault()
    if (!masterCode.trim()) return toast.error('Enter master code')
    setVerifying(true)
    try {
      const res = await api.post('/exam/verify', { room_code: masterCode.trim() })
      if (!res.data.is_master_code) {
        toast.error('That is a normal room code. Enter your Master Code (5-digit number).')
        setVerifying(false)
        return
      }
      setExam(res.data.exam)
      setResumeStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid master code')
    } finally { setVerifying(false) }
  }

  // ── Resume exam ─────────────────────────────────────────────────────────────
  const resumeExam = async (e) => {
    e.preventDefault()
    if (!resumeRoll.trim())   return toast.error('Enter your roll number')
    if (!resumePartId.trim()) return toast.error('Enter your Participant ID')
    if (resumePartId.trim().length !== 10) return toast.error('Participant ID must be 10 digits')
    setStarting(true)
    try {
      let geo = null
      try {
        await new Promise(res => {
          navigator.geolocation.getCurrentPosition(
            pos => { geo = { lat: pos.coords.latitude, lng: pos.coords.longitude }; res() },
            () => res(), { timeout: 3000 }
          )
        })
      } catch {}
      let fingerprint = null
      try { fingerprint = await getDeviceFingerprint() } catch {}

      const res = await api.post('/exam/start', {
        exam_id:             exam.id,
        room_code:           masterCode.trim(),
        is_master_code:      true,
        participant_id_input: resumePartId.trim(),
        name:                resumeRoll.trim(),
        roll_number:         resumeRoll.trim(),
        mobile:              '0000000000',
        email:               'resume@cdc.in',
        university:          exam.university !== 'BOTH' ? exam.university : 'MRIIRS',
        department:          'Resume',
        section:             'R',
        geolocation:         geo,
        device_fingerprint:  fingerprint
      })

      sessionStorage.setItem('cdc_session', JSON.stringify({
        session:   res.data.session,
        exam:      res.data.exam,
        questions: res.data.questions,
        violation_reset_to: res.data.violation_reset_to || 1
      }))

      toast.success('Welcome back! Resuming your exam.')
      navigate('/exam/start')

    } catch (err) {
      toast.error(err.response?.data?.error || 'Resume failed. Check your Participant ID.')
    } finally { setStarting(false) }
  }

  // Format participant ID for display: 4724-3810-65
  const formatPartId = (id) => id
    ? `${id.slice(0,4)}-${id.slice(4,8)}-${id.slice(8,10)}`
    : ''

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg"
               style={{ background: 'var(--color-primary)' }}>CDC</div>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Online Exam</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Career Development Centre — MREI</p>
        </div>

        {/* ── CHOOSE MODE ── */}
        {mode === 'choose' && (
          <div className="card shadow-xl fade-in" style={{ display:'grid', gap:16 }}>
            <h2 className="text-lg font-bold" style={{ color:'var(--color-text)' }}>How would you like to proceed?</h2>

            <button onClick={() => setMode('start')}
              style={{ padding:'20px 24px', background:'var(--color-surface)', border:'2px solid var(--color-primary)', borderRadius:12, cursor:'pointer', textAlign:'left', width:'100%', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'var(--color-primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <BookOpen size={22} color="white" />
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--color-text)' }}>Start Exam</div>
                <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:2 }}>Enter room code and begin your exam</div>
              </div>
            </button>

            <button onClick={() => setMode('resume')}
              style={{ padding:'20px 24px', background:'var(--color-surface)', border:'2px solid var(--color-warning)', borderRadius:12, cursor:'pointer', textAlign:'left', width:'100%', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'var(--color-warning)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <RefreshCw size={22} color="white" />
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--color-text)' }}>Resume Exam</div>
                <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:2 }}>Continue an interrupted exam with Master Code</div>
              </div>
            </button>
          </div>
        )}

        {/* ── START FLOW — Step 1: Room Code ── */}
        {mode === 'start' && startStep === 1 && (
          <div className="card shadow-xl fade-in">
            <button onClick={() => setMode('choose')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', gap:4 }}>
              ← Back
            </button>
            <h2 className="text-lg font-bold mb-2" style={{ color:'var(--color-text)' }}>Enter Room Code</h2>
            <p className="text-sm mb-6" style={{ color:'var(--color-text-muted)' }}>
              Your trainer will share the room code before the exam starts.
            </p>
            <form onSubmit={verifyRoomCode} className="space-y-4">
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

        {/* ── START FLOW — Step 2: Details ── */}
        {mode === 'start' && startStep === 2 && exam && (
          <div className="fade-in space-y-4">
            <div className="card" style={{ borderColor:'var(--color-primary)', borderWidth:'2px' }}>
              <div className="flex items-start gap-3">
                <BookOpen size={22} style={{ color:'var(--color-primary)', flexShrink:0 }} />
                <div>
                  <h2 className="font-bold" style={{ color:'var(--color-text)' }}>{exam.title}</h2>
                  <div className="flex gap-3 mt-1 text-sm" style={{ color:'var(--color-text-muted)' }}>
                    <span>⏱️ {exam.duration_minutes} min</span>
                    <span>📝 {exam.total_questions} questions</span>
                    <span className="badge badge-info">{exam.exam_type}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-xl">
              <h3 className="font-bold mb-4" style={{ color:'var(--color-text)' }}>Your Details</h3>
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
                    <label className="label">Mobile *</label>
                    <input className="input" type="tel" placeholder="10-digit" value={details.mobile}
                      onChange={e => setDetails({...details, mobile: e.target.value})} required maxLength={10} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email *</label>
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

                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background:'var(--color-surface2)' }}>
                  <p className="font-semibold" style={{ color:'var(--color-text)' }}>⚠️ Important:</p>
                  <p style={{ color:'var(--color-text-muted)' }}>• A unique 10-digit Participant ID will be shown — write it on paper immediately</p>
                  <p style={{ color:'var(--color-text-muted)' }}>• You will need this ID if your exam is interrupted for any reason</p>
                  <p style={{ color:'var(--color-text-muted)' }}>• Do NOT switch tabs or apps during exam — violations are recorded</p>
                  <p style={{ color:'var(--color-text-muted)' }}>• Answers auto-save every 30 seconds</p>
                </div>

                <button type="submit" disabled={starting} className="btn-primary w-full justify-center py-3">
                  {starting ? <div className="spinner w-4 h-4" /> : <BookOpen size={18} />}
                  {starting ? 'Starting...' : 'Start Exam'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── START FLOW — Step 3: Participant ID Screen ── */}
        {mode === 'start' && startStep === 3 && participantId && (
          <div className="fade-in">
            <div className="card shadow-xl" style={{ border:'3px solid var(--color-warning)' }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:8 }}>🎫</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:'var(--color-text)', marginBottom:4 }}>
                  Your Participant ID
                </h2>
                <p style={{ fontSize:13, color:'var(--color-text-muted)' }}>Unique to you for this exam</p>
              </div>

              {/* Big ID display */}
              <div style={{ background:'var(--color-surface2)', border:'2px dashed var(--color-warning)', borderRadius:14, padding:'20px 16px', textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:34, fontWeight:900, letterSpacing:6, color:'var(--color-warning)', fontFamily:'monospace', marginBottom:6 }}>
                  {formatPartId(participantId)}
                </div>
                <div style={{ fontSize:11, color:'var(--color-text-muted)' }}>
                  Participant ID: {participantId}
                </div>
              </div>

              {/* Write it down warning */}
              <div style={{ background:'var(--color-danger)15', border:'1px solid var(--color-danger)', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
                <p style={{ fontWeight:700, color:'var(--color-danger)', fontSize:14, marginBottom:6 }}>
                  ✍️ WRITE THIS ON YOUR PAPER RIGHT NOW
                </p>
                <p style={{ fontSize:12, color:'var(--color-text)', lineHeight:1.8 }}>
                  • Write your name, roll number and this Participant ID<br/>
                  • If your exam is interrupted, tell your CDC team member<br/>
                  • They will give you a Master Code to resume<br/>
                  • You will need this ID to resume your exam<br/>
                  • This ID also appears in your result sheet
                </p>
              </div>

              <button onClick={confirmAndEnterExam}
                className="btn-primary w-full justify-center py-4"
                style={{ fontSize:15, fontWeight:700, background:'var(--color-success)' }}>
                <ClipboardCheck size={20} />
                I have written it down — Start Exam →
              </button>

              <p style={{ textAlign:'center', fontSize:11, color:'var(--color-text-muted)', marginTop:10 }}>
                You must confirm before the exam begins
              </p>
            </div>
          </div>
        )}

        {/* ── RESUME FLOW — Step 1: Master Code ── */}
        {mode === 'resume' && resumeStep === 1 && (
          <div className="card shadow-xl fade-in">
            <button onClick={() => setMode('choose')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', fontSize:13, marginBottom:12, display:'flex', alignItems:'center', gap:4 }}>
              ← Back
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <KeyRound size={20} style={{ color:'var(--color-warning)' }} />
              <h2 className="text-lg font-bold" style={{ color:'var(--color-text)' }}>Enter Master Code</h2>
            </div>
            <p className="text-sm mb-6" style={{ color:'var(--color-text-muted)' }}>
              Ask your CDC team member for the 5-digit Master Code for your exam.
            </p>
            <form onSubmit={verifyMasterCode} className="space-y-4">
              <input
                className="input text-center text-3xl font-mono tracking-widest"
                placeholder="XXXXX"
                maxLength={5}
                value={masterCode}
                onChange={e => setMasterCode(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                autoFocus
              />
              <button type="submit" disabled={verifying} className="btn-primary w-full justify-center py-3"
                style={{ background:'var(--color-warning)' }}>
                {verifying ? <div className="spinner w-4 h-4" /> : <ArrowRight size={18} />}
                {verifying ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ── RESUME FLOW — Step 2: Roll + Participant ID ── */}
        {mode === 'resume' && resumeStep === 2 && exam && (
          <div className="fade-in space-y-4">
            <div className="card" style={{ borderColor:'var(--color-warning)', borderWidth:'2px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:6 }}>🔄</div>
              <h2 style={{ fontSize:17, fontWeight:700, color:'var(--color-text)', marginBottom:4 }}>Resume Exam</h2>
              <p style={{ fontSize:13, color:'var(--color-text-muted)' }}>{exam.title}</p>
            </div>

            <div className="card shadow-xl">
              <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:12, marginBottom:20, fontSize:12, color:'var(--color-text-muted)', lineHeight:1.9 }}>
                <p style={{ fontWeight:700, color:'var(--color-text)', marginBottom:4 }}>📋 To resume:</p>
                <p>• Enter your roll number exactly as before</p>
                <p>• Enter the 10-digit Participant ID from your paper</p>
                <p>• Your section, answers and remaining time will be restored</p>
              </div>

              <form onSubmit={resumeExam} className="space-y-4">
                <div>
                  <label className="label">Roll Number *</label>
                  <input className="input font-mono text-lg tracking-wider uppercase"
                    placeholder="e.g. 02114802821"
                    value={resumeRoll}
                    onChange={e => setResumeRoll(e.target.value.toUpperCase())}
                    required />
                </div>

                <div>
                  <label className="label">Participant ID (from your paper) *</label>
                  <input
                    className="input font-mono text-2xl text-center tracking-widest"
                    placeholder="0000000000"
                    maxLength={10}
                    value={resumePartId}
                    onChange={e => setResumePartId(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    required
                  />
                  <p style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>
                    Enter all 10 digits without spaces or dashes
                  </p>
                </div>

                <button type="submit" disabled={starting} className="btn-primary w-full justify-center py-3"
                  style={{ background:'var(--color-warning)' }}>
                  {starting ? <div className="spinner w-4 h-4" /> : <RefreshCw size={18} />}
                  {starting ? 'Resuming...' : 'Resume My Exam →'}
                </button>
              </form>
            </div>

            <button onClick={() => setResumeStep(1)} className="btn-secondary w-full justify-center"
              style={{ fontSize:13 }}>← Back to Master Code
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
