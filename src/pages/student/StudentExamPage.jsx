// CDC OAS — Student Exam Page v3.0
// Platform-aware security: Desktop / Android / iOS isolated hooks
// 2026-03-26

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, AlertTriangle, Bookmark, BookmarkCheck, Check, Shield } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useSecurity } from '../../security/index'

const isMobileWidth = () => window.innerWidth < 768

export default function StudentExamPage() {
  const navigate = useNavigate()
  const [sessionData, setSessionData]           = useState(null)
  const [currentIdx, setCurrentIdx]             = useState(0)
  const [answers, setAnswers]                   = useState({})
  const [bookmarks, setBookmarks]               = useState({})
  const [timeLeft, setTimeLeft]                 = useState(0)
  const [activeSection, setActiveSection]       = useState(null)
  const [sectionDone, setSectionDone]           = useState({ aptitude_reasoning: false, verbal: false })
  const [sectionSubmitting, setSectionSubmitting] = useState(false)
  const [submitting, setSubmitting]             = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [mobile, setMobile]                     = useState(isMobileWidth())

  const sessionToken    = useRef('')
  const autoSaveTimer   = useRef(null)
  const heartbeatTimer  = useRef(null)
  const timerRef        = useRef(null)
  const extraMinutes    = useRef(0)
  const qStartTime      = useRef(Date.now())
  const activeSectionRef = useRef(null)
  const answersRef      = useRef({})  // mirror of answers for use inside intervals

  // ── SECURITY HOOK (platform-aware) ──────────────────────────────────────────
  const { start: startSecurity, stop: stopSecurity, warningMsg, showGuidedAccess, platform } = useSecurity({
    sessionToken: sessionToken.current,
    onAutoSubmit: (reason) => handleAutoSubmit(reason),
  })

  // Keep answersRef in sync
  useEffect(() => { answersRef.current = answers }, [answers])

  // ── ANTI-COPY CSS (must be at top level — no conditional hooks) ─────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'anti-copy-style'
    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input, textarea, select {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      ::selection       { background: transparent !important; color: inherit !important; }
      ::-moz-selection  { background: transparent !important; color: inherit !important; }
      @media print { body { display: none !important; } }
    `
    document.head.appendChild(style)
    return () => { document.getElementById('anti-copy-style')?.remove() }
  }, [])

  // ── INIT ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('cdc_session')
    if (!raw) { navigate('/exam'); return }
    const data = JSON.parse(raw)
    setSessionData(data)
    sessionToken.current = data.session.session_token
    setMobile(isMobileWidth())

    const aptTime = (data.exam.aptitude_time_minutes || 0) * 60
    const verTime = (data.exam.verbal_time_minutes || 0) * 60
    const hasSec  = aptTime > 0 && verTime > 0

    if (!hasSec) {
      const fullDuration = data.exam.duration_minutes * 60
      if (data.exam.end_time) {
        const secsLeft = Math.floor((new Date(data.exam.end_time) - new Date()) / 1000)
        setTimeLeft(Math.min(fullDuration, Math.max(0, secsLeft)))
      } else {
        setTimeLeft(fullDuration)
      }
      // No sections — start security immediately
      startSecurity()
    }
    // If sections exist, security starts when student picks a section

    if (data.answers?.length) {
      const restored = {}
      data.answers.forEach(a => { if (a.selected_option) restored[a.question_id] = a.selected_option })
      setAnswers(restored)
      answersRef.current = restored
    }

    startHeartbeat()
    startAutoSave()

    return () => {
      clearInterval(timerRef.current)
      clearInterval(autoSaveTimer.current)
      clearInterval(heartbeatTimer.current)
      stopSecurity()
    }
  }, []) // eslint-disable-line

  // ── TIMER ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionData) return
    clearInterval(timerRef.current)
    if (timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1 + extraMinutes.current * 60
        extraMinutes.current = 0
        if (newTime <= 0) { handleTimerEnd(); return 0 }
        return newTime
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [sessionData, activeSection]) // eslint-disable-line

  // ── TIMER END ────────────────────────────────────────────────────────────────
  const handleTimerEnd = async () => {
    const data = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
    const aptTime = (data.exam?.aptitude_time_minutes || 0) * 60
    const verTime = (data.exam?.verbal_time_minutes || 0) * 60
    const hasSec  = aptTime > 0 && verTime > 0
    const curSection = activeSectionRef.current

    if (hasSec && curSection) {
      const nextSection = curSection === 'aptitude_reasoning' ? 'verbal' : 'aptitude_reasoning'
      const nextTime    = nextSection === 'aptitude_reasoning' ? aptTime : verTime

      if (sectionDone[nextSection]) {
        toast.error('Time up! All sections complete.')
        handleAutoSubmit('timer_expired')
        return
      }

      try {
        await api.post('/exam/submit-section', { session_token: sessionToken.current, section: curSection })
        await api.post('/exam/start-section',  { session_token: sessionToken.current, section: nextSection })
      } catch {}

      setSectionDone(prev => ({ ...prev, [curSection]: true }))
      setActiveSection(nextSection)
      activeSectionRef.current = nextSection
      setCurrentIdx(0)
      setTimeLeft(nextTime)
      toast.error('⏰ Time up! Moving to ' + (nextSection === 'verbal' ? 'Verbal' : 'Aptitude') + ' section')
      return
    }
    handleAutoSubmit('timer_expired')
  }

  // ── SECTION SELECT ───────────────────────────────────────────────────────────
  const handleSectionSelect = async (section) => {
    const data = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
    const aptTime = (data.exam?.aptitude_time_minutes || 0) * 60
    const verTime = (data.exam?.verbal_time_minutes || 0) * 60
    const sectionTime = section === 'aptitude_reasoning' ? aptTime : verTime

    setActiveSection(section)
    activeSectionRef.current = section
    setCurrentIdx(0)
    setTimeLeft(sectionTime)

    // Start platform-specific security now
    startSecurity()

    try { await api.post('/exam/start-section', { session_token: sessionToken.current, section }) } catch {}
  }

  // ── SECTION SUBMIT ───────────────────────────────────────────────────────────
  const handleSectionSubmit = async () => {
    if (sectionSubmitting) return
    if (!confirm('Submit this section? You CANNOT go back!')) return
    setSectionSubmitting(true)
    try {
      await saveAllAnswers()
      const data = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      const aptTime = (data.exam?.aptitude_time_minutes || 0) * 60
      const verTime = (data.exam?.verbal_time_minutes || 0) * 60
      const curSection  = activeSection
      const nextSection = curSection === 'aptitude_reasoning' ? 'verbal' : 'aptitude_reasoning'
      const nextTime    = nextSection === 'aptitude_reasoning' ? aptTime : verTime

      await api.post('/exam/submit-section', { session_token: sessionToken.current, section: curSection })
      setSectionDone(prev => ({ ...prev, [curSection]: true }))

      if (sectionDone[nextSection]) {
        await handleAutoSubmit('all_sections_done')
        return
      }

      await api.post('/exam/start-section', { session_token: sessionToken.current, section: nextSection })
      setActiveSection(nextSection)
      activeSectionRef.current = nextSection
      setCurrentIdx(0)
      setTimeLeft(nextTime)
      toast.success('Section submitted! Now: ' + (nextSection === 'verbal' ? 'Verbal' : 'Aptitude & Reasoning'))
    } catch { toast.error('Failed to submit section') }
    finally { setSectionSubmitting(false) }
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  const saveAllAnswers = async () => {
    for (const [qId, option] of Object.entries(answersRef.current)) {
      try {
        await api.post('/exam/save-answer', {
          session_token: sessionToken.current,
          question_id: qId, selected_option: option, time_spent_seconds: 0
        })
      } catch {}
    }
  }

  const startHeartbeat = () => {
    heartbeatTimer.current = setInterval(async () => {
      try {
        const res = await api.post('/exam/heartbeat', { session_token: sessionToken.current })
        if (res.data.extraMinutes > 0) {
          extraMinutes.current += res.data.extraMinutes
          toast.success('+' + res.data.extraMinutes + ' minutes added by trainer!')
        }
        if (res.data.alive === false) {
          toast.error('Your session has been ended by the trainer')
          handleAutoSubmit('session_ended')
        }
      } catch {}
    }, 30000)
  }

  const startAutoSave = () => {
    autoSaveTimer.current = setInterval(async () => {
      for (const [qId, option] of Object.entries(answersRef.current)) {
        try {
          await api.post('/exam/save-answer', {
            session_token: sessionToken.current,
            question_id: qId, selected_option: option, time_spent_seconds: 0
          })
        } catch {}
      }
    }, 30000)
  }

  const handleAutoSubmit = useCallback(async (reason) => {
    clearInterval(timerRef.current)
    clearInterval(autoSaveTimer.current)
    stopSecurity()
    setSubmitting(true)
    try {
      await saveAllAnswers()
      const res = await api.post('/exam/submit', { session_token: sessionToken.current })
      const raw  = sessionStorage.getItem('cdc_session')
      const data = raw ? JSON.parse(raw) : {}
      sessionStorage.setItem('cdc_done', JSON.stringify({
        name:       data.session?.name,
        roll_number:data.session?.roll_number,
        exam_title: data.exam?.title,
        time_taken: res.data.time_taken_seconds,
        attempted:  Object.keys(answersRef.current).length,
        total:      data.questions?.length
      }))
    } catch {}
    sessionStorage.removeItem('cdc_session')
    navigate('/exam/done')
  }, []) // eslint-disable-line

  const handleAnswer = async (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
    try {
      const timeSpent = Math.floor((Date.now() - qStartTime.current) / 1000)
      await api.post('/exam/save-answer', {
        session_token: sessionToken.current,
        question_id: questionId, selected_option: option, time_spent_seconds: timeSpent
      })
    } catch {}
  }

  const handleBookmark = async (questionId) => {
    const newVal = !bookmarks[questionId]
    setBookmarks(prev => ({ ...prev, [questionId]: newVal }))
    try {
      await api.post('/exam/save-answer', {
        session_token: sessionToken.current,
        question_id: questionId,
        selected_option: answers[questionId] || null,
        is_bookmarked: newVal, time_spent_seconds: 0
      })
    } catch {}
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (!sessionData) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner w-10 h-10" />
    </div>
  )

  const { exam } = sessionData
  const aptTimeMin    = exam?.aptitude_time_minutes || 0
  const verTimeMin    = exam?.verbal_time_minutes   || 0
  const hasBothSections = aptTimeMin > 0 && verTimeMin > 0
  const allQ          = sessionData.questions || []

  // ── SECTION SELECTION SCREEN ─────────────────────────────────────────────────
  if (hasBothSections && !activeSection) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:16 }}>
        <div style={{ width:'100%', maxWidth:500 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:56, height:56, background:'var(--color-primary)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:18, margin:'0 auto 10px' }}>CDC</div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'var(--color-text)', margin:0 }}>{exam?.title}</h1>
            <p style={{ color:'var(--color-text-muted)', fontSize:13, marginTop:4 }}>Choose a section to begin</p>
          </div>

          <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:14, marginBottom:16, fontSize:12, color:'var(--color-text-muted)', lineHeight:1.9 }}>
            <p style={{ fontWeight:700, color:'var(--color-danger)', marginBottom:4 }}>⚠️ Read carefully:</p>
            <p>• Each section has its own countdown timer</p>
            <p>• Once started, you <strong>CANNOT go back</strong> to a section</p>
            <p>• Unused section time is <strong>NOT transferred</strong></p>
            <p>• Anti-cheat monitoring starts when you pick a section</p>
          </div>

          <div style={{ display:'grid', gap:12 }}>
            <button onClick={() => handleSectionSelect('aptitude_reasoning')}
              style={{ padding:'20px 24px', background:'var(--color-surface)', border:'2px solid var(--color-primary)', borderRadius:12, cursor:'pointer', textAlign:'left', width:'100%' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:'var(--color-text)' }}>🧮 Aptitude & Reasoning</div>
                  <div style={{ fontSize:13, color:'var(--color-text-muted)', marginTop:4 }}>
                    {allQ.filter(q => q.section === 'aptitude_reasoning').length} questions
                  </div>
                </div>
                <div style={{ fontSize:24, fontWeight:700, color:'var(--color-primary)' }}>{aptTimeMin} min</div>
              </div>
            </button>

            <button onClick={() => handleSectionSelect('verbal')}
              style={{ padding:'20px 24px', background:'var(--color-surface)', border:'2px solid var(--color-warning)', borderRadius:12, cursor:'pointer', textAlign:'left', width:'100%' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:'var(--color-text)' }}>📝 Verbal</div>
                  <div style={{ fontSize:13, color:'var(--color-text-muted)', marginTop:4 }}>
                    {allQ.filter(q => q.section === 'verbal').length} questions
                  </div>
                </div>
                <div style={{ fontSize:24, fontWeight:700, color:'var(--color-warning)' }}>{verTimeMin} min</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── EXAM SCREEN ───────────────────────────────────────────────────────────────
  const questions   = hasBothSections && activeSection
    ? allQ.filter(q => q.section === activeSection)
    : allQ
  const currentQ    = questions[currentIdx]
  const mins        = Math.floor(timeLeft / 60)
  const secs        = timeLeft % 60
  const timeColor   = timeLeft < 300 ? 'var(--color-danger)' : timeLeft < 600 ? 'var(--color-warning)' : 'var(--color-success)'
  const otherSection        = activeSection === 'aptitude_reasoning' ? 'verbal' : 'aptitude_reasoning'
  const otherSectionPending = hasBothSections && !sectionDone[otherSection]

  const getStatus = (idx) => {
    const q = questions[idx]
    if (bookmarks[q?.id]) return 'bookmarked'
    if (answers[q?.id])   return 'answered'
    if (idx === currentIdx) return 'current'
    return 'unattempted'
  }

  const statusStyle = (s) => {
    if (s === 'answered')   return { background: 'var(--color-success)', color: 'white' }
    if (s === 'bookmarked') return { background: 'var(--color-warning)', color: 'white' }
    if (s === 'current')    return { background: 'var(--color-primary)', color: 'white' }
    return { background: 'var(--color-surface2)', color: 'var(--color-text-muted)' }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', fontFamily:'inherit', userSelect:'none', WebkitUserSelect:'none' }}>

      {/* ── VIOLATION WARNING BANNER ── */}
      {warningMsg && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'var(--color-danger)', color:'white', padding:'10px 16px', textAlign:'center', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <AlertTriangle size={16} /> {warningMsg}
        </div>
      )}

      {/* ── iOS GUIDED ACCESS BANNER ── */}
      {showGuidedAccess && platform === 'ios' && (
        <div style={{ position:'fixed', top: warningMsg ? 44 : 0, left:0, right:0, zIndex:999, background:'var(--color-warning)', color:'white', padding:'8px 16px', textAlign:'center', fontSize:12, fontWeight:500 }}>
          📱 For best security: Enable <strong>Guided Access</strong> (Triple-click home/side button)
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ position:'sticky', top: warningMsg ? 44 : 0, zIndex:100, background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--color-text)' }}>{exam?.title}</div>
          {hasBothSections && activeSection && (
            <div style={{ fontSize:11, color: activeSection === 'aptitude_reasoning' ? 'var(--color-primary)' : 'var(--color-warning)', fontWeight:600 }}>
              {activeSection === 'aptitude_reasoning' ? '🧮 Aptitude & Reasoning' : '📝 Verbal'}
              {sectionDone[otherSection] && ' · Other section done ✓'}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Platform indicator (subtle) */}
          <div style={{ fontSize:10, color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:3 }}>
            <Shield size={10} />
            {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Desktop'}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:timeColor, fontVariantNumeric:'tabular-nums' }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', maxWidth:1200, margin:'0 auto', padding:16, gap:16, flexDirection: mobile ? 'column' : 'row' }}>

        {/* ── QUESTION AREA ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {currentQ ? (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <span style={{ fontSize:13, color:'var(--color-text-muted)', fontWeight:600 }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <button onClick={() => handleBookmark(currentQ.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color: bookmarks[currentQ.id] ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                  {bookmarks[currentQ.id] ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                </button>
              </div>

              <p style={{ fontSize:16, color:'var(--color-text)', lineHeight:1.6, marginBottom:20, userSelect:'none', WebkitUserSelect:'none' }}>
                {currentQ.question_text}
              </p>

              <div style={{ display:'grid', gap:10 }}>
                {['A','B','C','D'].map(opt => {
                  const val      = currentQ['option_' + opt.toLowerCase()]
                  const selected = answers[currentQ.id] === opt
                  return (
                    <button key={opt} onClick={() => handleAnswer(currentQ.id, opt)}
                      style={{ padding:'12px 16px', borderRadius:10, border:`2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`, background: selected ? 'var(--color-primary)15' : 'var(--color-surface)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, transition:'all 0.15s' }}>
                      <span style={{ width:28, height:28, borderRadius:'50%', background: selected ? 'var(--color-primary)' : 'var(--color-surface2)', color: selected ? 'white' : 'var(--color-text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>{opt}</span>
                      <span style={{ fontSize:14, color:'var(--color-text)' }}>{val}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', marginTop:20, gap:8 }}>
                <button onClick={() => { setCurrentIdx(i => Math.max(0, i-1)); qStartTime.current = Date.now() }}
                  disabled={currentIdx === 0} className="btn-secondary">← Prev</button>
                <button onClick={() => setAnswers(prev => { const n={...prev}; delete n[currentQ.id]; return n })}
                  className="btn-secondary" style={{ color:'var(--color-danger)' }}>Clear</button>
                <button onClick={() => { setCurrentIdx(i => Math.min(questions.length-1, i+1)); qStartTime.current = Date.now() }}
                  disabled={currentIdx === questions.length-1} className="btn-secondary">Next →</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:40 }}>
              <p style={{ color:'var(--color-text-muted)' }}>No questions in this section</p>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ width: mobile ? '100%' : 280, flexShrink:0 }}>
          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
              {[
                ['Answered',   Object.keys(answers).filter(id => questions.find(q=>q.id===id)).length, 'var(--color-success)'],
                ['Bookmarked', Object.keys(bookmarks).filter(id => bookmarks[id] && questions.find(q=>q.id===id)).length, 'var(--color-warning)'],
                ['Total',      questions.length, 'var(--color-primary)']
              ].map(([label, val, color]) => (
                <div key={label} style={{ textAlign:'center', padding:'8px 4px', background:'var(--color-surface2)', borderRadius:8 }}>
                  <div style={{ fontSize:18, fontWeight:700, color }}>{val}</div>
                  <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Question grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:4, marginBottom:12 }}>
              {questions.map((_, idx) => {
                const s = getStatus(idx)
                return (
                  <button key={idx} onClick={() => { setCurrentIdx(idx); qStartTime.current = Date.now() }}
                    style={{ ...statusStyle(s), border:'none', borderRadius:6, padding:'6px 2px', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    {idx+1}
                  </button>
                )
              })}
            </div>

            {/* Submit section */}
            {hasBothSections && activeSection && !sectionDone[activeSection] && (
              <button onClick={handleSectionSubmit} disabled={sectionSubmitting}
                className="btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:8, background:'var(--color-primary)' }}>
                {sectionSubmitting ? <div className="spinner w-4 h-4" /> : <Check size={14} />}
                Submit {activeSection === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'} →
              </button>
            )}

            {/* Submit full exam */}
            <button onClick={() => setShowSubmitConfirm(true)}
              className="btn-primary" style={{ width:'100%', justifyContent:'center', background:'var(--color-success)' }}>
              <Send size={14} /> Submit Exam
            </button>
          </div>

          {/* Legend */}
          <div className="card" style={{ padding:10 }}>
            {[
              ['var(--color-success)','Answered'],
              ['var(--color-warning)','Bookmarked'],
              ['var(--color-primary)','Current'],
              ['var(--color-surface2)','Not attempted']
            ].map(([color, label]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ width:14, height:14, borderRadius:3, background:color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUBMIT CONFIRM MODAL ── */}
      {showSubmitConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.6)' }}>
          <div className="card" style={{ width:'100%', maxWidth:400 }}>
            <h3 style={{ fontWeight:700, fontSize:17, color:'var(--color-text)', marginBottom:12 }}>Submit Exam?</h3>
            <div style={{ marginBottom:16, fontSize:13 }}>
              <p style={{ color:'var(--color-text-muted)', marginBottom:8 }}>Your progress:</p>
              <p style={{ color:'var(--color-text)' }}>✅ Answered: <strong>{Object.keys(answers).length}</strong></p>
              <p style={{ color:'var(--color-text)' }}>📝 Total: <strong>{allQ.length}</strong></p>
              {hasBothSections && (
                <p style={{ color:'var(--color-warning)', marginTop:8, fontSize:12 }}>
                  ⚠️ {otherSectionPending
                    ? `You haven't attempted the ${otherSection === 'verbal' ? 'Verbal' : 'Aptitude'} section yet!`
                    : 'Both sections attempted.'}
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              <button onClick={() => handleAutoSubmit('manual')} disabled={submitting}
                className="btn-primary" style={{ flex:1, background:'var(--color-success)', justifyContent:'center' }}>
                {submitting ? <div className="spinner w-4 h-4" /> : <Send size={14} />} Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
