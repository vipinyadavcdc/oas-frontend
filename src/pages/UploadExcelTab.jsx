// CDC OAS — Upload Excel Analysis Component
// Handles: OAS export, SHL raw, Combined Summary, Unknown formats
// Premium AI report with charts for higher management

import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

// ── Format detection keywords ─────────────────────────────────────────────────
const detectFormat = (headers) => {
  const h = headers.map(c => String(c || '').toLowerCase())
  if (h.some(c => c.includes('participant id')))    return 'OAS'
  if (h.some(c => c.includes('participant status'))) return 'SHL_RAW'
  if (h.some(c => c.includes('total (100)')) ||
      h.some(c => c.includes('grand total')))        return 'COMBINED'
  return 'UNKNOWN'
}

// ── Extract domain name from SHL column ──────────────────────────────────────
const extractDomain = (col) => {
  const m = col.match(/_(Aptitude|Verbal|Technical|SoftSkill|Soft Skills?)\(Score\)/i)
  return m ? m[1] : null
}

// ── Parse OAS format ──────────────────────────────────────────────────────────
const parseOAS = (rows, headers) => {
  const idx = (name) => headers.findIndex(h =>
    String(h||'').toLowerCase().includes(name.toLowerCase()))

  const nameI  = idx('Student Name')
  const rollI  = idx('Roll Number')
  const deptI  = idx('Department')
  const pctI   = idx('Percentage')
  const aptI   = idx('Aptitude Score')
  const verI   = idx('Verbal Score')
  const flagI  = idx('Flag Status')
  const violI  = idx('Total Violations')

  const domains = []
  if (aptI >= 0) domains.push({ name: 'Aptitude', idx: aptI, max: 100 })
  if (verI >= 0) domains.push({ name: 'Verbal',   idx: verI, max: 100 })

  const students = rows.map(row => ({
    name:       row[nameI] || '',
    roll:       row[rollI] || '',
    department: row[deptI] || '',
    percentage: parseFloat(row[pctI]) || 0,
    domains:    Object.fromEntries(domains.map(d => [d.name, parseFloat(row[d.idx]) || 0])),
    flagged:    String(row[flagI]||'').includes('FLAG'),
    violations: parseInt(row[violI]) || 0,
  })).filter(s => s.name && s.roll)

  return { students, domains, format: 'OAS', maxTotal: 100 }
}

// ── Parse SHL Raw format ──────────────────────────────────────────────────────
const parseSHL = (rows, headers) => {
  const nameI = headers.findIndex(h => h === 'StudentName')
  const rollI = headers.findIndex(h => h === 'RollNo')
  const sectI = headers.findIndex(h => h === 'Section')
  const deptI = headers.findIndex(h => h === 'Department')
  const uniI  = headers.findIndex(h => h === 'University')
  const focI  = headers.findIndex(h => h === 'offFocusCount')

  // Find score columns
  const scoreCols = headers.map((h, i) => ({ h: String(h||''), i }))
    .filter(({h}) => h.includes('(Score)') && !h.includes('subsection'))
  const domains = scoreCols.map(({h, i}) => {
    const domain = extractDomain(h)
    return domain ? { name: domain, idx: i, max: 100 } : null
  }).filter(Boolean)

  const students = rows.map(row => {
    const scores = {}
    let total = 0
    domains.forEach(d => {
      const v = parseFloat(row[d.idx]) || 0
      scores[d.name] = v
      total += v
    })
    return {
      name:       String(row[nameI] || ''),
      roll:       String(row[rollI] || ''),
      section:    String(row[sectI] || ''),
      department: String(row[deptI] || ''),
      university: String(row[uniI]  || ''),
      domains:    scores,
      total:      total,
      percentage: domains.length > 0 ? (total / (domains.length * 100)) * 100 : 0,
      violations: parseInt(row[focI]) || 0,
      flagged:    (parseInt(row[focI]) || 0) > 5,
    }
  }).filter(s => s.name && s.roll && s.name !== 'undefined')

  return { students, domains, format: 'SHL_RAW', maxTotal: domains.length * 100 }
}

