// CDC PSYCHOMETRIC — Student Assessment Flow
// Complete student-facing pages: Entry, Registration, Assessment, Completion

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MODULE_INFO, TIER_CONFIG } from '../../data/psyQuestions'
import { PLACEMENT_MODULE_INFO } from '../../data/placementQuestions'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── STEP 1: ACCESS CODE ENTRY ──────────────────────────────────────────────────
export function PsyEntryPage() {
  const navigate = useNavigate()
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [test, setTest]       = useState(null)
  const [error, setError]     = useState('')

  const validateCode = async () => {
    if (!code.trim()) return setError('Please enter your access code')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/psychometric/validate/${code.trim().toUpperCase()}`)
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Invalid code')
      setTest(data.test)
    } catch {
      setError('Connection failed. Please try again.')
    } finally { setLoading(false) }
  }

  const getModuleList = (t) => {
    const modules = []
    if (t.include_riasec)   modules.push({ label: 'Career Orientation', icon: '🧭', time: '10 min' })
    if (t.include_bigfive)  modules.push({ label: 'Personality Profile', icon: '🧠', time: '12 min' })
    if (t.include_interest) modules.push({ label: 'Interest Mapping',    icon: '💡', time: '8 min'  })
    if (t.include_aptitude) modules.push({ label: 'Aptitude Battery',    icon: '⚡', time: '25 min' })
    if (t.include_eq)       modules.push({ label: 'Emotional Intelligence', icon: '❤️', time: '10 min' })
    if (t.include_mi)       modules.push({ label: 'Multiple Intelligences', icon: '🌟', time: '8 min' })
    if (t.include_values)   modules.push({ label: 'Work Values',         icon: '🎯', time: '6 min'  })
    if (t.include_learning) modules.push({ label: 'Learning Style',      icon: '📚', time: '5 min'  })
    if (t.include_placement) modules.push({ label: 'Placement Readiness', icon: '🚀', time: '38 min' })
    return modules
  }

  if (test) {
    const modules = getModuleList(test)
    const totalTime = modules.reduce((acc, m) => acc + parseInt(m.time), 0)
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ background:'white', borderRadius:20, padding:36, maxWidth:560, width:'100%', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🧭</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#1e1b4b', margin:0 }}>{test.title}</h1>
            <p style={{ fontSize:13, color:'#6b7280', marginTop:6 }}>
              {test.program_tier === 'stream' ? 'Stream Explorer' : test.program_tier === 'career' ? 'Career Compass' : 'Professional Profile'} Assessment
            </p>
          </div>

          <div style={{ background:'#f8fafc', borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>What you'll complete</div>
            {modules.map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom: i < modules.length-1 ? '1px solid #e5e7eb' : 'none' }}>
                <span style={{ fontSize:13, color:'#374151' }}>{m.icon} {m.label}</span>
                <span style={{ fontSize:12, color:'#9ca3af' }}>{m.time}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'2px solid #e5e7eb' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1e1b4b' }}>Total Time</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#6366f1' }}>~{totalTime} minutes</span>
            </div>
          </div>

          <div style={{ background:'#eff6ff', borderRadius:10, padding:12, marginBottom:20, fontSize:12, color:'#1d4ed8' }}>
            💡 <strong>Tips:</strong> Find a quiet place. Answer honestly — there are no right or wrong answers. Take your time.
          </div>

          <button
            onClick={() => navigate('/psychometric/register', { state: { test, code: code.trim().toUpperCase() } })}
            style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer' }}>
            Continue to Registration →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:440, width:'100%', boxShadow:'0 25px 60px rgba(0,0,0,0.3)', textAlign:'center' }}>
        {/* Logo */}
        <div style={{ width:72, height:72, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>
          <span style={{ fontSize:36 }}>🧭</span>
        </div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#1e1b4b', margin:'0 0 6px' }}>CDC Psychometric</h1>
        <p style={{ fontSize:14, color:'#6b7280', margin:'0 0 32px' }}>Career Development Centre<br/>Manav Rachna Educational Institutions</p>

        <div style={{ textAlign:'left', marginBottom:8 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Enter Your Access Code</label>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && validateCode()}
            placeholder='PSY-XXXX'
            style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:`2px solid ${error?'#ef4444':'#e5e7eb'}`, fontSize:18, fontWeight:700, textAlign:'center', letterSpacing:3, color:'#1e1b4b', outline:'none', boxSizing:'border-box' }}
          />
          {error && <p style={{ color:'#ef4444', fontSize:12, marginTop:6 }}>{error}</p>}
        </div>

        <button onClick={validateCode} disabled={loading}
          style={{ width:'100%', padding:'14px', background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: loading ? '#9ca3af' : 'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', marginTop:8 }}>
          {loading ? 'Validating...' : 'Validate Code →'}
        </button>

        <div style={{ marginTop:20, padding:12, background:'#f8fafc', borderRadius:8 }}>
          <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>
            Have a retake code? <span style={{ color:'#6366f1', cursor:'pointer', fontWeight:600 }}
              onClick={() => navigate('/psychometric/retake')}>Click here →</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── STEP 2: STUDENT REGISTRATION FORM ─────────────────────────────────────────
export function PsyRegistrationPage() {
  const navigate = useNavigate()
  const { state } = window.history.state?.usr || {}
  const location  = window.location
  const navState  = JSON.parse(sessionStorage.getItem('psy_nav_state') || 'null')

  const test       = navState?.test
  const accessCode = navState?.code

  const [form, setForm]         = useState({ student_type: 'college', gender:'', stream:'' })
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState(1) // 1=personal, 2=academic, 3=parents

  useEffect(() => {
    // Save nav state to session
    const ls = location.state
    if (ls?.test) sessionStorage.setItem('psy_nav_state', JSON.stringify(ls))
  }, [])

  if (!test) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p>Session expired. <span style={{ color:'#6366f1', cursor:'pointer' }} onClick={() => navigate('/psychometric')}>Start again</span></p>
      </div>
    </div>
  )

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.full_name?.trim()) return toast.error('Full name is required')
    if (!form.contact_number?.trim()) return toast.error('Contact number is required')
    if (!form.student_type) return toast.error('Please select student type')

    setLoading(true)
    try {
      const res = await fetch(`${API}/psychometric/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, access_code: accessCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      // Save session data
      sessionStorage.setItem('psy_token',   data.token)
      sessionStorage.setItem('psy_student', JSON.stringify(data.student))
      sessionStorage.setItem('psy_session', JSON.stringify(data.session))
      sessionStorage.setItem('psy_test',    JSON.stringify(data.test))

      navigate('/psychometric/instructions')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const InputField = ({ label, field, placeholder, type='text', required=false }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      <input type={type} placeholder={placeholder} value={form[field]||''}
        onChange={e => update(field, e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', outline:'none', boxSizing:'border-box' }}
      />
    </div>
  )

  const SelectField = ({ label, field, options, required=false }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      <select value={form[field]||''} onChange={e => update(field, e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, color:'#374151', outline:'none', background:'white', boxSizing:'border-box' }}>
        <option value=''>Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81)', padding:20, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:40 }}>
      <div style={{ background:'white', borderRadius:20, padding:32, maxWidth:560, width:'100%', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:11, color:'#9ca3af', letterSpacing:1, marginBottom:6 }}>CDC PSYCHOMETRIC ASSESSMENT</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#1e1b4b', margin:0 }}>Student Registration</h2>
          <p style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>This information is confidential and used only for your report</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {['Personal','Academic','Parents'].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:4, borderRadius:2, background: step > i ? '#6366f1' : step === i+1 ? '#6366f1' : '#e5e7eb', marginBottom:4 }} />
              <span style={{ fontSize:10, color: step === i+1 ? '#6366f1' : '#9ca3af', fontWeight:600 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Personal */}
        {step === 1 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <InputField label='Full Name' field='full_name' placeholder='Your complete name' required />
              </div>
              <InputField label='Date of Birth' field='date_of_birth' placeholder='' type='date' />
              <SelectField label='Gender' field='gender' options={[
                {value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'},{value:'prefer_not',label:'Prefer not to say'}
              ]} required />
              <InputField label='Contact Number' field='contact_number' placeholder='10-digit mobile' required />
              <InputField label='Email ID' field='email' placeholder='your@email.com' type='email' />
              <InputField label='City' field='city' placeholder='Your city' />
              <InputField label='State' field='state' placeholder='Your state' />
            </div>
          </div>
        )}

        {/* Step 2: Academic */}
        {step === 2 && (
          <div>
            <SelectField label='Currently Studying At' field='student_type' options={[
              {value:'school',label:'School'},
              {value:'college',label:'College / University'},
              {value:'other',label:'Other'},
            ]} required />

            {form.student_type === 'school' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <InputField label='School Name' field='institution_name' placeholder='Your school name' required />
                </div>
                <SelectField label='Class / Grade' field='class_grade' options={[
                  {value:'8th',label:'Class 8'},{value:'9th',label:'Class 9'},
                  {value:'10th',label:'Class 10'},{value:'11th',label:'Class 11'},{value:'12th',label:'Class 12'},
                ]} required />
                <SelectField label='Stream' field='stream' options={[
                  {value:'science',label:'Science'},{value:'commerce',label:'Commerce'},
                  {value:'arts',label:'Arts / Humanities'},{value:'undecided',label:'Not decided yet'},
                ]} />
                <SelectField label='Board' field='board' options={[
                  {value:'CBSE',label:'CBSE'},{value:'ICSE',label:'ICSE'},
                  {value:'State Board',label:'State Board'},{value:'IB',label:'IB'},
                ]} />
              </div>
            )}

            {form.student_type === 'college' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <InputField label='College / University Name' field='institution_name' placeholder='Your college name' required />
                </div>
                <InputField label='Course / Branch' field='course_branch' placeholder='e.g. B.Tech CSE' required />
                <SelectField label='Year of Study' field='year_of_study' options={[
                  {value:'1st',label:'1st Year'},{value:'2nd',label:'2nd Year'},
                  {value:'3rd',label:'3rd Year'},{value:'4th',label:'4th Year / Final Year'},
                  {value:'pg',label:'Post Graduate'},
                ]} required />
                <div style={{ gridColumn:'1/-1' }}>
                  <InputField label='University' field='university_name' placeholder='Affiliated university' />
                </div>
              </div>
            )}

            <div style={{ marginTop:16, padding:12, background:'#f8fafc', borderRadius:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:10 }}>Career Context (Optional)</div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:12, color:'#6b7280', display:'block', marginBottom:4 }}>What career are you currently thinking about?</label>
                <input value={form.current_career_thought||''} onChange={e => update('current_career_thought', e.target.value)}
                  placeholder='e.g. Software Engineer, Doctor, Entrepreneur...'
                  style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #e5e7eb', fontSize:12, color:'#374151', boxSizing:'border-box' }} />
              </div>
              <SelectField label='How did you hear about this assessment?' field='referral_source' options={[
                {value:'CDC',label:'College CDC / Counselor'},{value:'Teacher',label:'Teacher / Professor'},
                {value:'Friend',label:'Friend / Classmate'},{value:'Family',label:'Family'},
                {value:'Self',label:'Self / Internet'},
              ]} />
            </div>
          </div>
        )}

        {/* Step 3: Parent Details */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:16, padding:10, background:'#f0fdf4', borderRadius:8, borderLeft:'3px solid #22c55e' }}>
              ✅ This information is kept strictly confidential and used only to include a parent summary in your report.
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', marginBottom:10 }}>Father's Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <InputField label="Father's Name" field='father_name' placeholder='Father full name' required />
                <InputField label='Occupation' field='father_occupation' placeholder='e.g. Engineer, Business' />
                <InputField label='Contact Number' field='father_contact' placeholder='Mobile number' />
                <InputField label='Email' field='father_email' placeholder='Email (optional)' />
              </div>
            </div>

            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', marginBottom:10 }}>Mother's Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <InputField label="Mother's Name" field='mother_name' placeholder='Mother full name' required />
                <InputField label='Occupation' field='mother_occupation' placeholder='e.g. Teacher, Homemaker' />
                <InputField label='Contact Number' field='mother_contact' placeholder='Mobile number' />
                <InputField label='Email' field='mother_email' placeholder='Email (optional)' />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          {step > 1 && (
            <button onClick={() => setStep(step-1)}
              style={{ flex:1, padding:'12px', border:'2px solid #e5e7eb', borderRadius:10, background:'white', color:'#6b7280', fontWeight:600, cursor:'pointer', fontSize:14 }}>
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => {
              if (step === 1 && (!form.full_name?.trim() || !form.contact_number?.trim())) return toast.error('Please fill required fields')
              if (step === 2 && !form.student_type) return toast.error('Please select student type')
              setStep(step+1)
            }}
              style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex:2, padding:'12px', background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: loading ? '#9ca3af':'white', border:'none', borderRadius:10, fontWeight:700, cursor: loading ? 'not-allowed':'pointer', fontSize:14 }}>
              {loading ? 'Registering...' : 'Start Assessment →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── STEP 3: INSTRUCTIONS ───────────────────────────────────────────────────────
export function PsyInstructionsPage() {
  const navigate = useNavigate()
  const test      = JSON.parse(sessionStorage.getItem('psy_test') || '{}')
  const student   = JSON.parse(sessionStorage.getItem('psy_student') || '{}')

  const modules = []
  if (test.include_riasec)   modules.push(MODULE_INFO.orientation)
  if (test.include_bigfive)  modules.push(MODULE_INFO.personality)
  if (test.include_interest) modules.push(MODULE_INFO.interest)
  if (test.include_aptitude) modules.push(MODULE_INFO.aptitude)
  if (test.include_eq)       modules.push(MODULE_INFO.eq)
  if (test.include_mi)       modules.push(MODULE_INFO.mi)
  if (test.include_values)   modules.push(MODULE_INFO.values)
  if (test.include_learning) modules.push(MODULE_INFO.learning)
  if (test.include_placement) {
    Object.values(PLACEMENT_MODULE_INFO).filter(m => m.label !== 'CSE Role Finder').forEach(m => modules.push(m))
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81)', padding:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:20, padding:36, maxWidth:580, width:'100%', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>👋</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#1e1b4b', margin:0 }}>Welcome, {student.full_name?.split(' ')[0]}!</h2>
          <div style={{ marginTop:8, padding:'6px 16px', background:'#eff6ff', borderRadius:20, display:'inline-block' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#6366f1' }}>Participant ID: {student.participant_id}</span>
          </div>
          <p style={{ fontSize:12, color:'#ef4444', marginTop:6, fontWeight:600 }}>📝 Please write down your Participant ID — you'll need it if you need to resume</p>
        </div>

        {/* Module timeline */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>Your Assessment Journey</div>
          {modules.map((m, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < modules.length-1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${m.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1e1b4b' }}>{m.label}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>{m.subtitle}</div>
              </div>
              <div style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap' }}>{m.duration}</div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div style={{ background:'#fefce8', borderRadius:10, padding:14, marginBottom:20, fontSize:12, color:'#854d0e' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>📋 Before You Begin:</div>
          <div>• Find a quiet place with no distractions</div>
          <div>• Answer honestly — there are NO right or wrong answers</div>
          <div>• Do NOT overthink — your first instinct is usually best</div>
          <div>• The aptitude section is timed — work quickly but carefully</div>
          <div>• A 2-minute break is provided between each section</div>
          <div>• If your browser closes, use your Participant ID to resume</div>
        </div>

        <button onClick={() => navigate('/psychometric/assessment')}
          style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer', letterSpacing:0.5 }}>
          I'm Ready — Start Assessment 🚀
        </button>
      </div>
    </div>
  )
}

// ── STEP 4: ASSESSMENT (main engine) ──────────────────────────────────────────
export function PsyAssessmentPage() {
  const navigate = useNavigate()

  const test     = JSON.parse(sessionStorage.getItem('psy_test') || '{}')
  const session  = JSON.parse(sessionStorage.getItem('psy_session') || '{}')
  const token    = sessionStorage.getItem('psy_token')

  // Build module queue
  const buildQueue = useCallback(() => {
    const q = []
    if (test.include_riasec)    q.push({ key:'orientation', ...MODULE_INFO.orientation })
    if (test.include_bigfive)   q.push({ key:'personality',  ...MODULE_INFO.personality })
    if (test.include_interest)  q.push({ key:'interest',     ...MODULE_INFO.interest })
    if (test.include_aptitude)  q.push({ key:'aptitude',     ...MODULE_INFO.aptitude })
    if (test.include_eq)        q.push({ key:'eq',           ...MODULE_INFO.eq })
    if (test.include_mi)        q.push({ key:'mi',           ...MODULE_INFO.mi })
    if (test.include_values)    q.push({ key:'values',       ...MODULE_INFO.values })
    if (test.include_learning)  q.push({ key:'learning',     ...MODULE_INFO.learning })
    if (test.include_placement) {
      const pm = PLACEMENT_MODULE_INFO
      if (pm.profile)    q.push({ key:'placement_profile',    ...pm.profile,    questions: pm.profile.questions,    section:'profile' })
      if (pm.aptitude)   q.push({ key:'placement_aptitude',   ...pm.aptitude,   questions: pm.aptitude.questions,   section:'aptitude' })
      if (pm.softskills) q.push({ key:'placement_softskills', ...pm.softskills, questions: pm.softskills.questions, section:'softskills' })
      if (pm.clarity)    q.push({ key:'placement_clarity',    ...pm.clarity,    questions: pm.clarity.questions,    section:'clarity' })
    }
    return q
  }, [test])

  const [moduleQueue]  = useState(buildQueue)
  const [moduleIdx, setModuleIdx]   = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [answers, setAnswers]       = useState({}) // { questionId: value }
  const [phase, setPhase]           = useState('question') // question, break, completing
  const [breakTime, setBreakTime]   = useState(test.break_duration_seconds || 120)
  const [aptTime, setAptTime]       = useState(test.aptitude_time_seconds || 1500)
  const [questionTime, setQuestionTime] = useState(0)
  const [startTime]                 = useState(Date.now())
  const timerRef    = useRef(null)
  const qStartRef   = useRef(Date.now())

  const currentModule  = moduleQueue[moduleIdx]
  const currentQuestions = currentModule?.questions || []
  const currentQuestion  = currentQuestions[questionIdx]
  const totalModules     = moduleQueue.length
  const totalQDone       = moduleQueue.slice(0, moduleIdx).reduce((a, m) => a + m.questions.length, 0) + questionIdx
  const totalQAll        = moduleQueue.reduce((a, m) => a + m.questions.length, 0)
  const overallPct       = Math.round((totalQDone / totalQAll) * 100)

  // Aptitude timer
  useEffect(() => {
    if (currentModule?.type === 'timed_mcq' && phase === 'question') {
      timerRef.current = setInterval(() => {
        setAptTime(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); advanceModule(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [moduleIdx, phase])

  // Break timer
  useEffect(() => {
    if (phase === 'break') {
      setBreakTime(test.break_duration_seconds || 120)
      const t = setInterval(() => {
        setBreakTime(prev => {
          if (prev <= 1) { clearInterval(t); setPhase('question'); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(t)
    }
  }, [phase])

  // Question timer
  useEffect(() => {
    qStartRef.current = Date.now()
    setQuestionTime(0)
    const t = setInterval(() => setQuestionTime(Math.floor((Date.now() - qStartRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [questionIdx, moduleIdx])

  const saveAnswer = async (questionId, value, dimension, scale, section) => {
    try {
      const endpoint = section ? `${API}/psychometric/answer` : `${API}/psychometric/answer`
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          question_id: questionId, dimension, scale,
          response_value: value,
          time_taken_seconds: Math.floor((Date.now() - qStartRef.current) / 1000),
          section: section || undefined
        })
      })
    } catch {}
  }

  const advanceModule = useCallback(async () => {
    // Update progress
    try {
      await fetch(`${API}/psychometric/session/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ completed_module: currentModule?.key, current_module: moduleQueue[moduleIdx+1]?.key })
      })
    } catch {}

    if (moduleIdx >= moduleQueue.length - 1) {
      // All done — complete
      setPhase('completing')
      await completeAssessment()
    } else {
      setPhase('break')
      setModuleIdx(prev => prev + 1)
      setQuestionIdx(0)
    }
  }, [moduleIdx, moduleQueue, currentModule, token])

  const handleAnswer = async (value) => {
    const q  = currentQuestion
    const dim = currentModule.key.startsWith('placement') ? 'placement' : currentModule.key
    const scale = q.scale || q.section || currentModule.key

    setAnswers(prev => ({ ...prev, [q.id]: value }))
    await saveAnswer(q.id, value, dim, scale, q.section || currentModule.section)

    if (questionIdx < currentQuestions.length - 1) {
      setQuestionIdx(prev => prev + 1)
    } else {
      await advanceModule()
    }
  }

  const completeAssessment = async () => {
    try {
      const totalTime = Math.floor((Date.now() - startTime) / 1000)
      const res = await fetch(`${API}/psychometric/complete`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ total_time_seconds: totalTime })
      })
      const data = await res.json()
      sessionStorage.setItem('psy_results', JSON.stringify(data.results))
      navigate('/psychometric/complete')
    } catch {
      navigate('/psychometric/complete')
    }
  }

  if (phase === 'completing') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ fontSize:64, marginBottom:20, animation:'spin 1s linear infinite' }}>⚙️</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0 }}>Calculating Your Results</h2>
        <p style={{ opacity:0.7, marginTop:8 }}>Running 7-dimensional analysis...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  )

  if (phase === 'break') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e1b4b,#312e81)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>☕</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#1e1b4b', margin:0 }}>Section Complete!</h2>
        <p style={{ color:'#6b7280', marginTop:8, fontSize:14 }}>
          Great work! Take a short break before the next section.
        </p>

        <div style={{ margin:'24px 0', position:'relative' }}>
          <div style={{ width:120, height:120, borderRadius:'50%', border:'8px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'8px solid #6366f1', borderRightColor:'transparent', transform:'rotate(0deg)', animation:'countdownSpin 1s linear infinite' }} />
            <div>
              <div style={{ fontSize:32, fontWeight:800, color:'#1e1b4b' }}>{breakTime}</div>
              <div style={{ fontSize:11, color:'#9ca3af' }}>seconds</div>
            </div>
          </div>
        </div>

        <div style={{ background:'#f0fdf4', borderRadius:10, padding:12, marginBottom:20 }}>
          <div style={{ fontSize:13, color:'#166534', fontWeight:600 }}>Next: {moduleQueue[moduleIdx]?.label}</div>
          <div style={{ fontSize:11, color:'#4ade80', marginTop:2 }}>{moduleQueue[moduleIdx]?.subtitle}</div>
        </div>

        {test.allow_skip_break && (
          <button onClick={() => setPhase('question')}
            style={{ padding:'12px 32px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
            Skip Break → Start Now
          </button>
        )}
        <style>{`@keyframes countdownSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  )

  if (!currentQuestion) return null

  // Determine question format
  const isLikert5     = currentModule.type === 'likert5'
  const isLikert3     = currentModule.type === 'likert3'
  const isMCQ         = currentModule.type === 'timed_mcq' || currentModule.type === 'weighted_mcq' || currentModule.key?.startsWith('placement')
  const isWeighted    = currentModule.type === 'weighted_mcq'

  const likert5Labels = ['Very Unlike Me', 'Unlike Me', 'Neutral', 'Like Me', 'Very Like Me']
  const likert3Labels = ['No / Rarely', 'Sometimes', 'Yes / Often']

  return (
    <div style={{ minHeight:'100vh', background: currentModule.key.startsWith('placement') ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'linear-gradient(135deg,#1e1b4b,#312e81)', padding:16 }}>

      {/* Header */}
      <div style={{ maxWidth:680, margin:'0 auto 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`${currentModule.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{currentModule.icon}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'white' }}>{currentModule.label}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Q{questionIdx+1} of {currentQuestions.length}</div>
            </div>
          </div>
          {currentModule.type === 'timed_mcq' && (
            <div style={{ background: aptTime < 120 ? '#ef4444' : '#22c55e', padding:'6px 12px', borderRadius:20, fontSize:13, fontWeight:700, color:'white' }}>
              ⏱ {Math.floor(aptTime/60)}:{String(aptTime%60).padStart(2,'0')}
            </div>
          )}
        </div>

        {/* Overall progress bar */}
        <div style={{ height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
          <div style={{ height:'100%', width:`${overallPct}%`, background:'white', borderRadius:2, transition:'width 0.3s' }} />
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textAlign:'right', marginTop:3 }}>{overallPct}% complete</div>
      </div>

      {/* Question Card */}
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ background:'white', borderRadius:20, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

          {/* Module progress dots */}
          <div style={{ display:'flex', gap:4, marginBottom:16, justifyContent:'center' }}>
            {moduleQueue.map((m, i) => (
              <div key={i} style={{ width: i === moduleIdx ? 24 : 8, height:8, borderRadius:4, background: i < moduleIdx ? '#22c55e' : i === moduleIdx ? currentModule.color : '#e5e7eb', transition:'all 0.3s' }} />
            ))}
          </div>

          {/* Question number */}
          <div style={{ fontSize:11, fontWeight:700, color:currentModule.color, marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
            {currentModule.label} — Question {questionIdx + 1}
          </div>

          {/* Question text */}
          <div style={{ fontSize:17, fontWeight:600, color:'#1e1b4b', lineHeight:1.5, marginBottom:24 }}>
            {currentQuestion.text}
          </div>

          {/* Answer options */}
          {isLikert5 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              {likert5Labels.map((label, i) => (
                <button key={i} onClick={() => handleAnswer(i+1)}
                  style={{ padding:'12px 4px', borderRadius:10, border:`2px solid ${answers[currentQuestion.id] === i+1 ? currentModule.color : '#e5e7eb'}`, background: answers[currentQuestion.id] === i+1 ? `${currentModule.color}15` : 'white', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{'⬜⬜⬜⬜⬜'.split('')[i] === '⬜' ? ['😞','🙁','😐','🙂','😊'][i] : '○'}</div>
                  <div style={{ fontSize:9, color:'#6b7280', lineHeight:1.2 }}>{label}</div>
                </button>
              ))}
            </div>
          )}

          {isLikert3 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {likert3Labels.map((label, i) => (
                <button key={i} onClick={() => handleAnswer(i+1)}
                  style={{ padding:'16px 10px', borderRadius:12, border:`2px solid ${answers[currentQuestion.id] === i+1 ? currentModule.color : '#e5e7eb'}`, background: answers[currentQuestion.id] === i+1 ? `${currentModule.color}15` : 'white', cursor:'pointer', fontSize:14, fontWeight:600, color: answers[currentQuestion.id] === i+1 ? currentModule.color : '#374151' }}>
                  {['No / Rarely','Sometimes','Yes / Often'][i]}
                </button>
              ))}
            </div>
          )}

          {isMCQ && currentQuestion.options && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {currentQuestion.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  style={{ padding:'14px 16px', borderRadius:12, border:`2px solid ${answers[currentQuestion.id] === i ? currentModule.color : '#e5e7eb'}`, background: answers[currentQuestion.id] === i ? `${currentModule.color}10` : 'white', cursor:'pointer', textAlign:'left', fontSize:13, color: answers[currentQuestion.id] === i ? currentModule.color : '#374151', fontWeight: answers[currentQuestion.id] === i ? 700 : 400, display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${answers[currentQuestion.id] === i ? currentModule.color : '#d1d5db'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, color: answers[currentQuestion.id] === i ? currentModule.color : '#9ca3af' }}>
                    {['A','B','C','D'][i]}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* EQ weighted MCQ */}
          {isWeighted && currentQuestion.options && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {currentQuestion.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  style={{ padding:'14px 16px', borderRadius:12, border:`2px solid ${answers[currentQuestion.id] === i ? '#ec4899' : '#e5e7eb'}`, background: answers[currentQuestion.id] === i ? '#ec489910' : 'white', cursor:'pointer', textAlign:'left', fontSize:13, color:'#374151', display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${answers[currentQuestion.id] === i ? '#ec4899' : '#d1d5db'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:2 }}>
                    {['A','B','C','D'][i]}
                  </span>
                  <span style={{ lineHeight:1.5 }}>{opt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── STEP 5: COMPLETION PAGE ────────────────────────────────────────────────────
export function PsyCompletePage() {
  const navigate  = useNavigate()
  const student   = JSON.parse(sessionStorage.getItem('psy_student') || '{}')

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#064e3b,#065f46,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, maxWidth:500, width:'100%', textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#1e1b4b', margin:0 }}>Assessment Complete!</h1>
        <p style={{ color:'#6b7280', marginTop:10, fontSize:14, lineHeight:1.6 }}>
          Congratulations {student.full_name?.split(' ')[0]}! Your responses have been recorded and your psychometric profile is being generated.
        </p>

        <div style={{ background:'#f0fdf4', borderRadius:12, padding:16, margin:'20px 0', border:'2px solid #bbf7d0' }}>
          <div style={{ fontSize:12, color:'#166534', fontWeight:700, marginBottom:4 }}>Your Participant ID</div>
          <div style={{ fontSize:24, fontWeight:900, color:'#1e1b4b', letterSpacing:2 }}>{student.participant_id}</div>
          <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>Keep this safe — your counselor will use this to share your report</div>
        </div>

        <div style={{ background:'#eff6ff', borderRadius:10, padding:14, marginBottom:20, textAlign:'left', fontSize:13, color:'#1d4ed8' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>What happens next?</div>
          <div>✅ Your profile has been submitted to your CDC counselor</div>
          <div>✅ A detailed report will be prepared for you</div>
          <div>✅ Your counselor will schedule a review session</div>
          <div>✅ You will receive personalised career guidance based on your profile</div>
        </div>

        <div style={{ fontSize:13, color:'#6b7280' }}>
          You may now close this window safely.
        </div>
      </div>
    </div>
  )
}
