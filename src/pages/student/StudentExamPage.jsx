// CDC OAS — StudentExamPage v3.1
// Fix 1: tokenRef pattern — security hooks always get correct session token
// Fix 2: refresh resume — restores correct section + remaining time on reload

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, AlertTriangle, Bookmark, BookmarkCheck, Check, Shield } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useSecurity } from '../../security/index'

const isMobileWidth = () => window.innerWidth < 768

export default function StudentExamPage() {
  const navigate = useNavigate()

  const [sessionData, setSessionData]             = useState(null)
  const [currentIdx, setCurrentIdx]               = useState(0)
  const [answers, setAnswers]                     = useState({})
  const [bookmarks, setBookmarks]                 = useState({})
  const [timeLeft, setTimeLeft]                   = useState(0)
  const [activeSection, setActiveSection]         = useState(null)
  const [sectionDone, setSectionDone]             = useState({ aptitude_reasoning: false, verbal: false })
  const [sectionSubmitting, setSectionSubmitting] = useState(false)
  const [submitting, setSubmitting]               = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [mobile, setMobile]                       = useState(isMobileWidth())

  // ── REFS ──────────────────────────────────────────────────────────────────
  // tokenRef is passed to security hooks — they always read .current (never stale)
  const tokenRef         = useRef('')
  const autoSaveTimer    = useRef(null)
  const heartbeatTimer   = useRef(null)
  const timerRef         = useRef(null)
  const extraMinutes     = useRef(0)
  const qStartTime       = useRef(Date.now())
  const activeSectionRef = useRef(null)
  const answersRef       = useRef({})   // mirror for use inside intervals
  const securityStarted  = useRef(false) // prevent double-start

  // Keep answersRef in sync with state
  useEffect(() => { answersRef.current = answers }, [answers])

  // Save current question index to sessionStorage on every navigation
  // So refresh restores the exact question the student was on
  useEffect(() => {
    if (!sessionData) return
    try {
      const stored = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      stored.lastQuestionIdx = currentIdx
      sessionStorage.setItem('cdc_session', JSON.stringify(stored))
    } catch {}
  }, [currentIdx, sessionData])

  // ── SECURITY HOOK ─────────────────────────────────────────────────────────
  // autoSubmitRef — always points to latest handleAutoSubmit, never stale
  // MUST use ref because useSecurity is called before handleAutoSubmit is defined
  const autoSubmitRef = useRef(null)

  const {
    start: startSecurity,
    stop:  stopSecurity,
    warningMsg,
    countdownMsg,
    showGuidedAccess,
    platform,
    violationCount,
    cancelCountdown,
  } = useSecurity({
    tokenRef,
    autoSubmitRef,
  })

  // ── ANTI-COPY CSS (unconditional — must never be in a conditional) ────────
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
      ::selection      { background: transparent !important; color: inherit !important; }
      ::-moz-selection { background: transparent !important; color: inherit !important; }
      @media print { body { display: none !important; } }
    `
    document.head.appendChild(style)
    return () => document.getElementById('anti-copy-style')?.remove()
  }, [])

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('cdc_session')
    if (!raw) { navigate('/exam'); return }
    const data = JSON.parse(raw)

    // Set token into ref FIRST — security hooks will read from here
    tokenRef.current = data.session.session_token
    setSessionData(data)
    setMobile(isMobileWidth())

    // If resumed via master code, reset violation count to 1
    // violationCount is the actual ref from the security hook
    if (data.violation_reset_to && violationCount) {
      violationCount.current = data.violation_reset_to
    }

    // Restore saved answers
    if (data.answers?.length) {
      const restored = {}
      data.answers.forEach(a => {
        if (a.selected_option) restored[a.question_id] = a.selected_option
      })
      setAnswers(restored)
      answersRef.current = restored
    }

    // Restore last question index — so refresh doesn't jump back to Q1
    if (data.lastQuestionIdx != null) {
      setCurrentIdx(data.lastQuestionIdx)
    }

    const aptTimeSec  = (data.exam.aptitude_time_minutes || 0) * 60
    const verTimeSec  = (data.exam.verbal_time_minutes   || 0) * 60
    const hasSections = aptTimeSec > 0 && verTimeSec > 0
    const sess        = data.session

    // ── RESTORE STATE — works for BOTH fresh load AND page refresh ────────
    // Key insight: sessionStorage always has the session row from DB.
    // That row contains current_section, aptitude_started_at etc.
    // So we NEVER need data.resumed — just read the session fields directly.

    // Mark already-submitted sections
    const aptDone = !!sess.aptitude_submitted_at
    const verDone = !!sess.verbal_submitted_at
    setSectionDone({ aptitude_reasoning: aptDone, verbal: verDone })

    if (hasSections) {
      if (sess.current_section) {
        // Student already picked a section — restore it with correct remaining time
        const section         = sess.current_section
        setActiveSection(section)
        activeSectionRef.current = section

        const sectionTotalSec = section === 'aptitude_reasoning' ? aptTimeSec : verTimeSec
        const startedAt       = section === 'aptitude_reasoning'
          ? sess.aptitude_started_at
          : sess.verbal_started_at

        if (startedAt) {
          const elapsed   = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
          const remaining = Math.max(0, sectionTotalSec - elapsed)
          setTimeLeft(remaining)
        } else {
          setTimeLeft(sectionTotalSec)
        }

        if (!securityStarted.current) {
          securityStarted.current = true
          startSecurity()
        }
      }
      // current_section is null → student hasn't picked yet → show section screen ✓

    } else {
      // No sections — single timer exam
      const fullDuration = data.exam.duration_minutes * 60

      if (data.exam.end_time) {
        const secsLeft = Math.floor((new Date(data.exam.end_time) - new Date()) / 1000)
        setTimeLeft(Math.min(fullDuration, Math.max(0, secsLeft)))
      } else if (sess.started_at) {
        // Correctly calculate remaining time even after refresh
        const elapsed   = Math.floor((Date.now() - new Date(sess.started_at).getTime()) / 1000)
        const remaining = Math.max(0, fullDuration - elapsed)
        setTimeLeft(remaining)
      } else {
        setTimeLeft(fullDuration)
      }

      if (!securityStarted.current) {
        securityStarted.current = true
        startSecurity()
      }
    }

    startHeartbeat()
    startAutoSave()

    // Cancel countdown when tab becomes visible again
    const onTabReturn = () => {
      if (!document.hidden) cancelCountdown?.()
    }
    document.addEventListener('visibilitychange', onTabReturn)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(autoSaveTimer.current)
      clearInterval(heartbeatTimer.current)
      stopSecurity()
      document.removeEventListener('visibilitychange', onTabReturn)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TIMER ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionData) return
    clearInterval(timerRef.current)
    if (timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1 + extraMinutes.current * 60
        extraMinutes.current = 0
        if (next <= 0) {
          // Use setTimeout to call handleTimerEnd outside the setState updater
          // Calling it directly inside setState causes stale closure issues
          setTimeout(() => handleTimerEnd(), 0)
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [sessionData, activeSection]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TIMER END ─────────────────────────────────────────────────────────────
  const handleTimerEnd = async () => {
    const data      = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
    const aptTime   = (data.exam?.aptitude_time_minutes || 0) * 60
    const verTime   = (data.exam?.verbal_time_minutes   || 0) * 60
    const hasSec    = aptTime > 0 && verTime > 0
    const curSection = activeSectionRef.current

    if (hasSec && curSection) {
      const next     = curSection === 'aptitude_reasoning' ? 'verbal' : 'aptitude_reasoning'
      const nextTime = next === 'aptitude_reasoning' ? aptTime : verTime

      if (sectionDone[next]) {
        toast.error('Time up! All sections complete.')
        handleAutoSubmit('timer_expired')
        return
      }
      try {
        await api.post('/exam/submit-section', { session_token: tokenRef.current, section: curSection })
        await api.post('/exam/start-section',  { session_token: tokenRef.current, section: next })
      } catch {}

      setSectionDone(prev => ({ ...prev, [curSection]: true }))
      setActiveSection(next)
      activeSectionRef.current = next
      setCurrentIdx(0)
      setTimeLeft(nextTime)
      toast.error(`⏰ Time up! Moving to ${next === 'verbal' ? 'Verbal' : 'Aptitude'} section`)
      return
    }
    handleAutoSubmit('timer_expired')
  }

  // ── SECTION SELECT ────────────────────────────────────────────────────────
  const handleSectionSelect = async (section) => {
    const data     = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
    const aptTime  = (data.exam?.aptitude_time_minutes || 0) * 60
    const verTime  = (data.exam?.verbal_time_minutes   || 0) * 60
    const secTime  = section === 'aptitude_reasoning' ? aptTime : verTime

    setActiveSection(section)
    activeSectionRef.current = section
    setCurrentIdx(0)
    setTimeLeft(secTime)

    // Start security NOW (token is already set in tokenRef)
    if (!securityStarted.current) {
      securityStarted.current = true
      startSecurity()
    }

    try {
      await api.post('/exam/start-section', { session_token: tokenRef.current, section })
      // Update sessionStorage so refresh restores correct section + start time
      const startedAt = new Date().toISOString()
      const stored    = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      const col       = section === 'aptitude_reasoning' ? 'aptitude_started_at' : 'verbal_started_at'
      stored.session  = {
        ...stored.session,
        current_section: section,
        [col]: startedAt,
      }
      sessionStorage.setItem('cdc_session', JSON.stringify(stored))
    } catch {}
  }

  // ── SECTION SUBMIT ────────────────────────────────────────────────────────
  const handleSectionSubmit = async () => {
    if (sectionSubmitting) return
    if (!confirm('Submit this section? You CANNOT go back!')) return
    setSectionSubmitting(true)
    try {
      await saveAllAnswers()
      const data    = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      const aptTime = (data.exam?.aptitude_time_minutes || 0) * 60
      const verTime = (data.exam?.verbal_time_minutes   || 0) * 60
      const cur     = activeSection
      const next    = cur === 'aptitude_reasoning' ? 'verbal' : 'aptitude_reasoning'
      const nextTime = next === 'aptitude_reasoning' ? aptTime : verTime

      await api.post('/exam/submit-section', { session_token: tokenRef.current, section: cur })
      setSectionDone(prev => ({ ...prev, [cur]: true }))

      if (sectionDone[next]) {
        await handleAutoSubmit('all_sections_done')
        return
      }

      await api.post('/exam/start-section', { session_token: tokenRef.current, section: next })
      setActiveSection(next)
      activeSectionRef.current = next
      setCurrentIdx(0)
      setTimeLeft(nextTime)

      // Update sessionStorage — mark cur section submitted, record next section start
      const now     = new Date().toISOString()
      const stored2 = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      const subCol  = cur === 'aptitude_reasoning' ? 'aptitude_submitted_at' : 'verbal_submitted_at'
      const startCol = next === 'aptitude_reasoning' ? 'aptitude_started_at' : 'verbal_started_at'
      stored2.session = {
        ...stored2.session,
        [subCol]:        now,
        current_section: next,
        [startCol]:      now,
      }
      sessionStorage.setItem('cdc_session', JSON.stringify(stored2))

      toast.success(`Section submitted! Now: ${next === 'verbal' ? 'Verbal' : 'Aptitude & Reasoning'}`)
    } catch {
      toast.error('Failed to submit section')
    } finally {
      setSectionSubmitting(false)
    }
  }

  // ── AUTO SUBMIT ───────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async (reason) => {
    clearInterval(timerRef.current)
    clearInterval(autoSaveTimer.current)
    stopSecurity()
    setSubmitting(true)
    try {
      await saveAllAnswers()
      const res  = await api.post('/exam/submit', { session_token: tokenRef.current })
      const raw  = sessionStorage.getItem('cdc_session')
      const data = raw ? JSON.parse(raw) : {}
      sessionStorage.setItem('cdc_done', JSON.stringify({
        name:           data.session?.name,
        roll_number:    data.session?.roll_number,
        participant_id: data.session?.participant_id,
        exam_title:     data.exam?.title,
        time_taken:     res.data.time_taken_seconds,
        attempted:      Object.keys(answersRef.current).length,
        total:          data.questions?.length
      }))
    } catch {}
    sessionStorage.removeItem('cdc_session')
    navigate('/exam/done')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Wire handleAutoSubmit into ref — security hooks always call latest version
  // Also wire immediately (not just in useEffect) so it's set on first render
  autoSubmitRef.current = handleAutoSubmit
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit
  }, [handleAutoSubmit])

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const saveAllAnswers = async () => {
    for (const [qId, option] of Object.entries(answersRef.current)) {
      try {
        await api.post('/exam/save-answer', {
          session_token:   tokenRef.current,
          question_id:     qId,
          selected_option: option,
          time_spent_seconds: 0
        })
      } catch {}
    }
  }

  const startHeartbeat = () => {
    heartbeatTimer.current = setInterval(async () => {
      try {
        const res = await api.post('/exam/heartbeat', { session_token: tokenRef.current })
        if (res.data.extraMinutes > 0) {
          extraMinutes.current += res.data.extraMinutes
          toast.success(`+${res.data.extraMinutes} minutes added by trainer!`)
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
            session_token:   tokenRef.current,
            question_id:     qId,
            selected_option: option,
            time_spent_seconds: 0
          })
        } catch {}
      }
    }, 30000)
  }

  const handleAnswer = async (questionId, option) => {
    const newAnswers = { ...answersRef.current, [questionId]: option }
    setAnswers(newAnswers)
    answersRef.current = newAnswers
    // Keep sessionStorage in sync so refresh restores all answers
    try {
      const stored = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
      stored.answers = Object.entries(newAnswers).map(([question_id, selected_option]) => ({
        question_id, selected_option
      }))
      sessionStorage.setItem('cdc_session', JSON.stringify(stored))
    } catch {}
    try {
      const timeSpent = Math.floor((Date.now() - qStartTime.current) / 1000)
      await api.post('/exam/save-answer', {
        session_token:   tokenRef.current,
        question_id:     questionId,
        selected_option: option,
        time_spent_seconds: timeSpent
      })
    } catch {}
  }

  const handleBookmark = async (questionId) => {
    const newVal = !bookmarks[questionId]
    setBookmarks(prev => ({ ...prev, [questionId]: newVal }))
    try {
      await api.post('/exam/save-answer', {
        session_token:   tokenRef.current,
        question_id:     questionId,
        selected_option: answers[questionId] || null,
        is_bookmarked:   newVal,
        time_spent_seconds: 0
      })
    } catch {}
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (!sessionData) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner w-10 h-10" />
    </div>
  )

  const { exam }        = sessionData
  const aptTimeMin      = exam?.aptitude_time_minutes || 0
  const verTimeMin      = exam?.verbal_time_minutes   || 0
  const hasBothSections = aptTimeMin > 0 && verTimeMin > 0
  const allQ            = sessionData.questions || []

  // ── SECTION SELECTION SCREEN ──────────────────────────────────────────────
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

  // ── EXAM SCREEN ───────────────────────────────────────────────────────────
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
    if (s === 'answered')   return { background:'var(--color-success)', color:'white' }
    if (s === 'bookmarked') return { background:'var(--color-warning)', color:'white' }
    if (s === 'current')    return { background:'var(--color-primary)', color:'white' }
    return { background:'var(--color-surface2)', color:'var(--color-text-muted)' }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', fontFamily:'inherit', userSelect:'none', WebkitUserSelect:'none' }}>

      {/* ROLLING BANNER — always visible during exam */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1001,
        background:'#1a1a2e', color:'#ff4444',
        fontSize:11, fontWeight:500, overflow:'hidden',
        height:22, display:'flex', alignItems:'center'
      }}>
        <div style={{
          whiteSpace:'nowrap',
          animation:'cdcScroll 35s linear infinite',
          paddingLeft:'100%'
        }}>
          🔴 EXAM IN PROGRESS — Do not click outside this window — Tab switching is monitored — All violations are recorded and reported to the Central Examination Team — Stay in fullscreen at all times — Switching tabs or windows will result in auto-submission — 🔴 EXAM IN PROGRESS — Do not click outside this window — Tab switching is monitored — All violations are recorded and reported to the Central Examination Team — Stay in fullscreen at all times —
        </div>
        <style>{`
          @keyframes cdcScroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* 8-SECOND COUNTDOWN BANNER — shown when student is away */}
      {countdownMsg && (
        <div style={{
          position:'fixed', top:22, left:0, right:0, zIndex:1000,
          background:'#7f1d1d', color:'white',
          padding:'10px 16px', textAlign:'center',
          fontWeight:700, fontSize:15,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          animation:'cdcPulse 0.5s ease-in-out infinite alternate'
        }}>
          <style>{`
            @keyframes cdcPulse {
              from { opacity: 1; }
              to   { opacity: 0.75; }
            }
          `}</style>
          {countdownMsg}
        </div>
      )}

      {/* VIOLATION WARNING BANNER */}
      {warningMsg && (
        <div style={{
          position:'fixed', top: countdownMsg ? 66 : 22,
          left:0, right:0, zIndex:999,
          background:'var(--color-danger)', color:'white',
          padding:'8px 16px', textAlign:'center',
          fontWeight:600, fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8
        }}>
          <AlertTriangle size={16} /> {warningMsg}
        </div>
      )}

      {/* iOS GUIDED ACCESS BANNER */}
      {showGuidedAccess && platform === 'ios' && (
        <div style={{ position:'fixed', top: warningMsg ? 44 : 0, left:0, right:0, zIndex:999, background:'var(--color-warning)', color:'white', padding:'8px 16px', textAlign:'center', fontSize:12, fontWeight:500 }}>
          📱 Enable <strong>Guided Access</strong> for best security (triple-click home/side button)
        </div>
      )}

      {/* HEADER */}
      <div style={{ position:'sticky', top: countdownMsg ? 66 : warningMsg ? 44 : 22, zIndex:100, background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
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
          <div style={{ fontSize:10, color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:3 }}>
            <Shield size={10} />
            {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Desktop'}
          </div>
          {sessionData?.session?.participant_id && (
            <div style={{ fontSize:10, color:'var(--color-warning)', fontWeight:700, fontFamily:'monospace', background:'var(--color-surface2)', padding:'2px 8px', borderRadius:4, letterSpacing:1, border:'1px solid var(--color-warning)' }}>
              ID: {sessionData.session.participant_id}
            </div>
          )}
          <div style={{ fontSize:22, fontWeight:800, color:timeColor, fontVariantNumeric:'tabular-nums' }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', maxWidth:1200, margin:'0 auto', padding:16, gap:16, flexDirection: mobile ? 'column' : 'row' }}>

        {/* QUESTION AREA */}
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
                <button onClick={() => {
                  const n = { ...answersRef.current }
                  delete n[currentQ.id]
                  setAnswers(n)
                  answersRef.current = n
                  try {
                    const stored = JSON.parse(sessionStorage.getItem('cdc_session') || '{}')
                    stored.answers = Object.entries(n).map(([question_id, selected_option]) => ({ question_id, selected_option }))
                    sessionStorage.setItem('cdc_session', JSON.stringify(stored))
                  } catch {}
                }} className="btn-secondary" style={{ color:'var(--color-danger)' }}>Clear</button>
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

        {/* SIDEBAR */}
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

      {/* SUBMIT CONFIRM MODAL */}
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