// ── Parse Combined Summary format (your university sheet) ─────────────────────
const parseCombined = (allRows) => {
  // Row 0 = section headers, Row 1 = domain headers, Row 2 = max marks
  // Student data from row 3
  const row0 = allRows[0] || []
  const row1 = allRows[1] || []
  const row2 = allRows[2] || []

  // Find column indices
  const rollI  = 1
  const nameI  = 2

  // Build domain structure from row1
  const domains = []
  const domainNames = ['Apti', 'Verbal', 'Tech', 'SoftSkill', 'Softskill']
  const domainMap   = { 'Apti': 'Aptitude', 'Verbal': 'Verbal', 'Tech': 'Technical', 'SoftSkill': 'SoftSkill', 'Softskill': 'SoftSkill' }

  // Find total column (last column)
  const totalI = allRows[0].length - 1

  // Map section columns
  // Mid Term columns: 5-9, CE1: 10-13, CE2: 14-17, CE combined: 18-21, Internal: 21, End Term: 22-26, Total: 27
  const sections = [
    { name: 'Mid Term',  startCol: 5,  domains: ['Aptitude','Verbal','Technical','SoftSkill'], totalCol: 9,  max: 30 },
    { name: 'CE 1',      startCol: 10, domains: ['Aptitude','Verbal','Technical'],             totalCol: 13, max: 15 },
    { name: 'CE 2',      startCol: 14, domains: ['Aptitude','Verbal','Technical'],             totalCol: 17, max: 15 },
    { name: 'CE Total',  startCol: 18, domains: ['A+V+T','SoftSkill'],                        totalCol: 20, max: 20 },
    { name: 'Internal',  startCol: 21, domains: ['Total'],                                    totalCol: 21, max: 50 },
    { name: 'End Term',  startCol: 22, domains: ['Aptitude','Verbal','Technical','SoftSkill'], totalCol: 26, max: 50 },
  ]

  const students = []
  for (let r = 3; r < allRows.length; r++) {
    const row = allRows[r]
    if (!row[rollI] || !row[nameI]) continue
    const roll = String(row[rollI] || '')
    const name = String(row[nameI] || '')
    if (!roll || roll === 'nan' || name === 'Module->' || name === 'Marks->') continue

    const sectionScores = {}
    sections.forEach(sec => {
      const total = parseFloat(row[sec.totalCol])
      sectionScores[sec.name] = {
        total:  isNaN(total) ? null : total,
        max:    sec.max,
        absent: String(row[sec.totalCol] || '').includes('AB') || String(row[sec.totalCol] || '').includes('ABSENT'),
      }
    })

    const grandTotal   = parseFloat(row[totalI])
    const internalTotal = parseFloat(row[21])

    students.push({
      name,
      roll,
      grand_total:    isNaN(grandTotal) ? null : grandTotal,
      internal_total: isNaN(internalTotal) ? null : internalTotal,
      sections:       sectionScores,
      absent:         String(row[4] || '').toLowerCase().includes('absent'),
      detained:       String(row[totalI] || '').toUpperCase() === 'DB',
      percentage:     isNaN(grandTotal) ? null : grandTotal,
    })
  }

  // Derive domains from sections
  const uniqueDomains = []
  const midTermDomains = ['Aptitude','Verbal','Technical','SoftSkill']
  midTermDomains.forEach(d => {
    const hasData = students.some(s => {
      const mt = s.sections['Mid Term']
      return mt && !mt.absent
    })
    if (hasData) uniqueDomains.push({ name: d, max: 100 })
  })

  return { students, domains: uniqueDomains, format: 'COMBINED', maxTotal: 100, sections }
}

