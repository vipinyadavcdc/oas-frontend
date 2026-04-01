// CDC OAS — Psychometric Admin Page
// Purple sidebar section — Vipin & Ankur only
// Tabs: Tests | Students | Results | Analytics

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Users, BarChart2, ClipboardList, Eye, RefreshCw, Download, Brain } from 'lucide-react'

const PSY_ALLOWED = ['vipinyadav.cdc@mriu.edu.in', 'ankurkumaraggarwal@mru.edu.in']

const TABS = [
  { id:'tests',     label:'🧪 Tests',     icon: ClipboardList },
  { id:'students',  label:'👥 Students',  icon: Users },
  { id:'analytics', label:'📊 Analytics', icon: BarChart2 },
]

const MODULE_LABELS = {
  riasec:'Career Orientation', bigfive:'Personality', interest:'Interest Mapping',
  aptitude:'Aptitude', eq:'Emotional Intelligence', mi:'Multiple Intelligences',
  values:'Work Values', learning:'Learning Style', placement:'Placement Readiness',
}

export default function PsychometricPage() {
  const { trainer } = useAuth()

  if (!trainer || !PSY_ALLOWED.includes(trainer.email?.toLowerCase())) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:48 }}>🔒</div>
        <h2 style={{ color:'var(--color-danger)', fontWeight:700 }}>Access Denied</h2>
        <p style={{ color:'var(--color-text-muted)' }}>Psychometric administration is restricted to authorised CDC personnel.</p>
      </div>
    )
  }

  const [tab,       setTab]       = useState('tests')
  const [tests,     setTests]     = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [students,  setStudents]  = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentResult,   setStudentResult]   = useState(null)

  useEffect(() => { loadTests() }, [])
  useEffect(() => { if (selectedTest && tab === 'students') loadStudents() }, [selectedTest, tab])
  useEffect(() => { if (selectedTest && tab === 'analytics') loadAnalytics() }, [selectedTest, tab])

  const loadTests = async () => {
    try {
      const res = await api.get('/psychometric/tests')
      setTests(res.data.tests || [])
      if (res.data.tests?.length && !selectedTest) setSelectedTest(res.data.tests[0])
    } catch { toast.error('Failed to load tests') }
  }

  const loadStudents = async () => {
    if (!selectedTest) return
    setLoading(true)
    try {
      const res = await api.get(`/psychometric/tests/${selectedTest.id}/students`)
      setStudents(res.data.students || [])
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  const loadAnalytics = async () => {
    if (!selectedTest) return
    setLoading(true)
    try {
      const res = await api.get(`/psychometric/tests/${selectedTest.id}/analytics`)
      setAnalytics(res.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const loadStudentResult = async (student) => {
    setSelectedStudent(student)
    try {
      const res = await api.get(`/psychometric/students/${student.id}/results`)
      setStudentResult(res.data)
    } catch { toast.error('Failed to load results') }
  }

  const authorizeRetake = async (studentId) => {
    const reason = prompt('Reason for retake authorization:')
    if (!reason) return
    try {
      const res = await api.post('/psychometric/retake/authorize', { student_id: studentId, reason })
      toast.success(`Retake code: ${res.data.retake_code} (valid 48 hours)`)
      navigator.clipboard.writeText(res.data.retake_code)
      toast.success('Code copied to clipboard!')
    } catch { toast.error('Failed to authorize retake') }
  }

  const StanineBar = ({ label, stanine, pct, color }) => {
    const colors = ['','#ef4444','#ef4444','#f97316','#eab308','#eab308','#22c55e','#22c55e','#16a34a','#059669']
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
          <span style={{ color:'var(--color-text)', fontWeight:600 }}>{label}</span>
          <span style={{ color:colors[stanine]||color, fontWeight:700 }}>
            {stanine}/9 — {pct?.toFixed(1)}%
          </span>
        </div>
        <div style={{ height:8, background:'var(--color-surface2)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct||0}%`, background:colors[stanine]||color, borderRadius:4 }} />
        </div>
      </div>
    )
  }

  const Card = ({ children, style={} }) => (
    <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:16, ...style }}>
      {children}
    </div>
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--color-text)', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:28 }}>🧠</span> Psychometric Assessment
          </h1>
          <p style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>CDC Career Assessment System — Restricted Access</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
          <Plus size={16} /> Create Test
        </button>
      </div>

      {/* Test selector */}
      {tests.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--color-text-muted)', fontWeight:600 }}>Test:</span>
          {tests.map(t => (
            <button key={t.id} onClick={() => setSelectedTest(t)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:`1.5px solid ${selectedTest?.id===t.id?'#6366f1':'var(--color-border)'}`, background: selectedTest?.id===t.id?'#6366f115':'var(--color-surface)', color: selectedTest?.id===t.id?'#6366f1':'var(--color-text-muted)' }}>
              {t.title}
              <span style={{ marginLeft:6, background:'var(--color-surface2)', padding:'1px 6px', borderRadius:10, fontSize:10 }}>{t.completed_count||0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border:`1.5px solid ${tab===t.id?'#6366f1':'var(--color-border)'}`, background: tab===t.id?'#6366f1':'var(--color-surface)', color: tab===t.id?'white':'var(--color-text-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TESTS TAB ── */}
      {tab === 'tests' && (
        <div style={{ display:'grid', gap:12 }}>
          {tests.length === 0 ? (
            <Card style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🧪</div>
              <p style={{ color:'var(--color-text-muted)' }}>No tests created yet. Click "Create Test" to get started.</p>
            </Card>
          ) : tests.map(t => (
            <Card key={t.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <h3 style={{ fontWeight:800, fontSize:16, color:'var(--color-text)', margin:0 }}>{t.title}</h3>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background: t.status==='active'?'#dcfce7':'#fee2e2', color: t.status==='active'?'#16a34a':'#ef4444' }}>{t.status}</span>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, background:'#eff6ff', color:'#2563eb', fontWeight:600 }}>{t.program_tier}</span>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--color-text-muted)', flexWrap:'wrap' }}>
                    <span>🔑 Code: <strong style={{ fontFamily:'monospace', color:'#6366f1', fontSize:14 }}>{t.access_code}</strong></span>
                    <span>👥 {t.student_count||0} registered</span>
                    <span>✅ {t.completed_count||0} completed</span>
                    <span>by {t.created_by_name}</span>
                  </div>
                  {/* Modules */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                    {['riasec','bigfive','interest','aptitude','eq','mi','values','learning','placement'].filter(m => t[`include_${m}`]).map(m => (
                      <span key={m} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#6366f115', color:'#6366f1', fontWeight:600 }}>
                        {MODULE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setSelectedTest(t); setTab('students') }}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:12, cursor:'pointer' }}>
                    <Users size={14} style={{ marginRight:4 }} />View Students
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(t.access_code).then(() => toast.success('Code copied!'))}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:12, cursor:'pointer' }}>
                    Copy Code
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === 'students' && (
        <div>
          {!selectedTest ? (
            <Card style={{ textAlign:'center', padding:40 }}>
              <p style={{ color:'var(--color-text-muted)' }}>Select a test above to view students</p>
            </Card>
          ) : loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner w-10 h-10" /></div>
          ) : (
            <div>
              <div style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:12 }}>
                {students.length} students registered for <strong>{selectedTest.title}</strong>
              </div>
              <Card style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'var(--color-surface2)' }}>
                      {['Participant ID','Name','Type','Institution','Holland Code','Status','Time','Flags','Actions'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--color-border)' }}>
                        <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700, color:'#6366f1', fontSize:11 }}>{s.participant_id}</td>
                        <td style={{ padding:'10px 12px', fontWeight:600, color:'var(--color-text)' }}>{s.full_name}</td>
                        <td style={{ padding:'10px 12px', color:'var(--color-text-muted)', fontSize:11 }}>{s.student_type}</td>
                        <td style={{ padding:'10px 12px', color:'var(--color-text-muted)', fontSize:11, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.institution_name}</td>
                        <td style={{ padding:'10px 12px' }}>
                          {s.holland_code ? (
                            <span style={{ fontWeight:800, fontSize:14, color:'#6366f1', fontFamily:'monospace' }}>{s.holland_code}</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
                            background: s.status==='completed'?'#dcfce7':s.status==='in_progress'?'#fef9c3':'#f3f4f6',
                            color: s.status==='completed'?'#16a34a':s.status==='in_progress'?'#854d0e':'#6b7280' }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px', color:'var(--color-text-muted)', fontSize:11 }}>
                          {s.total_time_seconds ? `${Math.floor(s.total_time_seconds/60)}m` : '—'}
                        </td>
                        <td style={{ padding:'10px 12px', color: parseInt(s.flag_count) > 0 ? '#f97316' : 'var(--color-text-muted)', fontWeight: parseInt(s.flag_count) > 0 ? 700 : 400 }}>
                          {parseInt(s.flag_count) > 0 ? `⚠️ ${s.flag_count}` : '✅ Clean'}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {s.status === 'completed' && (
                              <button onClick={() => loadStudentResult(s)}
                                style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #6366f1', background:'#6366f115', color:'#6366f1', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                                View
                              </button>
                            )}
                            <button onClick={() => authorizeRetake(s.id)}
                              style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text-muted)', fontSize:11, cursor:'pointer' }}>
                              Retake
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && analytics && (
        <div style={{ display:'grid', gap:16 }}>
          {/* Overview stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {[
              ['Total Registered', analytics.overview?.total, '#6366f1'],
              ['Completed',        analytics.overview?.completed, '#22c55e'],
              ['Completion Rate',  analytics.overview?.total > 0 ? `${Math.round(analytics.overview.completed/analytics.overview.total*100)}%` : '0%', '#f59e0b'],
              ['Avg Time',        `${analytics.overview?.avg_time_minutes}m`, '#0ea5e9'],
            ].map(([l,v,c]) => (
              <Card key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:3 }}>{l}</div>
              </Card>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Holland Code distribution */}
            <Card>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Holland Code Distribution</h3>
              {analytics.hollandDist?.slice(0,8).map((h, i) => (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'#6366f1', fontSize:14 }}>{h.code}</span>
                    <span style={{ color:'var(--color-text-muted)' }}>{h.count} students</span>
                  </div>
                  <div style={{ height:8, background:'var(--color-surface2)', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${(h.count/analytics.overview?.completed)*100}%`, background:'#6366f1', borderRadius:4 }} />
                  </div>
                </div>
              ))}
            </Card>

            {/* Top career matches */}
            <Card>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Top Career Matches</h3>
              {analytics.topCareers?.slice(0,8).map((c, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text)' }}>{c.name}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>{c.category}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#6366f1' }}>{c.matched_count}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>{c.avg_fit}% avg fit</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Dimension averages */}
          <Card>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--color-text)', marginBottom:16 }}>Batch Dimension Averages</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {Object.entries(
                (analytics.dimensionAvgs || []).reduce((acc, s) => {
                  if (!acc[s.dimension]) acc[s.dimension] = []
                  acc[s.dimension].push(s)
                  return acc
                }, {})
              ).map(([dim, scales]) => (
                <div key={dim}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#6366f1', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>{dim}</div>
                  {scales.map(s => (
                    <StanineBar key={s.scale} label={s.scale} stanine={Math.round(s.avg_stanine)} pct={parseFloat(s.avg_pct)} />
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── STUDENT RESULT MODAL ── */}
      {selectedStudent && studentResult && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, paddingTop:40, overflowY:'auto' }}>
          <div style={{ background:'var(--color-surface)', borderRadius:20, width:'100%', maxWidth:700, maxHeight:'85vh', overflowY:'auto', padding:28 }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:'var(--color-text)', margin:0 }}>{selectedStudent.full_name}</h2>
                <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>
                  {selectedStudent.participant_id} &nbsp;·&nbsp; {selectedStudent.institution_name} &nbsp;·&nbsp;
                  {studentResult.session?.total_time_seconds ? `${Math.floor(studentResult.session.total_time_seconds/60)}m` : '—'}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {studentResult.hollandCode && (
                  <div style={{ padding:'6px 16px', background:'#6366f115', borderRadius:20, fontFamily:'monospace', fontWeight:900, color:'#6366f1', fontSize:18 }}>
                    {studentResult.hollandCode.code}
                  </div>
                )}
                <button onClick={() => { setSelectedStudent(null); setStudentResult(null) }}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text-muted)', cursor:'pointer' }}>
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Scores by dimension */}
            {Object.entries(
              (studentResult.scores || []).reduce((acc, s) => {
                if (!acc[s.dimension]) acc[s.dimension] = []
                acc[s.dimension].push(s)
                return acc
              }, {})
            ).map(([dim, scales]) => (
              <div key={dim} style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#6366f1', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>{dim}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:6 }}>
                  {scales.map(s => (
                    <StanineBar key={s.scale} label={s.scale} stanine={s.stanine} pct={s.percentage} color='#6366f1' />
                  ))}
                </div>
              </div>
            ))}

            {/* Career matches */}
            {studentResult.careerMatches?.length > 0 && (
              <div style={{ marginTop:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Top Career Matches</h3>
                {studentResult.careerMatches.slice(0,5).map((cm, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--color-border)' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background: i===0?'#fbbf24':i===1?'#9ca3af':i===2?'#b45309':'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:800, flexShrink:0 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)' }}>{cm.name}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-muted)' }}>{cm.category}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:18, fontWeight:800, color: cm.composite_fit_pct>=80?'#22c55e':cm.composite_fit_pct>=65?'#f59e0b':'#ef4444' }}>
                        {cm.composite_fit_pct}%
                      </div>
                      <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>match</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consistency flags */}
            {studentResult.flags?.length > 0 && (
              <div style={{ marginTop:16, padding:12, background:'#fff7ed', borderRadius:10, border:'1px solid #fed7aa' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#c2410c', marginBottom:8 }}>⚠️ Consistency Flags ({studentResult.flags.length})</div>
                {studentResult.flags.map((f, i) => (
                  <div key={i} style={{ fontSize:12, color:'#7c2d12', marginBottom:4 }}>
                    • {f.dimension}: {f.description} (severity: {(f.severity*100).toFixed(0)}%)
                  </div>
                ))}
              </div>
            )}

            {/* Authorize retake */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--color-border)', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={() => authorizeRetake(selectedStudent.id)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:13, cursor:'pointer', fontWeight:600 }}>
                <RefreshCw size={14} /> Authorize Retake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE TEST MODAL ── */}
      {showCreate && <CreateTestModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadTests() }} />}
    </div>
  )
}

// ── CREATE TEST MODAL ─────────────────────────────────────────────────────────
function CreateTestModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title:'', description:'', program_tier:'career',
    include_riasec:true, include_bigfive:true, include_interest:true,
    include_aptitude:true, include_eq:true, include_mi:true,
    include_values:true, include_learning:false, include_placement:false,
    placement_branch:'CSE', allow_skip_break:true,
    break_duration_seconds:120, aptitude_time_seconds:1500
  })
  const [loading, setLoading] = useState(false)

  const update  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggle  = (k)    => setForm(p => ({ ...p, [k]: !p[k] }))

  const modules = [
    { key:'include_riasec',    label:'🧭 Career Orientation', sub:'Holland RIASEC — 48 questions', time:'10 min' },
    { key:'include_bigfive',   label:'🧠 Personality Profile', sub:'Big Five OCEAN — 50 questions',  time:'12 min' },
    { key:'include_interest',  label:'💡 Interest Mapping',   sub:'Career domains — 25 questions',  time:'8 min'  },
    { key:'include_aptitude',  label:'⚡ Aptitude Battery',   sub:'10 abilities — 50 questions',    time:'25 min' },
    { key:'include_eq',        label:'❤️ Emotional Intelligence', sub:'Situational — 20 questions', time:'10 min' },
    { key:'include_mi',        label:'🌟 Multiple Intelligences', sub:'Gardner 8 — 24 questions',  time:'8 min'  },
    { key:'include_values',    label:'🎯 Work Values',        sub:'Super\'s model — 15 questions',  time:'6 min'  },
    { key:'include_learning',  label:'📚 Learning Style',     sub:'VAK + Kolb — 10 questions',     time:'5 min'  },
  ]

  const estimatedTime = modules.filter(m => form[m.key]).reduce((acc, m) => acc + parseInt(m.time), 0) + (form.include_placement ? 38 : 0)

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Test name is required')
    setLoading(true)
    try {
      await api.post('/psychometric/tests', form)
      toast.success('Test created successfully!')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create test')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--color-surface)', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:28 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'var(--color-text)', margin:0 }}>Create Psychometric Test</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--color-text-muted)' }}>✕</button>
        </div>

        {/* Basic info */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--color-text)', display:'block', marginBottom:5 }}>Test Name *</label>
          <input value={form.title} onChange={e => update('title', e.target.value)} placeholder='e.g. Career Assessment 2026 — CSE Batch'
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:13, boxSizing:'border-box' }} />
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--color-text)', display:'block', marginBottom:5 }}>Program Tier</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['stream','Stream (Class 8-10)'],['career','Career (Class 11-12)'],['graduate','Graduate (College)']].map(([v,l]) => (
              <button key={v} onClick={() => update('program_tier', v)}
                style={{ flex:1, padding:'8px', borderRadius:8, border:`1.5px solid ${form.program_tier===v?'#6366f1':'var(--color-border)'}`, background: form.program_tier===v?'#6366f115':'var(--color-surface)', color: form.program_tier===v?'#6366f1':'var(--color-text-muted)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Module selection */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--color-text)', marginBottom:8 }}>Select Modules</div>
          <div style={{ display:'grid', gap:8 }}>
            {modules.map(m => (
              <div key={m.key} onClick={() => toggle(m.key)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${form[m.key]?'#6366f1':'var(--color-border)'}`, background: form[m.key]?'#6366f108':'var(--color-surface)', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${form[m.key]?'#6366f1':'#d1d5db'}`, background: form[m.key]?'#6366f1':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {form[m.key] && <span style={{ color:'white', fontSize:12, fontWeight:800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text)' }}>{m.label}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>{m.sub}</div>
                  </div>
                </div>
                <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>{m.time}</span>
              </div>
            ))}

            {/* Placement module */}
            <div onClick={() => toggle('include_placement')}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:`2px solid ${form.include_placement?'#059669':'var(--color-border)'}`, background: form.include_placement?'#f0fdf4':'var(--color-surface)', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${form.include_placement?'#059669':'#d1d5db'}`, background: form.include_placement?'#059669':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {form.include_placement && <span style={{ color:'white', fontSize:12, fontWeight:800 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: form.include_placement?'#065f46':'var(--color-text)' }}>🚀 Placement Readiness Module</div>
                  <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Profile + Aptitude + Soft Skills + Career Clarity + CSE Role Finder — 63 questions</div>
                </div>
              </div>
              <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>38 min</span>
            </div>
          </div>
        </div>

        {/* Time estimate */}
        <div style={{ background:'#eff6ff', borderRadius:8, padding:12, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#1d4ed8', fontWeight:600 }}>Estimated Total Time</span>
          <span style={{ fontSize:16, fontWeight:800, color:'#1d4ed8' }}>~{estimatedTime} minutes</span>
        </div>

        {/* Settings */}
        <div style={{ display:'flex', gap:12, marginBottom:16 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, color:'var(--color-text)' }}>
            <input type='checkbox' checked={form.allow_skip_break} onChange={() => toggle('allow_skip_break')} />
            Allow students to skip 2-min breaks
          </label>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontWeight:600, cursor:'pointer', fontSize:14 }}>Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: loading?'#e5e7eb':'linear-gradient(135deg,#6366f1,#4f46e5)', color: loading?'#9ca3af':'white', fontWeight:700, cursor: loading?'not-allowed':'pointer', fontSize:14 }}>
            {loading ? 'Creating...' : 'Create Test →'}
          </button>
        </div>
      </div>
    </div>
  )
}
