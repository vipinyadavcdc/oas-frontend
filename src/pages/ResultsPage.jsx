import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, AlertTriangle, ArrowLeft, BarChart2, Target, Users, Search } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('results')
  const [missedQs, setMissedQs] = useState([])
  const [batches, setBatches] = useState([])
  const [filter, setFilter] = useState({ flagged: false, search: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [resRes, examRes] = await Promise.all([
        api.get('/results/' + id),
        api.get('/exams/' + id)
      ])
      setResults(resRes.data.results)
      setExam(examRes.data.exam)
      // Load extra tabs in background — don't block main results
      api.get('/results/' + id + '/most-missed').then(r => setMissedQs(r.data.questions || [])).catch(() => {})
      api.get('/results/' + id + '/batch-comparison').then(r => setBatches(r.data.batches || [])).catch(() => {})
    } catch { toast.error('Failed to load results') }
    finally { setLoading(false) }
  }

  const handleExport = () => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/results/' + id + '/export'
    const token = localStorage.getItem('cdc_token')
    fetch(url, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = (exam?.title || 'results') + '.xlsx'
        a.click()
        toast.success('Downloaded!')
      }).catch(() => toast.error('Export failed'))
  }

  const filtered = results.filter(r => {
    if (filter.flagged && !r.is_flagged) return false
    if (filter.search && !r.name?.toLowerCase().includes(filter.search.toLowerCase()) &&
        !r.roll_number?.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: results.length,
    submitted: results.filter(r => ['submitted','auto_submitted'].includes(r.status)).length,
    flagged: results.filter(r => r.is_flagged).length,
    avg: results.length ? (results.reduce((s,r) => s + parseFloat(r.percentage||0), 0) / results.length).toFixed(1) : 0
  }

  const TABS = [
    { key: 'results', label: 'Results', icon: Users },
    { key: 'missed',  label: 'Most Missed', icon: Target },
    { key: 'batch',   label: 'Batch Comparison', icon: BarChart2 }
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="btn-secondary p-2"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">Results</h1>
            {exam && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{exam.title} — 🔑 {exam.room_code}</p>}
          </div>
        </div>
        <button onClick={handleExport} className="btn-primary" style={{ background: 'var(--color-success)' }}>
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Students', value: stats.total, color: 'var(--color-primary)' },
          { label: 'Submitted', value: stats.submitted, color: 'var(--color-success)' },
          { label: 'Flagged', value: stats.flagged, color: 'var(--color-danger)' },
          { label: 'Avg Score', value: stats.avg + '%', color: 'var(--color-warning)' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--color-surface2)' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === key ? 'var(--color-surface)' : 'transparent',
              color: tab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
      ) : tab === 'results' ? (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input className="input pl-9 w-64" placeholder="Search name or roll..."
                     value={filter.search} onChange={e => setFilter({...filter, search: e.target.value})} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border"
                   style={{ borderColor: filter.flagged ? 'var(--color-danger)' : 'var(--color-border)', background: 'var(--color-surface)' }}>
              <input type="checkbox" checked={filter.flagged} onChange={e => setFilter({...filter, flagged: e.target.checked})} />
              <AlertTriangle size={14} style={{ color: 'var(--color-danger)' }} />
              <span className="text-sm" style={{ color: 'var(--color-danger)' }}>Flagged Only</span>
            </label>
          </div>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>#</th><th>Student</th><th>Roll No</th><th>Dept/Sec</th>
                  <th>Score</th><th>%</th><th>Apt</th><th>Verbal</th>
                  <th>Correct</th><th>Wrong</th><th>Time</th><th>Violations</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} style={{ background: r.is_flagged ? '#fff5f5' : undefined }}>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-text-muted)' }}>{i+1}</td>
                      <td>
                        <button onClick={() => navigate('/students/' + r.roll_number)}
                          className="font-medium text-sm hover:underline text-left" style={{ color: 'var(--color-primary)' }}>
                          {r.name}
                        </button>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.university}</div>
                      </td>
                      <td className="font-mono text-xs">{r.roll_number}</td>
                      <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{r.department}/{r.section}</td>
                      <td className="font-bold font-mono" style={{ color: 'var(--color-primary)' }}>{r.final_score||0}/{r.max_score||0}</td>
                      <td><span className="font-bold" style={{ color: parseFloat(r.percentage||0)>=50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {parseFloat(r.percentage||0).toFixed(1)}%
                      </span></td>
                      <td className="font-mono text-xs">{parseFloat(r.aptitude_score||0).toFixed(1)}</td>
                      <td className="font-mono text-xs">{parseFloat(r.verbal_score||0).toFixed(1)}</td>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-success)' }}>{r.correct||0}</td>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-danger)' }}>{r.incorrect||0}</td>
                      <td className="text-xs">{r.time_taken_seconds ? Math.round(r.time_taken_seconds/60)+'m' : '—'}</td>
                      <td>{r.is_flagged
                        ? <span className="badge badge-danger">⚠️ {r.tab_switches||0}t</span>
                        : <span className="badge badge-success">Clean</span>}
                      </td>
                      <td><span className={`badge ${r.status==='submitted'?'badge-success':r.status==='auto_submitted'?'badge-warning':'badge-gray'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : tab === 'missed' ? (
        <div className="card">
          <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>Most Missed Questions</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Sorted by lowest accuracy — improve teaching focus</p>
          {missedQs.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No data yet — available after students submit</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Question</th><th>Topic</th><th>Section</th><th>Attempts</th><th>Correct</th><th>Wrong</th><th>Accuracy</th><th>Avg Time</th></tr></thead>
                <tbody>
                  {missedQs.map((q, i) => (
                    <tr key={q.id}>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-text-muted)' }}>{i+1}</td>
                      <td className="text-sm max-w-xs"><p className="line-clamp-2" style={{ color: 'var(--color-text)' }}>{q.question_text}</p></td>
                      <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{q.topic}</td>
                      <td><span className="badge badge-info text-xs">{q.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}</span></td>
                      <td className="font-mono text-sm">{q.total_attempts||0}</td>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-success)' }}>{q.correct_count||0}</td>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-danger)' }}>{q.wrong_count||0}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
                            <div className="h-full rounded-full" style={{
                              width: (q.accuracy_pct||0)+'%',
                              background: parseFloat(q.accuracy_pct||0)<40 ? 'var(--color-danger)' : parseFloat(q.accuracy_pct||0)<70 ? 'var(--color-warning)' : 'var(--color-success)'
                            }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: parseFloat(q.accuracy_pct||0)<40 ? 'var(--color-danger)' : 'var(--color-text)' }}>{q.accuracy_pct||0}%</span>
                        </div>
                      </td>
                      <td className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{q.avg_time_secs ? q.avg_time_secs+'s' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>Batch / Section Comparison</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Performance by department and section</p>
          {batches.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No data yet — available after students submit</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Department</th><th>Section</th><th>University</th><th>Students</th><th>Avg %</th><th>Avg Aptitude</th><th>Avg Verbal</th><th>Top Score</th><th>Flagged</th></tr></thead>
                <tbody>
                  {batches.map((b, i) => (
                    <tr key={i}>
                      <td className="font-medium text-sm">{b.department}</td>
                      <td className="font-mono text-sm">{b.section}</td>
                      <td><span className="badge badge-gray">{b.university}</span></td>
                      <td className="font-mono text-sm">{b.student_count}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
                            <div className="h-full rounded-full" style={{ width: (b.avg_percentage||0)+'%', background: 'var(--color-primary)' }} />
                          </div>
                          <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>{b.avg_percentage||0}%</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{parseFloat(b.avg_aptitude||0).toFixed(1)}</td>
                      <td className="font-mono text-sm">{parseFloat(b.avg_verbal||0).toFixed(1)}</td>
                      <td className="font-mono text-sm" style={{ color: 'var(--color-success)' }}>{parseFloat(b.top_score||0).toFixed(1)}%</td>
                      <td>{parseInt(b.flagged_count||0)>0 ? <span className="badge badge-danger">{b.flagged_count}</span> : <span className="badge badge-success">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