// ── Mini Bar Chart SVG ────────────────────────────────────────────────────────
const MiniBarChart = ({ data, colors, height = 120 }) => {
  if (!data || !data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.max(20, Math.min(50, 280 / data.length))
  const gap  = 6
  const total = data.length * (barW + gap)

  return (
    <svg viewBox={`0 0 ${total + 20} ${height + 40}`} style={{ width:'100%', maxWidth:500 }}>
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / max) * height)
        const x  = 10 + i * (barW + gap)
        const y  = height - bh + 5
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh}
              fill={colors[i % colors.length]} rx={3} opacity={0.85} />
            <text x={x + barW/2} y={y - 4} textAnchor="middle"
              fontSize={10} fill="#374151" fontWeight="600">
              {typeof d.value === 'number' ? d.value.toFixed(1) : d.value}
            </text>
            <text x={x + barW/2} y={height + 18} textAnchor="middle"
              fontSize={9} fill="#6b7280">
              {d.label.length > 8 ? d.label.slice(0,8) + '..' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Donut Chart SVG ───────────────────────────────────────────────────────────
const DonutChart = ({ passed, failed, absent, size = 120 }) => {
  const total  = passed + failed + absent
  if (!total) return null
  const cx = size/2, cy = size/2, r = size/2 - 10, ir = r * 0.55
  const segments = [
    { val: passed, color: '#22c55e', label: 'Passed' },
    { val: failed, color: '#ef4444', label: 'Failed' },
    { val: absent, color: '#9ca3af', label: 'Absent' },
  ].filter(s => s.val > 0)

  let angle = -90
  const paths = segments.map(seg => {
    const pct   = seg.val / total
    const start = angle
    angle += pct * 360
    const s1x = cx + r * Math.cos(start * Math.PI/180)
    const s1y = cy + r * Math.sin(start * Math.PI/180)
    const e1x = cx + r * Math.cos((angle-0.1) * Math.PI/180)
    const e1y = cy + r * Math.sin((angle-0.1) * Math.PI/180)
    const s2x = cx + ir * Math.cos((angle-0.1) * Math.PI/180)
    const s2y = cy + ir * Math.sin((angle-0.1) * Math.PI/180)
    const e2x = cx + ir * Math.cos(start * Math.PI/180)
    const e2y = cy + ir * Math.sin(start * Math.PI/180)
    const large = pct > 0.5 ? 1 : 0
    return { path: `M${s1x},${s1y} A${r},${r} 0 ${large} 1 ${e1x},${e1y} L${s2x},${s2y} A${ir},${ir} 0 ${large} 0 ${e2x},${e2y} Z`, color: seg.color, label: seg.label, val: seg.val, pct: Math.round(pct*100) }
  })

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <svg width={size} height={size}>
        {paths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={12} fontWeight="700" fill="#111">{Math.round(passed/total*100)}%</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill="#6b7280">Pass Rate</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {paths.map((p,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:p.color, flexShrink:0 }} />
            <span style={{ color:'#374151' }}>{p.label}: {p.val} ({p.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Score Distribution Chart ──────────────────────────────────────────────────
const DistributionChart = ({ students, scoreKey = 'percentage', cutoff = 40 }) => {
  const scores = students.map(s => parseFloat(s[scoreKey])).filter(v => !isNaN(v) && v >= 0)
  if (!scores.length) return null

  const buckets = [
    { label: '0-20',   min:0,  max:20  },
    { label: '20-40',  min:20, max:40  },
    { label: '40-60',  min:40, max:60  },
    { label: '60-80',  min:60, max:80  },
    { label: '80-100', min:80, max:101 },
  ]
  const data = buckets.map(b => ({
    label: b.label,
    value: scores.filter(s => s >= b.min && s < b.max).length,
    color: b.min >= cutoff ? '#22c55e' : '#ef4444'
  }))

  return <MiniBarChart data={data} colors={data.map(d => d.color)} height={100} />
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UploadExcelTab() {
  const [file,         setFile]         = useState(null)
  const [sheets,       setSheets]       = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [parsed,       setParsed]       = useState(null)
  const [mapping,      setMapping]      = useState(null)
  const [confirmed,    setConfirmed]    = useState(false)
  const [cutoff,       setCutoff]       = useState(40)
  const [aiText,       setAiText]       = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiQuestion,   setAiQuestion]   = useState('')
  const [aiChat,       setAiChat]       = useState([])
  const [chatLoading,  setChatLoading]  = useState(false)
  const [step,         setStep]         = useState(1) // 1=upload, 2=confirm, 3=report
  const [dragging,     setDragging]     = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [loadingMsg,   setLoadingMsg]   = useState(0)
  const aiRef       = useRef(null)
  const timerRef    = useRef(null)
  const msgTimerRef = useRef(null)

  const LOADING_MESSAGES = [
    '📊 Reading exam data...',
    '🧮 Calculating performance statistics...',
    '🏫 Analysing domain-wise scores...',
    '📈 Identifying trends and patterns...',
    '🔍 Evaluating at-risk students...',
    '✍️ Drafting executive summary...',
    '📋 Preparing recommendations...',
    '🎯 Finalising management report...',
  ]
  const fileRef = useRef(null)

  // ── Read Excel using SheetJS ──────────────────────────────────────────────
  const readExcel = useCallback(async (f) => {
    setFile(f)
    setStep(1)
    setParsed(null)
    setConfirmed(false)
    setAiText('')
    setAiChat([])

    try {
      const { read, utils } = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const buf  = await f.arrayBuffer()
      const wb   = read(buf)
      const sheetNames = wb.SheetNames

      setSheets(sheetNames.map(name => {
        const ws      = wb.Sheets[name]
        const rawData = utils.sheet_to_json(ws, { header:1, defval:'' })
        return { name, rawData }
      }))

      // Auto-select best sheet
      const best = sheetNames.find(n =>
        n.toLowerCase().includes('combined') ||
        n.toLowerCase().includes('shl') ||
        n.toLowerCase().includes('result') ||
        n.toLowerCase().includes('midterm') ||
        n.toLowerCase().includes('marks')
      ) || sheetNames[0]

      setSelectedSheet(best)
      processSheet(sheetNames.map(name => {
        const ws      = wb.Sheets[name]
        const rawData = utils.sheet_to_json(ws, { header:1, defval:'' })
        return { name, rawData }
      }), best)

    } catch (err) {
      console.error(err)
      toast.error('Failed to read Excel. Please check the file format.')
    }
  }, [])

  const processSheet = (allSheets, sheetName) => {
    const sheetData = allSheets.find(s => s.name === sheetName)
    if (!sheetData) return
    const rows    = sheetData.rawData
    if (!rows.length) return

    const headers = rows[0]
    const format  = detectFormat(headers)
    let result

    try {
      if (format === 'OAS') {
        result = parseOAS(rows.slice(1), headers)
      } else if (format === 'SHL_RAW') {
        result = parseSHL(rows.slice(1), headers)
      } else if (format === 'COMBINED') {
        result = parseCombined(rows)
      } else {
        // Unknown — build mapping UI
        result = { students: [], domains: [], format: 'UNKNOWN', headers, rawRows: rows }
      }
      setParsed(result)
      buildMapping(result, headers, format)
      setStep(2)
    } catch (err) {
      console.error(err)
      toast.error('Could not parse this sheet. Try another sheet.')
    }
  }

  const buildMapping = (result, headers, format) => {
    const m = {
      format,
      studentCount: result.students?.length || 0,
      domains:      result.domains || [],
      hasViolations: result.students?.some(s => s.violations > 0) || false,
      hasSections:   result.sections?.length > 0 || false,
      maxTotal:      result.maxTotal || 100,
    }
    setMapping(m)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      readExcel(f)
    } else {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
    }
  }

  // ── Compute stats ─────────────────────────────────────────────────────────
  const getStats = () => {
    if (!parsed || !parsed.students) return null
    const students = parsed.students

    const withScores = students.filter(s =>
      s.percentage !== null && !isNaN(s.percentage) && !s.detained && !s.absent
    )
    const scores  = withScores.map(s => parseFloat(s.percentage) || parseFloat(s.grand_total) || 0)
    const avg     = scores.length ? scores.reduce((a,b) => a+b, 0) / scores.length : 0
    const passed  = scores.filter(s => s >= cutoff).length
    const failed  = scores.filter(s => s < cutoff).length
    const absent  = students.filter(s => s.absent || s.detained).length
    const highest = scores.length ? Math.max(...scores) : 0
    const lowest  = scores.length ? Math.min(...scores) : 0

    // Domain averages
    const domainAvgs = {}
    if (parsed.domains?.length && students[0]?.domains) {
      parsed.domains.forEach(d => {
        const vals = students.map(s => parseFloat(s.domains?.[d.name])).filter(v => !isNaN(v) && v >= 0)
        domainAvgs[d.name] = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0
      })
    }

    // Section averages (Combined format)
    const sectionAvgs = {}
    if (parsed.sections && students[0]?.sections) {
      parsed.sections.forEach(sec => {
        const vals = students.map(s => s.sections?.[sec.name]?.total).filter(v => v !== null && !isNaN(v) && v >= 0)
        sectionAvgs[sec.name] = { avg: vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0, max: sec.max }
      })
    }

    return { total: students.length, withScores: withScores.length, avg, passed, failed, absent, highest, lowest, domainAvgs, sectionAvgs, scores }
  }

  // ── Generate AI Report ────────────────────────────────────────────────────
  const generateReport = async (confirmedOverride = false) => {
    if (!parsed || (!confirmed && !confirmedOverride)) return

    // Set ALL loading states synchronously before any async work
    setStep(3)
    setAiLoading(true)
    setAiText('')
    setAiChat([])
    setElapsed(0)
    setLoadingMsg(0)

    // Use setTimeout so React renders the loading screen BEFORE we start the API call
    await new Promise(resolve => setTimeout(resolve, 100))

    // Start elapsed timer
    const start = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Cycle through loading messages every 3 seconds
    let msgIdx = 0
    msgTimerRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % 8
      setLoadingMsg(msgIdx)
    }, 3000)

    const stats = getStats()
    if (!stats) { setAiLoading(false); return }

    const domainStr = Object.entries(stats.domainAvgs)
      .map(([d, avg]) => `${d}: ${avg.toFixed(1)}%`).join(', ')

    const sectionStr = Object.entries(stats.sectionAvgs)
      .map(([s, v]) => `${s}: ${v.avg.toFixed(1)}/${v.max} (${(v.avg/v.max*100).toFixed(1)}%)`).join('\n')

    const prompt = `You are a senior academic analyst preparing a formal report for the management of Manav Rachna Educational Institutions (MREI), India.

Generate a COMPREHENSIVE, PROFESSIONAL executive report based on this exam data:

FILE: ${file?.name}
FORMAT: ${parsed.format === 'COMBINED' ? 'University Combined Result Sheet' : parsed.format === 'SHL_RAW' ? 'SHL Assessment Data' : 'Platform Export'}
TOTAL STUDENTS: ${stats.total}
STUDENTS WITH SCORES: ${stats.withScores}
ABSENT/DETAINED: ${stats.absent}
CUTOFF: ${cutoff}%

PERFORMANCE SUMMARY:
- Average Score: ${stats.avg.toFixed(1)}%
- Highest Score: ${stats.highest.toFixed(1)}%
- Lowest Score: ${stats.lowest.toFixed(1)}%
- Passed (≥${cutoff}%): ${stats.passed} students (${(stats.passed/stats.withScores*100).toFixed(1)}%)
- Failed (<${cutoff}%): ${stats.failed} students (${(stats.failed/stats.withScores*100).toFixed(1)}%)

${domainStr ? `DOMAIN-WISE PERFORMANCE:\n${domainStr}` : ''}

${sectionStr ? `SECTION-WISE PERFORMANCE:\n${sectionStr}` : ''}

SCORE DISTRIBUTION:
- 0-20%:   ${stats.scores.filter(s => s < 20).length} students
- 20-40%:  ${stats.scores.filter(s => s >= 20 && s < 40).length} students
- 40-60%:  ${stats.scores.filter(s => s >= 40 && s < 60).length} students
- 60-80%:  ${stats.scores.filter(s => s >= 60 && s < 80).length} students
- 80-100%: ${stats.scores.filter(s => s >= 80).length} students

${stats.withScores > 0 ? `AT-RISK STUDENTS (below ${cutoff}%): ${stats.failed} (${(stats.failed/stats.withScores*100).toFixed(1)}%)` : ''}

Generate a formal management report with these sections. Use specific numbers throughout:

## 1. EXECUTIVE SUMMARY
(3-4 sentences summarising overall performance for senior management)

## 2. KEY PERFORMANCE INDICATORS
(Bullet points with the most important metrics)

## 3. DETAILED PERFORMANCE ANALYSIS
${domainStr ? '### Domain-wise Analysis\n(Compare each domain, identify strongest and weakest)' : ''}
${sectionStr ? '### Section-wise Analysis\n(Mid Term vs CE vs End Term trends)' : ''}
### Score Distribution Analysis
(Interpret what the distribution tells us)

## 4. AREAS OF CONCERN
(Specific weaknesses that need attention, with numbers)

## 5. POSITIVE HIGHLIGHTS
(What the batch did well)

## 6. RISK ASSESSMENT
(Students at risk, absent students, overall readiness for placements)

## 7. STRATEGIC RECOMMENDATIONS
(5-7 specific, actionable recommendations for training team and management)

## 8. CONCLUSION
(2-3 sentences closing summary for management)

---
Note: Be specific, professional, and constructive. Use precise numbers. Avoid generic statements. This report will be presented to the Dean and HODs.`

    try {
      const token  = localStorage.getItem('cdc_token')
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/analysis/ai-report'

      const response = await fetch(apiUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        let errMsg = `Server error ${response.status}`
        try { errMsg = JSON.parse(errText).error || errMsg } catch {}
        throw new Error(errMsg)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      console.log('[AI] Stream started, reading...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) { console.log('[AI] Stream done'); break }
        const raw = decoder.decode(value)
        console.log('[AI] Raw chunk:', raw.slice(0, 200))
        const lines = raw.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            if (line.includes('[DONE]')) { console.log('[AI] DONE received'); break }
            const json = JSON.parse(line.slice(6))
            if (json.error) throw new Error(json.error)
            if (json.text) {
              full += json.text
              setAiText(full)
              if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight
            }
          } catch (e) {
            console.log('[AI] Parse error:', e.message, 'line:', line.slice(0,100))
            if (e.message && !e.message.includes('JSON') && !e.message.includes('Unexpected')) throw e
          }
        }
      }
      console.log('[AI] Full text length:', full.length)
      setAiChat([{ role: 'system', stats, fileName: file?.name }])
    } catch (err) {
      toast.error('AI report failed: ' + (err.message || 'Please try again.'))
      console.error('AI error:', err)
    } finally {
      setAiLoading(false)
      clearInterval(timerRef.current)
      clearInterval(msgTimerRef.current)
    }
  }

  // ── Ask question ──────────────────────────────────────────────────────────
  const askQuestion = async () => {
    if (!aiQuestion.trim() || !aiChat.length) return
    const q = aiQuestion.trim()
    setAiQuestion('')
    setChatLoading(true)
    const stats = aiChat[0]?.stats

    const history = aiChat.filter(m => m.role !== 'system')
    const msgs = [
      { role: 'user', content: `Context: Exam data with ${stats?.total} students, avg ${stats?.avg?.toFixed(1)}%, pass rate ${stats?.passed && stats?.withScores ? (stats.passed/stats.withScores*100).toFixed(1) : 'N/A'}%. Question: ${q}` },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ]
    if (history.length > 0) { msgs.shift(); msgs.unshift({ role: 'user', content: q }) }

    setAiChat(prev => [...prev, { role: 'user', content: q }])

    try {
      const token2  = localStorage.getItem('cdc_token')
      const chatPrompt = msgs.filter(m => m.role !== 'system').map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant:'
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analysis/ai-report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
          body: JSON.stringify({ prompt: chatPrompt })
        }
      )

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   answer  = ''

      setAiChat(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            if (line.includes('[DONE]')) break
            const json = JSON.parse(line.slice(6))
            if (json.text) {
              answer += json.text
              setAiChat(prev => { const u = [...prev]; u[u.length-1] = { role:'assistant', content: answer }; return u })
            }
          } catch {}
        }
      }
    } catch { toast.error('Question failed.') }
    finally { setChatLoading(false) }
  }

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!aiText) return toast.error('Generate report first')
    const stats = getStats()
    const win = window.open('', '_blank')
    const domainBars = stats?.domainAvgs ? Object.entries(stats.domainAvgs).map(([d, avg]) => `
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="font-weight:600">${d}</span>
          <span>${avg.toFixed(1)}%</span>
        </div>
        <div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${avg}%;background:${avg>=stats.avg?'#2563eb':'#ef4444'};border-radius:5px"></div>
        </div>
      </div>`).join('') : ''

    win.document.write(`<!DOCTYPE html><html><head>
      <title>CDC Analysis Report — ${file?.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin:0; padding:0; color:#111; }
        .cover { background:linear-gradient(135deg,#1e3a8a,#1d4ed8); color:white; padding:60px 50px; min-height:200px; }
        .cover h1 { font-size:28px; margin:0 0 8px; font-weight:800; }
        .cover p  { margin:4px 0; opacity:0.85; font-size:14px; }
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; padding:30px 50px; background:#f8fafc; border-bottom:2px solid #e2e8f0; }
        .stat-box { background:white; padding:16px; border-radius:10px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .stat-val  { font-size:28px; font-weight:800; }
        .stat-lbl  { font-size:11px; color:#64748b; margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .content   { padding:30px 50px; }
        h2 { color:#1e3a8a; font-size:18px; margin:28px 0 10px; padding-bottom:6px; border-bottom:2px solid #1e3a8a; }
        h3 { color:#374151; font-size:15px; margin:18px 0 8px; }
        p  { font-size:13px; line-height:1.7; margin:6px 0; color:#374151; }
        li { font-size:13px; line-height:1.7; color:#374151; }
        .chart-section { background:#f8fafc; padding:20px 24px; border-radius:10px; margin:16px 0; }
        .bar-group { margin-bottom:10px; }
        .bar-label { font-size:12px; color:#374151; font-weight:600; margin-bottom:3px; }
        .bar-outer { height:12px; background:#e5e7eb; border-radius:6px; overflow:hidden; }
        .bar-inner { height:100%; border-radius:6px; }
        .donut-row { display:flex; gap:20px; align-items:center; flex-wrap:wrap; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size:12px; margin-bottom:4px; }
        .legend-dot { width:12px; height:12px; border-radius:3px; }
        .footer { background:#1e3a8a; color:white; padding:20px 50px; font-size:11px; opacity:0.9; margin-top:40px; }
        .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
        .badge-green { background:#dcfce7; color:#16a34a; }
        .badge-red   { background:#fee2e2; color:#dc2626; }
        @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
      </style>
    </head><body>
      <div class="cover">
        <div style="font-size:12px;opacity:0.7;margin-bottom:16px;letter-spacing:1px">CAREER DEVELOPMENT CENTRE — MREI</div>
        <h1>Exam Performance Analysis Report</h1>
        <p>${file?.name?.replace('.xlsx','').replace('.xls','')}</p>
        <p style="margin-top:16px;font-size:12px">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})} &nbsp;|&nbsp; Cutoff: ${cutoff}% &nbsp;|&nbsp; Total Students: ${stats?.total}</p>
        <div style="margin-top:20px;font-size:11px;opacity:0.6">CONFIDENTIAL — FOR INTERNAL USE ONLY</div>
      </div>

      <div class="stats-grid">
        ${[
          ['Total Students', stats?.total, '#2563eb'],
          ['Average Score',  `${stats?.avg?.toFixed(1)}%`, '#7c3aed'],
          ['Pass Rate',      `${stats?.withScores ? (stats.passed/stats.withScores*100).toFixed(1) : 0}%`, '#16a34a'],
          ['At Risk',        stats?.failed, '#dc2626'],
        ].map(([l,v,c]) => `<div class="stat-box"><div class="stat-val" style="color:${c}">${v}</div><div class="stat-lbl">${l}</div></div>`).join('')}
      </div>

      ${domainBars ? `<div style="padding:20px 50px 0"><div class="chart-section"><h3 style="margin-top:0">Domain Performance</h3>${domainBars}</div></div>` : ''}

      <div class="chart-section" style="margin:0 50px">
        <h3 style="margin-top:0">Score Distribution</h3>
        <div class="donut-row">
          ${[
            ['0–20%',   stats?.scores?.filter(s=>s<20).length,                    '#dc2626'],
            ['20–40%',  stats?.scores?.filter(s=>s>=20&&s<40).length,             '#f97316'],
            ['40–60%',  stats?.scores?.filter(s=>s>=40&&s<60).length,             '#eab308'],
            ['60–80%',  stats?.scores?.filter(s=>s>=60&&s<80).length,             '#22c55e'],
            ['80–100%', stats?.scores?.filter(s=>s>=80).length,                   '#2563eb'],
          ].map(([l,v,c]) => `
            <div style="flex:1;min-width:80px">
              <div style="font-size:11px;color:#6b7280;margin-bottom:4px">${l}</div>
              <div style="font-size:18px;font-weight:800;color:${c}">${v}</div>
              <div style="font-size:10px;color:#9ca3af">${stats?.withScores ? (v/stats.withScores*100).toFixed(0) : 0}%</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="content">
        ${aiText.split('\n').map(line => {
          if (line.startsWith('## '))  return `<h2>${line.slice(3)}</h2>`
          if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
          if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.slice(2).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`
          if (line.startsWith('**') && line.endsWith('**')) return `<p><strong>${line.slice(2,-2)}</strong></p>`
          if (line.trim() === '---') return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">`
          if (line.trim() === '') return '<br>'
          return `<p>${line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</p>`
        }).join('')}
      </div>

      <div class="footer">
        Career Development Centre &nbsp;|&nbsp; Manav Rachna Educational Institutions<br>
        This report is confidential and intended for authorised personnel only.
      </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  // ── Export Word ───────────────────────────────────────────────────────────
  const exportWord = () => {
    if (!aiText) return toast.error('Generate report first')
    const stats = getStats()
    const content = `CAREER DEVELOPMENT CENTRE — MREI
EXAM PERFORMANCE ANALYSIS REPORT
=====================================
File: ${file?.name}
Date: ${new Date().toLocaleDateString('en-IN')}
Cutoff: ${cutoff}%
CONFIDENTIAL — FOR INTERNAL USE ONLY
=====================================

KEY METRICS
-----------
Total Students:  ${stats?.total}
Average Score:   ${stats?.avg?.toFixed(1)}%
Highest Score:   ${stats?.highest?.toFixed(1)}%
Lowest Score:    ${stats?.lowest?.toFixed(1)}%
Passed:          ${stats?.passed} (${stats?.withScores?(stats.passed/stats.withScores*100).toFixed(1):0}%)
Failed:          ${stats?.failed}
Absent/Detained: ${stats?.absent}

${Object.keys(stats?.domainAvgs||{}).length ? `DOMAIN AVERAGES\n---------------\n${Object.entries(stats.domainAvgs).map(([d,a]) => `${d}: ${a.toFixed(1)}%`).join('\n')}\n` : ''}

FULL REPORT
-----------
${aiText.replace(/\*\*/g,'').replace(/#{1,3} /g,'\n').replace(/`/g,'')}

