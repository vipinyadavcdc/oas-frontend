// CDC OAS — Analysis Page
// Only for EMP001 (Vipin) and EMP002 (Ankur)
// Tabs: Overview | Sections | Rankings | Departments | Questions | Integrity | Trends | AI Report

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Access Guard ─────────────────────────────────────────────────────────────
const ALLOWED = ['vipinyadav.cdc@mriu.edu.in', 'ankurkumaraggarwal@mru.edu.in']

const TABS = [
  { id: 'overview',    label: '📊 Overview' },
  { id: 'sections',    label: '📐 Sections' },
  { id: 'rankings',    label: '🏆 Rankings' },
  { id: 'departments', label: '🏫 Departments' },
  { id: 'questions',   label: '❓ Questions' },
  { id: 'integrity',   label: '🔴 Integrity' },
  { id: 'trends',      label: '📈 Trends' },
  { id: 'ai',          label: '🤖 AI Report' },
]

export default function AnalysisPage() {
  const { trainer } = useAuth()
  const navigate    = useNavigate()

  // Access check
  if (!trainer || !ALLOWED.includes(trainer.email?.toLowerCase())) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:48 }}>🔒</div>
        <h2 style={{ color:'var(--color-danger)', fontWeight:700 }}>Access Denied</h2>
        <p style={{ color:'var(--color-text-muted)' }}>This page is restricted to authorised personnel only.</p>
      </div>
    )
  }

  const [exams,      setExams]      = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [cutoff,     setCutoff]     = useState(40)
  const [tab,        setTab]        = useState('overview')
  const [data,       setData]       = useState({})
  const [loading,    setLoading]    = useState(false)

  // Trends
  const [trendRoll,   setTrendRoll]   = useState('')
  const [trendData,   setTrendData]   = useState(null)
  const [trendLoading, setTrendLoading] = useState(false)

  // AI Report
  const [aiText,      setAiText]      = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiQuestion,  setAiQuestion]  = useState('')
  const [aiChat,      setAiChat]      = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const aiRef = useRef(null)

  useEffect(() => { loadExams() }, [])
  useEffect(() => { if (selectedId && tab !== 'trends' && tab !== 'ai') loadTab() }, [selectedId, tab, cutoff])

  const loadExams = async () => {
    try {
      const res = await api.get('/analysis/exams')
      setExams(res.data.exams)
      if (res.data.exams.length) setSelectedId(res.data.exams[0].id)
    } catch { toast.error('Failed to load exams') }
  }

  const loadTab = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      const endpoints = {
        overview:    `/analysis/${selectedId}/overview?cutoff=${cutoff}`,
        sections:    `/analysis/${selectedId}/sections`,
        rankings:    `/analysis/${selectedId}/rankings?cutoff=${cutoff}`,
        departments: `/analysis/${selectedId}/departments?cutoff=${cutoff}`,
        questions:   `/analysis/${selectedId}/questions`,
        integrity:   `/analysis/${selectedId}/integrity`,
      }
      if (!endpoints[tab]) { setLoading(false); return }
      const res = await api.get(endpoints[tab])
      setData(prev => ({ ...prev, [tab]: res.data }))
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const loadTrends = async () => {
    if (!trendRoll.trim()) return toast.error('Enter roll number')
    setTrendLoading(true)
    try {
      const res = await api.get(`/analysis/trends/${trendRoll.trim()}`)
      setTrendData(res.data.trends)
    } catch { toast.error('Failed to load trends') }
    finally { setTrendLoading(false) }
  }

  // ── AI REPORT — streaming ─────────────────────────────────────────────────
  const generateAIReport = async () => {
    if (!selectedId) return toast.error('Select an exam first')
    setAiLoading(true)
    setAiText('')
    setAiChat([])

    try {
      // Fetch full data for AI
      const res = await api.get(`/analysis/${selectedId}/full-data?cutoff=${cutoff}`)
      const d   = res.data

      const prompt = `You are an expert exam analyst for CDC (Career Development Centre) at Manav Rachna Educational Institutions (MREI), India.

Analyse the following exam data and generate a comprehensive professional report:

EXAM: ${d.exam?.title}
Type: ${d.exam?.exam_type}
University: ${d.exam?.university}
Total Questions: ${d.exam?.total_questions}
Cutoff: ${d.cutoff}%

OVERALL PERFORMANCE:
- Total Students: ${d.overview?.total}
- Average Score: ${d.overview?.avg_pct}%
- Highest Score: ${d.overview?.highest}%
- Lowest Score: ${d.overview?.lowest}%
- Passed (above ${d.cutoff}%): ${d.overview?.passed} of ${d.overview?.total}
- Aptitude Average: ${d.overview?.avg_apt}
- Verbal Average: ${d.overview?.avg_ver}
- Flagged Students: ${d.overview?.flagged}

DEPARTMENT PERFORMANCE:
${d.departments?.map(dep => `${dep.department}: Avg ${dep.avg_pct}%, ${dep.passed}/${dep.total} passed`).join('\n')}

WEAKEST TOPICS (by accuracy):
${d.weak_topics?.map(t => `${t.section} — ${t.topic}: ${t.accuracy}% accuracy`).join('\n')}

INTEGRITY DATA:
- Flagged students: ${d.integrity?.flagged}
- Tab switches detected: ${d.integrity?.tab_switches}
- Split screen attempts: ${d.integrity?.split_screens}
- Suspiciously fast answers: ${d.integrity?.fast_answers}

Generate a detailed professional report with these sections:
1. Executive Summary (2-3 paragraphs)
2. Key Findings (bullet points with specific numbers)
3. Section Analysis — Aptitude vs Verbal comparison
4. Department-wise Analysis (for each department)
5. Topic Difficulty Analysis (focus on weakest topics)
6. Integrity & Academic Honesty Report
7. Actionable Recommendations for trainers
8. Conclusion

Use specific numbers from the data. Be professional, concise and constructive.
Format with clear headings using markdown (## for sections, ### for sub-sections).`

      // Call Claude API with streaming
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 2000,
          stream:     true,
          messages:   [{ role: 'user', content: prompt }]
        })
      })

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.text) {
              fullText += json.delta.text
              setAiText(fullText)
              // Auto scroll
              if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight
            }
          } catch {}
        }
      }

      // Store full data for chat follow-ups
      setAiChat([{ role: 'system', examData: d, report: fullText }])

    } catch (err) {
      toast.error('AI report failed. Please try again.')
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  // ── AI CHAT — ask questions ───────────────────────────────────────────────
  const askQuestion = async () => {
    if (!aiQuestion.trim()) return
    if (!aiChat.length) return toast.error('Generate the AI report first')

    const question = aiQuestion.trim()
    setAiQuestion('')
    setChatLoading(true)

    const examData = aiChat[0]?.examData
    const history  = aiChat.filter(m => m.role !== 'system')

    const messages = [
      ...history,
      { role: 'user', content: question }
    ]

    // Add context if first question
    if (!history.length) {
      messages.unshift({
        role: 'user',
        content: `Context: I am asking about exam "${examData?.exam?.title}" with ${examData?.overview?.total} students, avg score ${examData?.overview?.avg_pct}%. The full report has been generated. Now answer my question: ${question}`
      })
      messages.shift() // remove duplicate
      messages[0] = {
        role: 'user',
        content: `I have exam data for "${examData?.exam?.title}" (${examData?.overview?.total} students, avg ${examData?.overview?.avg_pct}%). ${question}`
      }
    }

    setAiChat(prev => [...prev, { role: 'user', content: question }])

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 800,
          stream:     true,
          messages:   messages.filter(m => m.role !== 'system').map(m => ({
            role:    m.role,
            content: m.content
          }))
        })
      })

      const reader   = response.body.getReader()
      const decoder  = new TextDecoder()
      let   answer   = ''
      let   msgIndex = -1

      setAiChat(prev => {
        msgIndex = prev.length
        return [...prev, { role: 'assistant', content: '' }]
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.text) {
              answer += json.delta.text
              setAiChat(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: answer }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch { toast.error('Question failed. Try again.') }
    finally { setChatLoading(false) }
  }

  // ── EXPORT PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!aiText) return toast.error('Generate report first')
    const win = window.open('', '_blank')
    const selectedExam = exams.find(e => e.id === selectedId)
    win.document.write(`
      <html><head>
        <title>Analysis Report — ${selectedExam?.title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #111; line-height: 1.6; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
          h2 { color: #1e3a8a; margin-top: 24px; }
          h3 { color: #374151; }
          p  { margin: 8px 0; }
          ul { margin: 8px 0; padding-left: 20px; }
          .header { text-align: center; margin-bottom: 32px; }
          .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head><body>
        <div class="header">
          <h1>CDC Exam Analysis Report</h1>
          <p><strong>${selectedExam?.title}</strong></p>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
          <p>Cutoff: ${cutoff}%</p>
        </div>
        ${aiText.replace(/\n/g,'<br>').replace(/##\s(.+)/g,'<h2>$1</h2>').replace(/###\s(.+)/g,'<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^- (.+)/gm,'<li>$1</li>')}
        <div class="footer">
          Career Development Centre — Manav Rachna Educational Institutions<br>
          Confidential — For Internal Use Only
        </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  // ── EXPORT WORD ───────────────────────────────────────────────────────────
  const exportWord = () => {
    if (!aiText) return toast.error('Generate report first')
    const selectedExam = exams.find(e => e.id === selectedId)
    const content = `
CDC EXAM ANALYSIS REPORT
${selectedExam?.title}
Generated: ${new Date().toLocaleDateString('en-IN')}
Cutoff: ${cutoff}%
Generated by: CDC AI Analysis System
Manav Rachna Educational Institutions
------------------------------------------------------------

${aiText.replace(/##\s/g,'\n\n').replace(/###\s/g,'\n').replace(/\*\*/g,'').replace(/`/g,'')}

------------------------------------------------------------
Career Development Centre — Manav Rachna Educational Institutions
Confidential — For Internal Use Only
    `
    const blob = new Blob([content], { type: 'application/msword' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${selectedExam?.title?.replace(/[^a-z0-9]/gi,'_')}_Analysis.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const selectedExam = exams.find(e => e.id === selectedId)
  const pct = (val, total) => total ? ((val/total)*100).toFixed(1) : 0

  const renderMarkdown = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## '))  return <h2 key={i} style={{ color:'var(--color-primary)', marginTop:20, marginBottom:8, fontSize:17, fontWeight:700 }}>{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} style={{ color:'var(--color-text)', marginTop:14, marginBottom:6, fontSize:15, fontWeight:700 }}>{line.slice(4)}</h3>
      if (line.startsWith('- '))   return <div key={i} style={{ paddingLeft:16, marginBottom:4, color:'var(--color-text)', fontSize:13 }}>• {line.slice(2)}</div>
      if (line.trim() === '')      return <div key={i} style={{ height:8 }} />
      return <p key={i} style={{ color:'var(--color-text)', fontSize:13, lineHeight:1.7, marginBottom:4 }}>{line.replace(/\*\*(.+?)\*\*/g, '$1')}</p>
    })
  }

  // ── TAB BUTTON ────────────────────────────────────────────────────────────
  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
      border:`1.5px solid ${tab===id ? 'var(--color-primary)' : 'var(--color-border)'}`,
      background: tab===id ? 'var(--color-primary)' : 'var(--color-surface)',
      color: tab===id ? 'white' : 'var(--color-text-muted)',
      transition:'all 0.15s', whiteSpace:'nowrap'
    }}>{label}</button>
  )

  const Card = ({ children, style = {} }) => (
    <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:16, ...style }}>
      {children}
    </div>
  )

  const StatBox = ({ label, value, sub, color = 'var(--color-primary)' }) => (
    <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
      <div style={{ fontSize:24, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text)', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--color-text-muted)', marginTop:2 }}>{sub}</div>}
    </div>
  )

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--color-text)', margin:0 }}>📊 Analysis Centre</h1>
          <p style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>Restricted — Vipin & Ankur only</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {/* Cutoff setter */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:12, color:'var(--color-text-muted)', fontWeight:600 }}>Cutoff %</span>
            <input type="number" min={1} max={100} value={cutoff}
              onChange={e => setCutoff(parseInt(e.target.value)||40)}
              style={{ width:60, padding:'4px 8px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:13, fontWeight:700, textAlign:'center' }} />
          </div>
          {/* Exam selector */}
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:13, minWidth:220 }}>
            <option value="">— Select Exam —</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.student_count} students)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {TABS.map(t => <TabBtn key={t.id} id={t.id} label={t.label} />)}
      </div>

      {!selectedId ? (
        <Card style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ color:'var(--color-text-muted)', fontSize:14 }}>Select an exam above to begin analysis</p>
        </Card>
      ) : loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div className="spinner w-10 h-10" />
        </div>
      ) : (

        <>
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && data.overview && (
            <div style={{ display:'grid', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
                <StatBox label="Students"    value={data.overview.stats?.total_students || 0} color="var(--color-primary)" />
                <StatBox label="Average"     value={`${data.overview.stats?.avg_percentage || 0}%`} color="var(--color-primary)" />
                <StatBox label="Passed"      value={data.overview.stats?.passed || 0} sub={`≥${cutoff}%`} color="var(--color-success)" />
                <StatBox label="Failed"      value={data.overview.stats?.failed || 0} sub={`<${cutoff}%`} color="var(--color-danger)" />
                <StatBox label="Highest"     value={`${data.overview.stats?.highest || 0}%`} color="var(--color-success)" />
                <StatBox label="Lowest"      value={`${data.overview.stats?.lowest || 0}%`} color="var(--color-danger)" />
                <StatBox label="Apt Avg"     value={data.overview.stats?.avg_aptitude || 0} color="var(--color-warning)" />
                <StatBox label="Ver Avg"     value={data.overview.stats?.avg_verbal || 0} color="var(--color-warning)" />
                <StatBox label="Flagged"     value={data.overview.stats?.flagged_count || 0} color="var(--color-danger)" />
                <StatBox label="Avg Time"    value={`${data.overview.stats?.avg_time_minutes || 0}m`} color="var(--color-text-muted)" />
              </div>

              {/* Score Distribution */}
              <Card>
                <h3 style={{ fontWeight:700, color:'var(--color-text)', marginBottom:16, fontSize:14 }}>Score Distribution</h3>
                {data.overview.distribution && Object.entries({
                  '0–20%':   data.overview.distribution.bucket_0_20,
                  '20–40%':  data.overview.distribution.bucket_20_40,
                  '40–60%':  data.overview.distribution.bucket_40_60,
                  '60–80%':  data.overview.distribution.bucket_60_80,
                  '80–100%': data.overview.distribution.bucket_80_100,
                }).map(([label, count]) => {
                  const total = data.overview.stats?.total_students || 1
                  const width = Math.round((count / total) * 100)
                  return (
                    <div key={label} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                        <span style={{ color:'var(--color-text)', fontWeight:600 }}>{label}</span>
                        <span style={{ color:'var(--color-text-muted)' }}>{count} students ({width}%)</span>
                      </div>
                      <div style={{ height:10, background:'var(--color-surface2)', borderRadius:5, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${width}%`, background:'var(--color-primary)', borderRadius:5, transition:'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </Card>
            </div>
          )}

          {/* ── SECTIONS ── */}
          {tab === 'sections' && data.sections && (
            <div style={{ display:'grid', gap:16 }}>
              {/* Averages comparison */}
              {data.sections.averages && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    ['🧮 Aptitude', data.sections.averages.avg_aptitude, data.sections.averages.aptitude_count * data.sections.averages.marks_per_question, 'var(--color-primary)'],
                    ['📝 Verbal',   data.sections.averages.avg_verbal,   data.sections.averages.verbal_count   * data.sections.averages.marks_per_question, 'var(--color-warning)'],
                  ].map(([label, avg, max, color]) => (
                    <Card key={label} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:800, color }}>{avg || 0} / {max || 0}</div>
                      <div style={{ fontSize:13, color:'var(--color-text)', fontWeight:600, marginTop:4 }}>{label}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:2 }}>
                        {max ? ((avg/max)*100).toFixed(1) : 0}% average
                      </div>
                      <div style={{ marginTop:10, height:8, background:'var(--color-surface2)', borderRadius:4 }}>
                        <div style={{ height:'100%', width:`${max ? Math.min(100,(avg/max)*100) : 0}%`, background:color, borderRadius:4 }} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Per-student section table */}
              <Card style={{ overflowX:'auto' }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:12 }}>Student Section Breakdown</h3>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'var(--color-surface2)' }}>
                      {['Name','Roll No','Dept','Aptitude','Verbal','Total %'].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.sections.students?.map((s, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--color-border)' }}>
                        <td style={{ padding:'7px 10px', color:'var(--color-text)', fontWeight:600 }}>{s.name}</td>
                        <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontFamily:'monospace' }}>{s.roll_number}</td>
                        <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontSize:11 }}>{s.department}</td>
                        <td style={{ padding:'7px 10px', color:'var(--color-primary)', fontWeight:700 }}>{s.aptitude_score}</td>
                        <td style={{ padding:'7px 10px', color:'var(--color-warning)', fontWeight:700 }}>{s.verbal_score}</td>
                        <td style={{ padding:'7px 10px' }}>
                          <span style={{ fontWeight:700, color: parseFloat(s.percentage) >= cutoff ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {s.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ── RANKINGS ── */}
          {tab === 'rankings' && data.rankings && (
            <Card style={{ overflowX:'auto' }}>
              <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:12 }}>
                Student Rankings — Cutoff: {cutoff}%
              </h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'var(--color-surface2)' }}>
                    {['Rank','Name','Roll No','Dept','Apt','Ver','Score','%','Time','Flags'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rankings.rankings?.map((s, i) => (
                    <tr key={i} style={{
                      borderBottom:'1px solid var(--color-border)',
                      background: i < 3 ? 'var(--color-success)08' : 'transparent'
                    }}>
                      <td style={{ padding:'7px 10px', fontWeight:800, color: i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#b45309':'var(--color-text-muted)' }}>
                        {i===0?'🥇':i===1?'🥈':i===2?'🥉':s.rank}
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text)', fontWeight:600 }}>
                        {s.name} {s.is_flagged && <span style={{ color:'var(--color-danger)', fontSize:10 }}>🚩</span>}
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontFamily:'monospace', fontSize:11 }}>{s.roll_number}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontSize:11 }}>{s.department?.split(' ')[0]}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-primary)', fontWeight:700 }}>{s.aptitude_score}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-warning)', fontWeight:700 }}>{s.verbal_score}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text)', fontWeight:700 }}>{s.final_score}/{s.max_score}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ fontWeight:800, color: parseFloat(s.percentage) >= cutoff ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontSize:11 }}>
                        {s.time_taken_seconds ? `${Math.floor(s.time_taken_seconds/60)}m` : '—'}
                      </td>
                      <td style={{ padding:'7px 10px', color: s.violations > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)', fontSize:11 }}>
                        {s.violations > 0 ? `⚠️ ${s.violations}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* ── DEPARTMENTS ── */}
          {tab === 'departments' && data.departments && (
            <div style={{ display:'grid', gap:12 }}>
              {data.departments.departments?.map((dept, i) => (
                <Card key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--color-text)' }}>{dept.department}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:2 }}>{dept.university} · {dept.total} students</div>
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--color-primary)' }}>{dept.avg_pct}%</div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Average</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--color-success)' }}>{dept.passed}</div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Passed</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--color-danger)' }}>{dept.total - dept.passed}</div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Failed</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--color-warning)' }}>{dept.avg_aptitude}</div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Apt Avg</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:800, color:'var(--color-warning)' }}>{dept.avg_verbal}</div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>Ver Avg</div>
                      </div>
                    </div>
                  </div>
                  {/* Pass rate bar */}
                  <div style={{ marginTop:10 }}>
                    <div style={{ height:8, background:'var(--color-surface2)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${dept.total ? (dept.passed/dept.total*100).toFixed(0) : 0}%`, background: parseFloat(dept.avg_pct) >= cutoff ? 'var(--color-success)' : 'var(--color-warning)', borderRadius:4 }} />
                    </div>
                    <div style={{ fontSize:10, color:'var(--color-text-muted)', marginTop:3 }}>
                      {dept.total ? (dept.passed/dept.total*100).toFixed(1) : 0}% pass rate · Highest: {dept.highest}% · Lowest: {dept.lowest}%
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {tab === 'questions' && data.questions && (
            <Card style={{ overflowX:'auto' }}>
              <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:4 }}>Question Difficulty Analysis</h3>
              <p style={{ fontSize:12, color:'var(--color-text-muted)', marginBottom:12 }}>Sorted by accuracy (hardest first)</p>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'var(--color-surface2)' }}>
                    {['#','Topic','Section','Difficulty','Correct','Wrong','Skipped','Accuracy','Avg Time'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.questions.questions?.map((q, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--color-border)', background: parseFloat(q.accuracy_pct) < 30 ? 'var(--color-danger)05' : 'transparent' }}>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)', fontWeight:600 }}>{i+1}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={q.topic}>{q.topic}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background: q.section==='aptitude_reasoning'?'var(--color-primary)20':'var(--color-warning)20', color: q.section==='aptitude_reasoning'?'var(--color-primary)':'var(--color-warning)', fontWeight:600 }}>
                          {q.section==='aptitude_reasoning'?'Apt':'Ver'}
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background: q.difficulty==='hard'?'var(--color-danger)20':q.difficulty==='medium'?'var(--color-warning)20':'var(--color-success)20', color: q.difficulty==='hard'?'var(--color-danger)':q.difficulty==='medium'?'var(--color-warning)':'var(--color-success)', fontWeight:600 }}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--color-success)', fontWeight:700 }}>{q.correct_count}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-danger)', fontWeight:700 }}>{q.wrong_count}</td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)' }}>{q.skipped_count}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ fontWeight:800, color: parseFloat(q.accuracy_pct) < 30 ? 'var(--color-danger)' : parseFloat(q.accuracy_pct) < 60 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {q.accuracy_pct || 0}%
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--color-text-muted)' }}>{q.avg_time_secs ? `${q.avg_time_secs}s` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* ── INTEGRITY ── */}
          {tab === 'integrity' && data.integrity && (
            <div style={{ display:'grid', gap:16 }}>
              {data.integrity.proxy_alerts?.length > 0 && (
                <Card style={{ border:'2px solid var(--color-danger)' }}>
                  <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-danger)', marginBottom:12 }}>🚨 Proxy Alerts</h3>
                  {data.integrity.proxy_alerts.map((a, i) => (
                    <div key={i} style={{ padding:'8px 12px', background:'var(--color-danger)08', borderRadius:8, marginBottom:8, fontSize:12 }}>
                      <span style={{ fontWeight:700, color:'var(--color-text)' }}>{a.name_1} ({a.roll_1})</span>
                      <span style={{ color:'var(--color-text-muted)', marginLeft:8 }}>
                        Same device used — {a.gap_seconds}s gap — {a.alert_type}
                      </span>
                    </div>
                  ))}
                </Card>
              )}

              <Card style={{ overflowX:'auto' }}>
                <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:12 }}>Violation Details</h3>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'var(--color-surface2)' }}>
                      {['Name','Roll No','Dept','Tab','FS Exit','Split','DevTools','Blur','Fast Ans','Resumes','Score','Flag'].map(h => (
                        <th key={h} style={{ padding:'8px 8px', textAlign:'left', fontWeight:700, color:'var(--color-text-muted)', whiteSpace:'nowrap', fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.integrity.students?.map((s, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--color-border)', background: s.is_flagged ? 'var(--color-danger)05' : 'transparent' }}>
                        <td style={{ padding:'6px 8px', color:'var(--color-text)', fontWeight:600, whiteSpace:'nowrap' }}>{s.name}</td>
                        <td style={{ padding:'6px 8px', color:'var(--color-text-muted)', fontFamily:'monospace', fontSize:10 }}>{s.roll_number}</td>
                        <td style={{ padding:'6px 8px', color:'var(--color-text-muted)', fontSize:10 }}>{s.department?.split(' ')[0]}</td>
                        <td style={{ padding:'6px 8px', color: s.tab_switches > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight:700 }}>{s.tab_switches || 0}</td>
                        <td style={{ padding:'6px 8px', color: s.fullscreen_exits > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>{s.fullscreen_exits || 0}</td>
                        <td style={{ padding:'6px 8px', color: s.split_screens > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{s.split_screens || 0}</td>
                        <td style={{ padding:'6px 8px', color: s.devtools > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{s.devtools || 0}</td>
                        <td style={{ padding:'6px 8px', color:'var(--color-text-muted)' }}>{s.window_blurs || 0}</td>
                        <td style={{ padding:'6px 8px', color: s.fast_answers > 3 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{s.fast_answers || 0}</td>
                        <td style={{ padding:'6px 8px', color: s.resume_count > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>{s.resume_count || 0}</td>
                        <td style={{ padding:'6px 8px', fontWeight:700, color: parseFloat(s.percentage) >= cutoff ? 'var(--color-success)' : 'var(--color-danger)' }}>{s.percentage}%</td>
                        <td style={{ padding:'6px 8px' }}>{s.is_flagged ? '🚩' : '✅'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ── TRENDS ── */}
          {tab === 'trends' && (
            <div style={{ display:'grid', gap:16 }}>
              <Card>
                <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:12 }}>Student Performance Trend</h3>
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <input className="input" placeholder="Enter Roll Number (e.g. 02114802821)"
                    value={trendRoll} onChange={e => setTrendRoll(e.target.value.toUpperCase())}
                    style={{ flex:1 }} />
                  <button onClick={loadTrends} disabled={trendLoading} className="btn-primary" style={{ whiteSpace:'nowrap' }}>
                    {trendLoading ? <div className="spinner w-4 h-4" /> : '🔍 Search'}
                  </button>
                </div>

                {trendData && trendData.length === 0 && (
                  <p style={{ color:'var(--color-text-muted)', fontSize:13 }}>No exam history found for this roll number.</p>
                )}

                {trendData && trendData.length > 0 && (
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--color-text)', marginBottom:12 }}>
                      {trendData[0] && `Trend for roll: ${trendRoll}`}
                    </div>
                    {/* Trend bars */}
                    {trendData.map((t, i) => (
                      <div key={i} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                          <span style={{ color:'var(--color-text)', fontWeight:600 }}>{t.title}</span>
                          <span style={{ color: parseFloat(t.percentage) >= cutoff ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:800 }}>
                            {t.percentage}%
                          </span>
                        </div>
                        <div style={{ display:'flex', gap:6, marginBottom:4 }}>
                          <div style={{ flex:1, height:10, background:'var(--color-surface2)', borderRadius:5, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${t.percentage}%`, background: parseFloat(t.percentage) >= cutoff ? 'var(--color-success)' : 'var(--color-danger)', borderRadius:5 }} />
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:'var(--color-text-muted)' }}>
                          Apt: {t.aptitude_score} · Ver: {t.verbal_score} · {t.exam_type} · {new Date(t.created_at).toLocaleDateString('en-IN')}
                          {t.is_flagged && ' · 🚩 Flagged'}
                        </div>
                      </div>
                    ))}

                    {/* Overall trend indicator */}
                    {trendData.length > 1 && (
                      <div style={{ marginTop:16, padding:'10px 14px', background:'var(--color-surface2)', borderRadius:8, fontSize:12 }}>
                        {(() => {
                          const first = parseFloat(trendData[0].percentage)
                          const last  = parseFloat(trendData[trendData.length-1].percentage)
                          const diff  = (last - first).toFixed(1)
                          const improving = diff > 0
                          return (
                            <span style={{ color: improving ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:700 }}>
                              {improving ? '📈 Improving' : '📉 Declining'} trend: {first}% → {last}% ({improving?'+':''}{diff}%)
                            </span>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── AI REPORT ── */}
          {tab === 'ai' && (
            <div style={{ display:'grid', gap:16 }}>
              <Card>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                  <div>
                    <h3 style={{ fontWeight:700, fontSize:15, color:'var(--color-text)', margin:0 }}>🤖 AI Analysis Report</h3>
                    <p style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>
                      Powered by Claude AI — streams in real time
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {aiText && (
                      <>
                        <button onClick={exportPDF} className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>
                          📄 Export PDF
                        </button>
                        <button onClick={exportWord} className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>
                          📝 Export Word
                        </button>
                      </>
                    )}
                    <button onClick={generateAIReport} disabled={aiLoading || !selectedId}
                      className="btn-primary" style={{ fontSize:12, padding:'6px 14px' }}>
                      {aiLoading ? <><div className="spinner w-4 h-4" /> Generating...</> : '✨ Generate Report'}
                    </button>
                  </div>
                </div>

                {/* Report output */}
                {(aiText || aiLoading) && (
                  <div ref={aiRef} style={{
                    background:'var(--color-surface2)', borderRadius:10, padding:20,
                    minHeight:200, maxHeight:500, overflowY:'auto',
                    border:'1px solid var(--color-border)', marginBottom:16
                  }}>
                    {aiLoading && !aiText && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--color-text-muted)', fontSize:13 }}>
                        <div className="spinner w-4 h-4" />
                        Analysing exam data and generating report...
                      </div>
                    )}
                    {renderMarkdown(aiText)}
                    {aiLoading && aiText && (
                      <span style={{ display:'inline-block', width:8, height:16, background:'var(--color-primary)', borderRadius:2, animation:'blink 0.7s infinite', marginLeft:2 }} />
                    )}
                  </div>
                )}

                {!aiText && !aiLoading && (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--color-text-muted)' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>🤖</div>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--color-text)' }}>AI Report Generator</p>
                    <p style={{ fontSize:12, marginTop:4 }}>Click "Generate Report" to get a full AI-powered analysis of this exam including performance insights, department comparison, integrity report and actionable recommendations.</p>
                  </div>
                )}
              </Card>

              {/* Ask Questions */}
              {aiText && (
                <Card>
                  <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:12 }}>💬 Ask Questions About This Exam</h3>

                  {/* Chat history */}
                  <div style={{ maxHeight:300, overflowY:'auto', marginBottom:12, display:'flex', flexDirection:'column', gap:10 }}>
                    {aiChat.filter(m => m.role !== 'system').map((m, i) => (
                      <div key={i} style={{
                        alignSelf: m.role==='user' ? 'flex-end' : 'flex-start',
                        maxWidth:'80%', padding:'10px 14px', borderRadius:12,
                        background: m.role==='user' ? 'var(--color-primary)' : 'var(--color-surface2)',
                        color: m.role==='user' ? 'white' : 'var(--color-text)',
                        fontSize:13, lineHeight:1.6
                      }}>
                        {m.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ alignSelf:'flex-start', padding:'10px 14px', borderRadius:12, background:'var(--color-surface2)', display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--color-text-muted)' }}>
                        <div className="spinner w-3 h-3" /> Thinking...
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="input" placeholder="e.g. Which students from CSE scored above 70%?"
                      value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && !chatLoading && askQuestion()}
                      style={{ flex:1, fontSize:13 }} />
                    <button onClick={askQuestion} disabled={chatLoading || !aiQuestion.trim()}
                      className="btn-primary" style={{ whiteSpace:'nowrap', fontSize:13 }}>
                      Ask →
                    </button>
                  </div>
                  <p style={{ fontSize:10, color:'var(--color-text-muted)', marginTop:6 }}>
                    Ask anything about the exam data — rankings, weak topics, department performance, integrity concerns etc.
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
