import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const PAGE_SIZE = 100

export default function QuestionAnalyticsPage() {
  const navigate = useNavigate()
  const { isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [allQuestions, setAllQuestions] = useState([])
  const [domain, setDomain] = useState('all')
  const [expandedTag, setExpandedTag] = useState(null)
  const [diffFilter, setDiffFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState([])

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const res = await api.get('/questions', { params: { limit: 5000 } })
      setAllQuestions(res.data.questions)
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  // Filter by domain
  const domainFiltered = allQuestions.filter(q => {
    if (domain === 'aptitude') return q.section === 'aptitude_reasoning'
    if (domain === 'verbal') return q.section === 'verbal'
    return true
  })

  // Build topic stats
  const topicStats = {}
  domainFiltered.forEach(q => {
    const key = q.tag || q.topic
    if (!topicStats[key]) {
      topicStats[key] = { tag: q.tag, topic: q.topic, section: q.section, easy: 0, medium: 0, hard: 0, total: 0, used: 0 }
    }
    topicStats[key][q.difficulty] = (topicStats[key][q.difficulty] || 0) + 1
    topicStats[key].total++
    topicStats[key].used += (q.usage_count || 0)
  })
  const topics = Object.values(topicStats).sort((a, b) => b.total - a.total)

  // Questions for expanded topic
  const topicQuestions = expandedTag ? domainFiltered.filter(q => (q.tag || q.topic) === expandedTag) : []
  const filteredQ = topicQuestions
    .filter(q => diffFilter === 'all' || q.difficulty === diffFilter)
    .filter(q => !search || q.question_text.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filteredQ.length / PAGE_SIZE)
  const pageQ = filteredQ.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (id) => {
    if (!confirm('Archive this question? It will be hidden from exams but recoverable.')) return
    setDeleting(id)
    try {
      await api.patch(`/questions/${id}`, { is_archived: true })
      toast.success('Question archived')
      setAllQuestions(prev => prev.filter(q => q.id !== id))
      setSelected(prev => prev.filter(s => s !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive')
    } finally { setDeleting(null) }
  }

  const handleBulkDelete = async () => {
    if (!selected.length) return
    if (!confirm(`Archive ${selected.length} questions?`)) return
    let done = 0
    for (const id of selected) {
      try {
        await api.patch(`/questions/${id}`, { is_archived: true })
        done++
      } catch {}
    }
    toast.success(`${done} questions archived`)
    setAllQuestions(prev => prev.filter(q => !selected.includes(q.id)))
    setSelected([])
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelected(pageQ.map(q => q.id))
  }

  const totalQ = domainFiltered.length
  const totalUsed = domainFiltered.reduce((s, q) => s + (q.usage_count || 0), 0)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/questions')} className="btn-secondary" style={{ padding: 8 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Question Bank Analytics</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {totalQ} questions · used {totalUsed} times total
            </p>
          </div>
        </div>
      </div>

      {/* Domain filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all','All Domains'], ['aptitude','Aptitude & Reasoning'], ['verbal','Verbal']].map(([val, label]) => (
          <button key={val} onClick={() => { setDomain(val); setExpandedTag(null); }}
            className={domain === val ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Total Questions', totalQ, 'var(--color-primary)'],
          ['Easy', domainFiltered.filter(q => q.difficulty === 'easy').length, 'var(--color-success)'],
          ['Medium', domainFiltered.filter(q => q.difficulty === 'medium').length, 'var(--color-warning)'],
          ['Hard', domainFiltered.filter(q => q.difficulty === 'hard').length, 'var(--color-danger)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '14px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Topic cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner w-10 h-10" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 20 }}>
          {topics.map(t => {
            const isExpanded = expandedTag === (t.tag || t.topic)
            return (
              <div key={t.tag || t.topic}
                className="card"
                style={{ cursor: 'pointer', border: isExpanded ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', padding: 14 }}
                onClick={() => {
                  setExpandedTag(isExpanded ? null : (t.tag || t.topic))
                  setPage(1)
                  setDiffFilter('all')
                  setSearch('')
                  setSelected([])
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>{t.topic}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {t.tag} · {t.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>E: {t.easy}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-warning)' }}>M: {t.medium}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-danger)' }}>H: {t.hard}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>Total: {t.total}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Used: {t.used}x</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Expanded topic questions */}
      {expandedTag && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 15 }}>
                {topicStats[expandedTag]?.topic} — {filteredQ.length} questions
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Difficulty filter */}
              {['all','easy','medium','hard'].map(d => (
                <button key={d} onClick={() => { setDiffFilter(d); setPage(1); }}
                  className={diffFilter === d ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}>
                  {d === 'all' ? 'All' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Search + bulk actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input className="input" style={{ paddingLeft: 30, fontSize: 12 }}
                placeholder="Search in this topic..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {isSuperAdmin && (
              <>
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={selectAll}>
                  Select All ({pageQ.length})
                </button>
                {selected.length > 0 && (
                  <button onClick={handleBulkDelete}
                    style={{ fontSize: 12, padding: '6px 12px', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={13} /> Archive {selected.length}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Questions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pageQ.map((q, i) => (
              <div key={q.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                background: selected.includes(q.id) ? 'var(--color-primary)10' : 'var(--color-surface2)',
                borderRadius: 8, border: `1px solid ${selected.includes(q.id) ? 'var(--color-primary)' : 'var(--color-border)'}`
              }}>
                {isSuperAdmin && (
                  <input type="checkbox" checked={selected.includes(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    style={{ marginTop: 3, flexShrink: 0 }} />
                )}
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 28, marginTop: 2 }}>
                  {(page - 1) * PAGE_SIZE + i + 1}.
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0, lineHeight: 1.5 }}>{q.question_text}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                      {q.difficulty}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Used: {q.usage_count || 0}x</span>
                    {q.is_locked && <span className="badge badge-warning" style={{ fontSize: 10 }}>Locked</span>}
                  </div>
                </div>
                {isSuperAdmin && (
                  <button onClick={() => handleDelete(q.id)} disabled={deleting === q.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4, flexShrink: 0 }}>
                    {deleting === q.id ? <div className="spinner w-4 h-4" /> : <Trash2 size={15} />}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredQ.length)} of {filteredQ.length}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p-1)} style={{ fontSize: 12 }}>Prev</button>
                <span style={{ padding: '4px 10px', fontSize: 12, color: 'var(--color-text)' }}>{page}/{totalPages}</span>
                <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p+1)} style={{ fontSize: 12 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
