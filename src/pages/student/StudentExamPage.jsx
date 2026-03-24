import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Bookmark, BookmarkCheck } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const isMobile = () => window.innerWidth < 768
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function StudentExamPage() {
  const navigate = useNavigate()
  const [sessionData, setSessionData] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [bookmarks, setBookmarks] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [violations, setViolations] = useState(0)
  const [warningMsg, setWarningMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [mobile, setMobile] = useState(isMobile())

  const sessionToken = useRef('')
  const autoSaveTimer = useRef(null)
  const heartbeatTimer = useRef(null)
  const timerRef = useRef(null)
  const violationCount = useRef(0)
  const extraMinutes = useRef(0)
  const qStartTime = useRef(Date.now())
  const originalWidth = useRef(window.screen.width)
  // Grace timer for mobile visibility change
  const visGraceTimer = useRef(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('cdc_session')
    if (!raw) { navigate('/exam'); return }
    const data = JSON.parse(raw)
    setSessionData(data)
    sessionToken.current = data.session.session_token
    setTimeLeft(data.exam.duration_minutes * 60)
    setMobile(isMobile())

    if (data.answers?.length) {
      const restored = {}
      data.answers.forEach(a => { if (a.selected_option) restored[a.question_id] = a.selected_option })
      setAnswers(restored)
    }

    startAntiCheat()
    startHeartbeat()
    startAutoSave()

    return () => {
      clearInterval(timerRef.current)
      clearInterval(autoSaveTimer.current)
      clearInterval(heartbeatTimer.current)
      clearTimeout(visGraceTimer.current)
      document.removeEventListener('keydown', blockKeys)
      document.removeEventListener('contextmenu', blockRight)
      document.removeEventListener('copy', blockCopy)
      document.removeEventListener('paste', blockCopy)
      document.removeEventListener('cut', blockCopy)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!sessionData) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1 + extraMinutes.current * 60
        extraMinutes.current = 0
        if (newTime <= 0) { handleAutoSubmit('timer_expired'); return 0 }
        return newTime
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [sessionData])

  // Reset question start time when question changes
  useEffect(() => { qStartTime.current = Date.now() }, [currentIdx])

  const startAntiCheat = () => {
    // Fullscreen — skip on iOS (not supported)
    if (!isIOS()) requestFullscreen()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('contextmenu', blockRight)
    document.addEventListener('copy', blockCopy)
    document.addEventListener('paste', blockCopy)
    document.addEventListener('cut', blockCopy)
    document.addEventListener('keydown', blockKeys)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    // user-select none on body
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    // Split-screen detection
    window.addEventListener('resize', handleResize)

    // DevTools detection (desktop only)
    if (!isMobile()) {
      setInterval(() => {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
          logViolation('devtools_open', {})
        }
      }, 3000)
    }

    // Idle detection (3 min)
    let idleTimer
    const resetIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        showWarn('You have been idle for 3 minutes. Stay active!')
        logViolation('idle_timeout', {})
      }, 3 * 60 * 1000)
    }
    document.addEventListener('mousemove', resetIdle)
    document.addEventListener('keypress', resetIdle)
    document.addEventListener('touchstart', resetIdle)
    resetIdle()
  }

  const requestFullscreen = () => {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
  }

  const handleVisibility = () => {
    if (!document.hidden) return
    // Mobile: 4-second grace window before counting violation
    const delay = isMobile() ? 4000 : 0
    visGraceTimer.current = setTimeout(() => {
      if (document.hidden) addViolation('tab_switch', { msg: 'Left the exam screen' })
    }, delay)
  }

  const handleBlur = () => {
    if (isMobile()) return // too many false positives on mobile
    addViolation('window_blur', { msg: 'Window lost focus' })
  }

  const handleResize = () => {
    const ratio = window.innerWidth / originalWidth.current
    if (ratio < 0.75) {
      addViolation('split_screen', { ratio: ratio.toFixed(2), innerWidth: window.innerWidth })
      showWarn('Split screen detected! Please exit split mode to continue.')
    }
  }

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && !isIOS()) {
      addViolation('fullscreen_exit', {})
      setTimeout(requestFullscreen, 500)
    }
  }

  const blockRight = (e) => e.preventDefault()
  const blockCopy  = (e) => { e.preventDefault(); logViolation('copy_attempt', { type: e.type }) }
  const blockKeys  = (e) => {
    const blocked = [
      e.key === 'F12',
      e.ctrlKey && ['u','U','c','C','a','A','s','S','p','P','i','I'].includes(e.key),
      e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key),
      e.key === 'PrintScreen',
    ]
    if (blocked.some(Boolean)) { e.preventDefault(); logViolation('keyboard_shortcut', { key: e.key }) }
  }

  const addViolation = async (type, details) => {
    violationCount.current += 1
    setViolations(violationCount.current)
    await logViolation(type, details)
    const limit = type === 'split_screen' ? 2 : 3
    const remaining = limit - violationCount.current
    if (violationCount.current >= limit) {
      showWarn('3 violations recorded. Auto-submitting!')
      setTimeout(() => handleAutoSubmit('violation_limit'), 2000)
    } else {
      showWarn(`Warning ${violationCount.current}/${limit}: ${getViolationMsg(type)}. ${remaining} left!`)
    }
  }

  const logViolation = async (type, details) => {
    try { await api.post('/exam/violation', { session_token: sessionToken.current, violation_type: type, details }) } catch {}
  }

  const getViolationMsg = (type) => ({
    tab_switch: 'App switch detected', window_blur: 'Window lost focus',
    fullscreen_exit: 'Fullscreen exited', split_screen: 'Split screen detected'
  }[type] || 'Violation detected')

  const showWarn = (msg) => { setWarningMsg(msg); setTimeout(() => setWarningMsg(''), 6000) }

  const startHeartbeat = () => {
    heartbeatTimer.current = setInterval(async () => {
      try {
        await api.post('/exam/heartbeat', { session_token: sessionToken.current })
        const raw = sessionStorage.getItem('cdc_session')
        if (raw) {
          const data = JSON.parse(raw)
          const res = await api.get('/monitor/' + data.exam.id + '/check-extension/' + sessionToken.current)
          if (res.data.blocked) { toast.error('Your access has been blocked by the trainer.'); handleAutoSubmit('blocked') }
          if (res.data.extra_minutes > 0) { extraMinutes.current = res.data.extra_minutes; toast.success('+' + res.data.extra_minutes + ' minutes added!') }
        }
      } catch {}
    }, 30000)
  }

  const startAutoSave = () => {
    autoSaveTimer.current = setInterval(() => saveAllAnswers(), 30000)
  }

  const getTimeSpent = () => Math.round((Date.now() - qStartTime.current) / 1000)

  const saveAllAnswers = async () => {
    for (const [question_id, selected_option] of Object.entries(answers)) {
      try {
        await api.post('/exam/save-answer', { session_token: sessionToken.current, question_id, selected_option, is_bookmarked: bookmarks[question_id] || false, time_spent_seconds: 0 })
      } catch {}
    }
  }

  const selectAnswer = async (questionId, option) => {
    const timeSpent = getTimeSpent()
    setAnswers(a => ({ ...a, [questionId]: option }))
    try {
      await api.post('/exam/save-answer', { session_token: sessionToken.current, question_id: questionId, selected_option: option, is_bookmarked: bookmarks[questionId] || false, time_spent_seconds: timeSpent })
    } catch {}
  }

  const goNext = async () => {
    if (sessionData && currentIdx < sessionData.questions.length - 1) {
      const timeSpent = getTimeSpent()
      const currentQ = sessionData.questions[currentIdx]
      if (answers[currentQ.id]) {
        try {
          await api.post('/exam/save-answer', { session_token: sessionToken.current, question_id: currentQ.id, selected_option: answers[currentQ.id], is_bookmarked: bookmarks[currentQ.id] || false, time_spent_seconds: timeSpent })
        } catch {}
      }
      setCurrentIdx(i => i + 1)
    }
  }

  const toggleBookmark = (questionId) => setBookmarks(b => ({ ...b, [questionId]: !b[questionId] }))

  const handleSubmit = async () => {
    setSubmitting(true)
    await saveAllAnswers()
    try {
      const res = await api.post('/exam/submit', { session_token: sessionToken.current })
      const raw = sessionStorage.getItem('cdc_session')
      const data = raw ? JSON.parse(raw) : {}
      sessionStorage.setItem('cdc_done', JSON.stringify({
        name: data.session?.name,
        roll_number: data.session?.roll_number,
        exam_title: data.exam?.title,
        time_taken: res.data.time_taken_seconds,
        attempted: Object.keys(answers).length,
        total: data.questions?.length
      }))
      sessionStorage.removeItem('cdc_session')
      navigate('/exam/done')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed')
      setSubmitting(false)
    }
  }

  const handleAutoSubmit = async (reason) => {
    clearInterval(timerRef.current)
    clearInterval(autoSaveTimer.current)
    await saveAllAnswers()
    try {
      const res = await api.post('/exam/submit', { session_token: sessionToken.current })
      const raw = sessionStorage.getItem('cdc_session')
      const data = raw ? JSON.parse(raw) : {}
      sessionStorage.setItem('cdc_done', JSON.stringify({
        name: data.session?.name, roll_number: data.session?.roll_number,
        exam_title: data.exam?.title, time_taken: res.data.time_taken_seconds,
        attempted: Object.keys(answers).length, total: data.questions?.length
      }))
    } catch {}
    sessionStorage.removeItem('cdc_session')
    navigate('/exam/done')
  }

  if (!sessionData) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner w-10 h-10" /></div>

  const { questions, exam } = sessionData
  const currentQ = questions[currentIdx]
  const answered = Object.keys(answers).length
  const bookmarked = Object.values(bookmarks).filter(Boolean).length
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeColor = timeLeft < 300 ? 'var(--color-danger)' : timeLeft < 600 ? 'var(--color-warning)' : 'var(--color-success)'

  const getStatus = (idx) => {
    const q = questions[idx]
    if (answers[q.id]) return 'answered'
    if (bookmarks[q.id]) return 'bookmarked'
    if (idx < currentIdx) return 'visited'
    return 'none'
  }
  const statusBg = { answered: 'var(--color-success)', bookmarked: 'var(--color-warning)', visited: 'var(--color-danger)', none: 'var(--color-border)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)', userSelect: 'none' }}>

      {/* Warning banner */}
      {warningMsg && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#fff', background: violationCount.current >= 3 ? 'var(--color-danger)' : '#d97706' }}>
          ⚠ {warningMsg}
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{exam.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sessionData.session.name} · {sessionData.session.roll_number}</div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: timeColor }}>
          {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)', alignItems: 'center' }}>
          {violations > 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>⚠ {violations}/3</span>}
          <span>{answered}/{questions.length} answered</span>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--color-border)' }}>
        <div style={{ height: 4, width: ((currentIdx+1)/questions.length*100)+'%', background: 'var(--color-primary)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main question area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: mobile ? '16px' : '24px 32px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>

            {/* Section + bookmark */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Q{currentIdx+1}/{questions.length}</span>
                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--color-surface2)', fontSize: 11 }}>
                  {currentQ.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}
                </span>
                <span style={{ marginLeft: 6 }}>{currentQ.topic}</span>
              </div>
              <button onClick={() => toggleBookmark(currentQ.id)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: bookmarks[currentQ.id] ? '#fef3c7' : 'var(--color-surface2)', color: bookmarks[currentQ.id] ? '#92400e' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {bookmarks[currentQ.id] ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {bookmarks[currentQ.id] ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>

            {/* Question card */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: mobile ? '16px' : '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: mobile ? 15 : 16, lineHeight: 1.7, color: 'var(--color-text)', margin: 0 }}>{currentQ.question_text}</p>
              {currentQ.image_url && <img src={currentQ.image_url} alt="" style={{ marginTop: 12, maxWidth: '100%', borderRadius: 8 }} />}
            </div>

            {/* Options — large tap targets on mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {['A','B','C','D'].map(opt => {
                const text = currentQ.display_options?.[opt] || currentQ['option_' + opt.toLowerCase()]
                const selected = answers[currentQ.id] === opt
                return (
                  <button key={opt} onClick={() => selectAnswer(currentQ.id, opt)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: mobile ? '14px 16px' : '12px 16px', borderRadius: 12, border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: selected ? 'var(--color-primary)15' : 'var(--color-surface)', cursor: 'pointer', textAlign: 'left', width: '100%', minHeight: 52 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, background: selected ? 'var(--color-primary)' : 'var(--color-surface2)', color: selected ? '#fff' : 'var(--color-text-muted)' }}>{opt}</div>
                    <span style={{ fontSize: mobile ? 15 : 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</span>
                  </button>
                )
              })}
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setCurrentIdx(i => Math.max(0, i-1))} disabled={currentIdx===0} className="btn-secondary">
                <ChevronLeft size={18} /> {mobile ? '' : 'Previous'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {answers[currentQ.id] && (
                  <button onClick={() => { const a = {...answers}; delete a[currentQ.id]; setAnswers(a); api.post('/exam/save-answer', { session_token: sessionToken.current, question_id: currentQ.id, selected_option: null }) }}
                    className="btn-secondary" style={{ color: 'var(--color-danger)', fontSize: 13 }}>Clear</button>
                )}
                {currentIdx < questions.length - 1
                  ? <button onClick={goNext} className="btn-primary">{mobile ? '' : 'Next'} <ChevronRight size={18} /></button>
                  : <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary" style={{ background: 'var(--color-success)' }}><Send size={18} /> Submit</button>
                }
              </div>
            </div>
          </div>
        </main>

        {/* Question palette — desktop only */}
        {!mobile && (
          <aside style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)', overflowY: 'auto', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--color-text)' }}>Question Palette</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
              {questions.map((q, idx) => {
                const s = getStatus(idx)
                const isCur = idx === currentIdx
                return (
                  <button key={idx} onClick={() => setCurrentIdx(idx)}
                    style={{ width: 36, height: 36, borderRadius: 8, fontSize: 11, fontWeight: 700, border: isCur ? '2px solid var(--color-primary)' : '1px solid transparent', background: isCur ? 'var(--color-primary)' : statusBg[s], color: (s !== 'none' || isCur) ? '#fff' : 'var(--color-text-muted)', opacity: s === 'none' ? 0.4 : 1, cursor: 'pointer' }}>
                    {idx+1}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 11, lineHeight: 2, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              <div>🟢 {Object.keys(answers).length} answered</div>
              <div>🔴 {questions.length - Object.keys(answers).length} not answered</div>
              <div>🟡 {bookmarked} bookmarked</div>
            </div>
            <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--color-success)' }}>
              <Send size={14} /> Submit Exam
            </button>
          </aside>
        )}
      </div>

      {/* Submit confirm modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-text)', marginBottom: 12 }}>Submit Exam?</h3>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.8 }}>
              <div>✅ Answered: <strong style={{ color: 'var(--color-text)' }}>{answered}</strong></div>
              <div>⬜ Unanswered: <strong style={{ color: 'var(--color-danger)' }}>{questions.length - answered}</strong></div>
              <div>🔖 Bookmarked: <strong style={{ color: 'var(--color-warning)' }}>{bookmarked}</strong></div>
              <div style={{ color: 'var(--color-danger)', marginTop: 6 }}>⚠ You cannot go back after submitting!</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Review</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-success)' }}>
                {submitting ? <div className="spinner w-4 h-4" /> : <Send size={16} />}
                {submitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