=====================================
Career Development Centre
Manav Rachna Educational Institutions
Confidential — For Internal Use Only`

    const blob = new Blob([content], { type: 'application/msword' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `CDC_Report_${file?.name?.replace(/\.[^.]+$/, '')}_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render markdown ───────────────────────────────────────────────────────
  const renderMD = (text) => text?.split('\n').map((line, i) => {
    if (line.startsWith('## '))  return <h2 key={i} style={{ color:'#1e3a8a', fontSize:16, fontWeight:800, margin:'20px 0 8px', paddingBottom:6, borderBottom:'2px solid #e2e8f0' }}>{line.slice(3)}</h2>
    if (line.startsWith('### ')) return <h3 key={i} style={{ color:'#374151', fontSize:14, fontWeight:700, margin:'14px 0 6px' }}>{line.slice(4)}</h3>
    if (line.startsWith('- ') || line.startsWith('* '))
      return <div key={i} style={{ paddingLeft:16, fontSize:13, color:'#374151', lineHeight:1.7, marginBottom:3 }}>• {line.slice(2).replace(/\*\*(.+?)\*\*/g, (_, m) => m)}</div>
    if (line.trim() === '---') return <hr key={i} style={{ border:'none', borderTop:'1px solid #e5e7eb', margin:'12px 0' }} />
    if (line.trim() === '')    return <div key={i} style={{ height:6 }} />
    return <p key={i} style={{ fontSize:13, color:'#374151', lineHeight:1.7, margin:'3px 0' }}>{line.replace(/\*\*(.+?)\*\*/g, (_, m) => <strong key={m}>{m}</strong>)}</p>
  })

  const stats = parsed ? getStats() : null

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'grid', gap:16 }}>

      {/* Upload Zone */}
      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <h3 style={{ fontWeight:700, fontSize:15, color:'var(--color-text)', margin:0 }}>📤 Upload Excel Result File</h3>
            <p style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>
              Supports: OAS Export · SHL Assessment · University Combined Sheet · Any Excel
            </p>
          </div>
          {file && (
            <button onClick={() => { setFile(null); setParsed(null); setConfirmed(false); setAiText(''); setStep(1) }}
              style={{ fontSize:12, color:'var(--color-danger)', background:'none', border:'1px solid var(--color-danger)', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
              × Clear
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border:`2px dashed ${dragging ? '#2563eb' : file ? '#22c55e' : 'var(--color-border)'}`,
            borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer',
            background: dragging ? '#eff6ff' : file ? '#f0fdf4' : 'var(--color-surface2)',
            transition:'all 0.2s'
          }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }}
            onChange={e => e.target.files[0] && readExcel(e.target.files[0])} />
          <div style={{ fontSize:36, marginBottom:8 }}>{file ? '✅' : '📊'}</div>
          {file ? (
            <div>
              <div style={{ fontWeight:700, color:'#16a34a', fontSize:14 }}>{file.name}</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>
                {parsed?.students?.length || 0} students · {mapping?.format} format
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight:600, color:'var(--color-text)', fontSize:14 }}>Drop Excel file here</div>
              <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>or click to browse</div>
            </div>
          )}
        </div>

        {/* Sheet selector */}
        {sheets.length > 1 && (
          <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:'var(--color-text-muted)', fontWeight:600 }}>Sheet:</span>
            <select value={selectedSheet}
              onChange={e => { setSelectedSheet(e.target.value); processSheet(sheets, e.target.value) }}
              style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:13 }}>
              {sheets.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Step 2 — Confirm Mapping */}
      {step >= 2 && mapping && parsed && (
        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:20 }}>
          <h3 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)', marginBottom:16 }}>
            🔍 Detected Data — Please Confirm
          </h3>

          {/* Detection summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
            {[
              ['Format',   mapping.format === 'COMBINED' ? 'Combined Sheet' : mapping.format === 'SHL_RAW' ? 'SHL Assessment' : mapping.format === 'OAS' ? 'OAS Platform' : 'Auto-mapped', '📋'],
              ['Students', parsed.students?.length || 0, '👥'],
              ['Domains',  mapping.domains?.length || 0, '📊'],
              ['Max Score', mapping.maxTotal || 100, '🎯'],
            ].map(([l, v, icon]) => (
              <div key={l} style={{ background:'var(--color-surface2)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:16 }}>{icon}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--color-primary)', marginTop:4 }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--color-text-muted)', fontWeight:600 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Domains found */}
          {mapping.domains?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--color-text-muted)', marginBottom:6 }}>DOMAINS DETECTED:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {mapping.domains.map(d => (
                  <span key={d.name} style={{ padding:'3px 10px', borderRadius:20, background:'var(--color-primary)20', color:'var(--color-primary)', fontSize:12, fontWeight:600 }}>
                    ✅ {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick preview */}
          {stats && (
            <div style={{ background:'var(--color-surface2)', borderRadius:8, padding:12, marginBottom:16, fontSize:12 }}>
              <div style={{ fontWeight:700, color:'var(--color-text)', marginBottom:6 }}>Quick Preview:</div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap', color:'var(--color-text-muted)' }}>
                <span>Avg: <strong style={{ color:'var(--color-primary)' }}>{stats.avg.toFixed(1)}</strong></span>
                <span>Highest: <strong style={{ color:'var(--color-success)' }}>{stats.highest.toFixed(1)}</strong></span>
                <span>Lowest: <strong style={{ color:'var(--color-danger)' }}>{stats.lowest.toFixed(1)}</strong></span>
                <span>Absent: <strong style={{ color:'var(--color-warning)' }}>{stats.absent}</strong></span>
              </div>
            </div>
          )}

          {/* Cutoff */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:13, color:'var(--color-text)', fontWeight:600 }}>Pass Cutoff %:</span>
            <input type="number" min={1} max={100} value={cutoff}
              onChange={e => setCutoff(parseInt(e.target.value)||40)}
              style={{ width:70, padding:'6px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:14, fontWeight:700, textAlign:'center' }} />
            <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>Students below this % are considered failed</span>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setConfirmed(true); generateReport(true) }}
              style={{ padding:'10px 24px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              ✨ Confirm & Generate AI Report
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Charts + AI Report */}
      {step >= 3 && (
        <>
          {/* Loading Screen — shown while AI is generating */}
          {aiLoading && !aiText && (
            <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:'50px 20px', textAlign:'center' }}>
              <div style={{ fontSize:52, animation:'pulse 1.5s ease-in-out infinite', marginBottom:16 }}>🤖</div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--color-text)', marginBottom:8 }}>
                {LOADING_MESSAGES[loadingMsg]}
              </div>
              <div style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:20 }}>
                ⏱ {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed/60)}m ${elapsed%60}s`} elapsed
              </div>
              <div style={{ width:'100%', maxWidth:320, height:6, background:'var(--color-surface2)', borderRadius:3, overflow:'hidden', margin:'0 auto 20px' }}>
                <div style={{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,#2563eb,#7c3aed)', animation:'progressSlide 2s ease-in-out infinite', width:'60%' }} />
              </div>
              <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:16 }}>
                {LOADING_MESSAGES.map((_, i) => (
                  <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < loadingMsg ? '#2563eb' : i === loadingMsg ? '#7c3aed' : 'var(--color-border)', transition:'all 0.3s', transform: i === loadingMsg ? 'scale(1.4)' : 'scale(1)' }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:'var(--color-text-muted)' }}>Generating a comprehensive management report. This usually takes 15–25 seconds.</div>
            </div>
          )}

          {/* Stats Dashboard — shown once we have data */}
          {(!aiLoading || aiText) && stats && <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', color:'white', padding:'20px 24px' }}>
              <div style={{ fontSize:11, opacity:0.7, letterSpacing:1, marginBottom:6 }}>CAREER DEVELOPMENT CENTRE — MREI</div>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Exam Performance Dashboard</div>
              <div style={{ fontSize:12, opacity:0.8 }}>{file?.name} &nbsp;·&nbsp; Cutoff: {cutoff}% &nbsp;·&nbsp; {stats?.total} Students</div>
            </div>

            <div style={{ padding:20 }}>
              {/* KPI row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10, marginBottom:20 }}>
                {[
                  ['Total',    stats.total,                                                         '#2563eb'],
                  ['Average',  `${stats.avg.toFixed(1)}%`,                                          '#7c3aed'],
                  ['Passed',   `${stats.withScores?(stats.passed/stats.withScores*100).toFixed(0):0}%`, '#16a34a'],
                  ['Failed',   stats.failed,                                                         '#dc2626'],
                  ['Highest',  `${stats.highest.toFixed(0)}%`,                                      '#16a34a'],
                  ['Absent',   stats.absent,                                                         '#f59e0b'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'var(--color-surface2)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
                    <div style={{ fontSize:10, color:'var(--color-text-muted)', fontWeight:600, marginTop:3, textTransform:'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display:'grid', gridTemplateColumns: stats.domainAvgs && Object.keys(stats.domainAvgs).length ? '1fr 1fr' : '1fr', gap:16, marginBottom:16 }}>

                {/* Donut chart */}
                <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Pass / Fail Distribution</div>
                  <DonutChart passed={stats.passed} failed={stats.failed} absent={stats.absent} size={110} />
                </div>

                {/* Domain bar chart */}
                {stats.domainAvgs && Object.keys(stats.domainAvgs).length > 0 && (
                  <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Domain-wise Averages (%)</div>
                    <MiniBarChart
                      data={Object.entries(stats.domainAvgs).map(([d,a]) => ({ label:d, value: parseFloat(a.toFixed(1)) }))}
                      colors={['#2563eb','#16a34a','#f59e0b','#7c3aed']}
                      height={90}
                    />
                  </div>
                )}
              </div>

              {/* Score distribution */}
              <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:16, marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Score Distribution</div>
                <DistributionChart students={parsed.students} scoreKey={parsed.format==='COMBINED'?'grand_total':'percentage'} cutoff={cutoff} />
              </div>

              {/* Section performance (Combined format) */}
              {stats.sectionAvgs && Object.keys(stats.sectionAvgs).length > 0 && (
                <div style={{ background:'var(--color-surface2)', borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>Section-wise Performance</div>
                  {Object.entries(stats.sectionAvgs).map(([sec, {avg, max}]) => {
                    const pct = max > 0 ? (avg/max*100) : 0
                    return (
                      <div key={sec} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                          <span style={{ fontWeight:600, color:'var(--color-text)' }}>{sec}</span>
                          <span style={{ color:'var(--color-text-muted)' }}>{avg.toFixed(1)}/{max} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height:8, background:'var(--color-border)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background: pct >= cutoff ? '#22c55e' : '#ef4444', borderRadius:4 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>}

          {/* AI Report */}
          <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div>
                <h3 style={{ fontWeight:700, fontSize:15, color:'var(--color-text)', margin:0 }}>🤖 AI Analysis Report</h3>
                <p style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>Powered by Claude AI — streaming in real time</p>
              </div>
              {aiText && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={exportPDF} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                    📄 Export PDF
                  </button>
                  <button onClick={exportWord} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--color-surface)', color:'var(--color-text)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                    📝 Export Word
                  </button>
                </div>
              )}
            </div>

            <div ref={aiRef} style={{ background:'var(--color-surface2)', borderRadius:10, padding:20, minHeight:200, maxHeight:520, overflowY:'auto', border:'1px solid var(--color-border)', marginBottom:16 }}>
              {aiLoading && !aiText && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:20 }}>
                  {/* Pulsing brain icon */}
                  <div style={{ fontSize:48, animation:'pulse 1.5s ease-in-out infinite' }}>🤖</div>

                  {/* Loading message */}
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--color-text)', textAlign:'center', minHeight:24 }}>
                    {LOADING_MESSAGES[loadingMsg]}
                  </div>

                  {/* Elapsed time */}
                  <div style={{ fontSize:13, color:'var(--color-text-muted)' }}>
                    ⏱ {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed/60)}m ${elapsed%60}s`} elapsed
                  </div>

                  {/* Progress bar — animated */}
                  <div style={{ width:'100%', maxWidth:320, height:6, background:'var(--color-surface2)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:3,
                      background:'linear-gradient(90deg, #2563eb, #7c3aed)',
                      animation:'progressSlide 2s ease-in-out infinite',
                      width:'60%'
                    }} />
                  </div>

                  {/* Steps indicator */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', maxWidth:400 }}>
                    {LOADING_MESSAGES.map((msg, i) => (
                      <div key={i} style={{
                        width:8, height:8, borderRadius:'50%',
                        background: i < loadingMsg ? '#2563eb' : i === loadingMsg ? '#7c3aed' : 'var(--color-border)',
                        transition:'all 0.3s',
                        transform: i === loadingMsg ? 'scale(1.4)' : 'scale(1)'
                      }} />
                    ))}
                  </div>

                  <div style={{ fontSize:11, color:'var(--color-text-muted)', textAlign:'center' }}>
                    Generating a comprehensive management report.<br/>This usually takes 15–25 seconds.
                  </div>
                </div>
              )}
              {aiText && renderMD(aiText)}
              {aiLoading && aiText && (
                <span style={{ display:'inline-block', width:8, height:16, background:'#2563eb', borderRadius:2, animation:'blink 0.7s infinite', marginLeft:2 }} />
              )}
            </div>

            {/* Q&A */}
            {aiText && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--color-text)', marginBottom:10 }}>💬 Ask Questions About This Data</div>
                <div style={{ maxHeight:250, overflowY:'auto', marginBottom:10, display:'flex', flexDirection:'column', gap:8 }}>
                  {aiChat.filter(m => m.role !== 'system').map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role==='user'?'flex-end':'flex-start',
                      maxWidth:'80%', padding:'8px 12px', borderRadius:10,
                      background: m.role==='user'?'#2563eb':'var(--color-surface2)',
                      color: m.role==='user'?'white':'var(--color-text)', fontSize:13
                    }}>{m.content}</div>
                  ))}
                  {chatLoading && (
                    <div style={{ alignSelf:'flex-start', padding:'8px 12px', borderRadius:10, background:'var(--color-surface2)', fontSize:13, color:'var(--color-text-muted)', display:'flex', gap:6 }}>
                      <div className="spinner w-3 h-3" /> Thinking...
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input className="input" placeholder="e.g. Which section performed best? Who are the top 5 students?"
                    value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !chatLoading && askQuestion()}
                    style={{ flex:1, fontSize:13 }} />
                  <button onClick={askQuestion} disabled={chatLoading || !aiQuestion.trim()}
                    style={{ padding:'8px 16px', background:'#2563eb', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                    Ask →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
  @keyframes progressSlide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(80%); }
    100% { transform: translateX(200%); }
  }
`}</style>
    </div>
  )
}
