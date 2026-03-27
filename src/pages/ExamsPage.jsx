import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Activity, BarChart2, Copy, Send, Clock, Users, Trash2,
         Edit, StopCircle, EyeOff, Eye, Timer, KeyRound, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const STATUS_BADGE = {
  draft:     'badge-gray',
  published: 'badge-info',
  live:      'badge-success',
  ended:     'badge-warning'
}

const EXAM_TYPES   = ['All', 'CE', 'Mid Term', 'End Term', 'Practice']
const UNIVERSITIES = ['Both', 'MRIIRS', 'MRU']
const STATUSES     = ['draft', 'published', 'live', 'ended']

export default function ExamsPage() {
  const navigate = useNavigate()
  const { isMasterAdmin, isSuperAdmin } = useAuth()

  const [exams,       setExams]       = useState([])
  const [trainers,    setTrainers]    = useState([])
  const [loading,     setLoading]     = useState(true)

  // Filters
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState('All')
  const [uniFilter,      setUniFilter]      = useState('Both')
  const [statusFilters,  setStatusFilters]  = useState([])   // multi-select
  const [trainerFilter,  setTrainerFilter]  = useState('all')
  const [sortBy,         setSortBy]         = useState('newest')

  // UI state
  const [shownMasterCodes, setShownMasterCodes] = useState({})
  const [deleteConfirm,    setDeleteConfirm]    = useState(null)
  const [deleteText,       setDeleteText]       = useState('')
  const [deleting,         setDeleting]         = useState(false)
  const [extendModal,      setExtendModal]      = useState(null)
  const [extendMins,       setExtendMins]       = useState(10)
  const [extending,        setExtending]        = useState(false)

  useEffect(() => {
    loadExams()
    loadTrainers()
  }, [])

  const loadExams = async () => {
    setLoading(true)
    try {
      const res = await api.get('/exams')
      setExams(res.data.exams)
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false) }
  }

  const loadTrainers = async () => {
    try {
      const res = await api.get('/trainers')
      setTrainers(res.data.trainers || [])
    } catch {}
  }

  // ── FILTERING + SORTING ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...exams]

    // Search
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(s) ||
        e.room_code.toLowerCase().includes(s)
      )
    }

    // Exam type
    if (typeFilter !== 'All') {
      list = list.filter(e => e.exam_type === typeFilter)
    }

    // University
    if (uniFilter !== 'Both') {
      list = list.filter(e => e.university === uniFilter || e.university === 'BOTH')
    }

    // Status multi-select
    if (statusFilters.length > 0) {
      list = list.filter(e => statusFilters.includes(e.status))
    }

    // Trainer
    if (trainerFilter !== 'all') {
      list = list.filter(e => e.trainer_id === trainerFilter)
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest')   return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'az')       return a.title.localeCompare(b.title)
      if (sortBy === 'students') return (b.student_count || 0) - (a.student_count || 0)
      return 0
    })

    return list
  }, [exams, search, typeFilter, uniFilter, statusFilters, trainerFilter, sortBy])

  // ── COUNTS FOR TABS ────────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts = { All: exams.length }
    EXAM_TYPES.slice(1).forEach(t => {
      counts[t] = exams.filter(e => e.exam_type === t).length
    })
    return counts
  }, [exams])

  const statusCounts = useMemo(() => {
    const counts = {}
    STATUSES.forEach(s => { counts[s] = exams.filter(e => e.status === s).length })
    return counts
  }, [exams])

  // Stats bar
  const liveCount      = exams.filter(e => e.status === 'live').length
  const draftCount     = exams.filter(e => e.status === 'draft').length
  const endedCount     = exams.filter(e => e.status === 'ended').length
  const publishedCount = exams.filter(e => e.status === 'published').length

  // Toggle status multi-select
  const toggleStatus = (s) => {
    setStatusFilters(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const handlePublish = async (id) => {
    try { await api.post(`/exams/${id}/publish`); toast.success('Exam published!'); loadExams() }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to publish') }
  }

  const handleUnpublish = async (id) => {
    try { await api.patch(`/exams/${id}`, { status: 'draft' }); toast.success('Moved to draft'); loadExams() }
    catch { toast.error('Failed to unpublish') }
  }

  const handleClone = async (id) => {
    try { await api.post(`/exams/${id}/clone`); toast.success('Exam cloned!'); loadExams() }
    catch { toast.error('Failed to clone') }
  }

  const handleEndExam = async (id) => {
    if (!confirm('End this exam? All active students will be auto-submitted immediately.')) return
    try {
      await api.post(`/exams/${id}/force-submit-all`)
      await api.patch(`/exams/${id}`, { status: 'ended' })
      toast.success('Exam ended — all students submitted')
      loadExams()
    } catch { toast.error('Failed to end exam') }
  }

  const handleDelete = async () => {
    if (deleteText !== 'DELETE') return toast.error('Type DELETE to confirm')
    setDeleting(true)
    try {
      await api.delete(`/exams/${deleteConfirm.id}`)
      toast.success('Exam permanently deleted')
      setDeleteConfirm(null); setDeleteText('')
      loadExams()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleExtendTime = async () => {
    if (!extendMins || extendMins < 1) return toast.error('Enter valid minutes')
    setExtending(true)
    try {
      await api.post(`/exams/${extendModal.id}/extend-time`, { minutes: extendMins })
      toast.success(`+${extendMins} minutes added to all active students!`)
      setExtendModal(null); setExtendMins(10)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to extend time') }
    finally { setExtending(false) }
  }

  const handleEdit = async (exam) => {
    if (exam.status === 'published') {
      if (!confirm('Editing will move exam back to draft. Continue?')) return
      try { await api.patch(`/exams/${exam.id}`, { status: 'draft' }) }
      catch { toast.error('Failed to unpublish'); return }
    }
    navigate(`/exams/${exam.id}/edit`)
  }

  // ── TAB BUTTON COMPONENT ───────────────────────────────────────────────────
  const TabBtn = ({ label, active, onClick, count, color }) => (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      border: `1.5px solid ${active ? (color || 'var(--color-primary)') : 'var(--color-border)'}`,
      background: active ? (color || 'var(--color-primary)') + '18' : 'var(--color-surface)',
      color: active ? (color || 'var(--color-primary)') : 'var(--color-text-muted)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
      transition: 'all 0.15s'
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? (color || 'var(--color-primary)') : 'var(--color-surface2)',
          color: active ? 'white' : 'var(--color-text-muted)',
          borderRadius: 10, padding: '0px 6px', fontSize: 10, fontWeight: 700
        }}>{count}</span>
      )}
    </button>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {exams.length} total exams
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/exams/create')}>
          <Plus size={18} /> Create Exam
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[
          ['📋', 'Total',     exams.length,    'var(--color-text-muted)'],
          ['🟢', 'Live',      liveCount,        'var(--color-success)'],
          ['📄', 'Published', publishedCount,   'var(--color-primary)'],
          ['✏️', 'Draft',     draftCount,       'var(--color-warning)'],
          ['✅', 'Ended',     endedCount,       'var(--color-text-muted)'],
        ].map(([icon, label, val, color]) => (
          <div key={label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '8px 16px', display:'flex', alignItems:'center', gap:8
          }}>
            <span style={{ fontSize:14 }}>{icon}</span>
            <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>{label}</span>
            <span style={{ fontSize:16, fontWeight:700, color }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom:16, padding:'14px 16px' }}>

        {/* Row 1: Search + Sort */}
        <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }} />
            <input className="input" style={{ paddingLeft:32, height:34, fontSize:13 }}
              placeholder="Search exams or room code..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width:160, height:34, fontSize:13 }}
            value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A → Z</option>
            <option value="students">Most Students</option>
          </select>
          {/* Created By dropdown */}
          <select className="input" style={{ width:170, height:34, fontSize:13 }}
            value={trainerFilter} onChange={e => setTrainerFilter(e.target.value)}>
            <option value="all">All Trainers</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Exam Type tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--color-text-muted)', fontWeight:600, marginRight:4 }}>TYPE</span>
          {EXAM_TYPES.map(t => (
            <TabBtn key={t} label={t} count={typeCounts[t]}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
              color="var(--color-primary)" />
          ))}
        </div>

        {/* Row 3: University tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--color-text-muted)', fontWeight:600, marginRight:4 }}>UNI</span>
          {UNIVERSITIES.map(u => (
            <TabBtn key={u} label={u}
              active={uniFilter === u}
              onClick={() => setUniFilter(u)}
              color="var(--color-warning)" />
          ))}
        </div>

        {/* Row 4: Status multi-select tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--color-text-muted)', fontWeight:600, marginRight:4 }}>STATUS</span>
          <TabBtn label="All" active={statusFilters.length === 0}
            onClick={() => setStatusFilters([])} color="var(--color-text-muted)" />
          {STATUSES.map(s => (
            <TabBtn key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
              count={statusCounts[s]}
              active={statusFilters.includes(s)}
              onClick={() => toggleStatus(s)}
              color={s === 'live' ? 'var(--color-success)' : s === 'draft' ? 'var(--color-warning)' : s === 'published' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
          ))}
          {statusFilters.length > 0 && (
            <button onClick={() => setStatusFilters([])}
              style={{ fontSize:11, color:'var(--color-danger)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {(search || typeFilter !== 'All' || uniFilter !== 'Both' || statusFilters.length > 0 || trainerFilter !== 'all') && (
        <p style={{ fontSize:12, color:'var(--color-text-muted)', marginBottom:12 }}>
          Showing {filtered.length} of {exams.length} exams
        </p>
      )}

      {/* Exam List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>No exams found</p>
          <p style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:16 }}>
            Try adjusting your filters
          </p>
          <button className="btn-primary mt-4 mx-auto" onClick={() => navigate('/exams/create')}>
            <Plus size={16} /> Create Exam
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(exam => (
            <div key={exam.id} className="card hover:shadow-md transition-shadow" style={{ padding:'14px 16px' }}>

              {/* Top row — title + badges */}
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                {/* Live pulse dot */}
                {exam.status === 'live' && (
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--color-success)', display:'inline-block', boxShadow:'0 0 0 2px #22c55e40', animation:'pulse 1.5s infinite' }} />
                )}
                <h3 style={{ fontWeight:700, fontSize:15, color:'var(--color-text)', margin:0 }}>{exam.title}</h3>
                <span className={`badge ${STATUS_BADGE[exam.status]}`}>{exam.status}</span>
                <span className="badge badge-info">{exam.exam_type}</span>
                <span className="badge badge-gray">{exam.university}</span>
              </div>

              {/* Middle row — codes + meta */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', fontSize:12, color:'var(--color-text-muted)', marginBottom:10 }}>
                {/* Room Code */}
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--color-primary)' }}>🔑 {exam.room_code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(exam.room_code); toast.success('Room code copied!') }}
                    style={{ fontSize:10, padding:'1px 6px', borderRadius:4, border:'1px solid var(--color-border)', background:'var(--color-surface2)', cursor:'pointer', color:'var(--color-text-muted)' }}>
                    Copy
                  </button>
                </span>

                {/* Master Code */}
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <KeyRound size={11} style={{ color:'var(--color-warning)' }} />
                  <span style={{ fontWeight:700, color:'var(--color-warning)' }}>Master:</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--color-warning)', letterSpacing:1 }}>
                    {shownMasterCodes[exam.id] ? (exam.master_room_code || '—') : '•••••'}
                  </span>
                  <button onClick={() => setShownMasterCodes(p => ({ ...p, [exam.id]: !p[exam.id] }))}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:1, color:'var(--color-text-muted)' }}>
                    {shownMasterCodes[exam.id] ? <EyeOff size={11}/> : <Eye size={11}/>}
                  </button>
                  {shownMasterCodes[exam.id] && exam.master_room_code && (
                    <button onClick={() => { navigator.clipboard.writeText(exam.master_room_code); toast.success('Master code copied!') }}
                      style={{ fontSize:10, padding:'1px 6px', borderRadius:4, border:'1px solid var(--color-border)', background:'var(--color-surface2)', cursor:'pointer', color:'var(--color-text-muted)' }}>
                      Copy
                    </button>
                  )}
                </span>

                <span style={{ display:'flex', alignItems:'center', gap:3 }}><Clock size={12}/> {exam.duration_minutes} min</span>
                <span>📝 {exam.total_questions} Q</span>
                <span style={{ display:'flex', alignItems:'center', gap:3 }}><Users size={12}/> {exam.student_count || 0}</span>
                <span>by {exam.trainer_name}</span>
                <span>{formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}</span>

                {/* Section times */}
                {exam.aptitude_time_minutes > 0 && (
                  <span style={{ color:'var(--color-primary)' }}>🧮 Apt: {exam.aptitude_time_minutes}min</span>
                )}
                {exam.verbal_time_minutes > 0 && (
                  <span style={{ color:'var(--color-warning)' }}>📝 Ver: {exam.verbal_time_minutes}min</span>
                )}
              </div>

              {/* Share link */}
              {exam.status !== 'draft' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <code style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'var(--color-surface2)', color:'var(--color-text-muted)', fontFamily:'monospace' }}>
                    {window.location.origin}/exam
                  </code>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/exam'); toast.success('Link copied!') }}
                    style={{ fontSize:11, padding:'2px 8px', borderRadius:4, border:'1px solid var(--color-border)', background:'var(--color-surface)', cursor:'pointer', color:'var(--color-text-muted)' }}>
                    Copy Link
                  </button>
                </div>
              )}

              {/* ── ACTIONS — horizontal row ── */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:10, borderTop:'1px solid var(--color-border)' }}>

                {exam.status === 'live' && (
                  <button onClick={() => navigate(`/exams/${exam.id}/monitor`)} className="btn-primary"
                    style={{ fontSize:12, padding:'5px 12px', background:'var(--color-success)' }}>
                    <Activity size={13}/> Live Monitor
                  </button>
                )}

                {exam.status === 'draft' && (
                  <button onClick={() => handlePublish(exam.id)} className="btn-primary"
                    style={{ fontSize:12, padding:'5px 12px', background:'var(--color-primary)' }}>
                    <Send size={13}/> Publish
                  </button>
                )}

                {['draft','published'].includes(exam.status) && (
                  <button onClick={() => handleEdit(exam)} className="btn-secondary"
                    style={{ fontSize:12, padding:'5px 12px' }}>
                    <Edit size={13}/> Edit
                  </button>
                )}

                {exam.status === 'published' && isSuperAdmin && (
                  <button onClick={() => handleUnpublish(exam.id)} className="btn-secondary"
                    style={{ fontSize:12, padding:'5px 12px' }}>
                    <EyeOff size={13}/> Unpublish
                  </button>
                )}

                {exam.status === 'live' && isSuperAdmin && (
                  <button onClick={() => setExtendModal(exam)} className="btn-secondary"
                    style={{ fontSize:12, padding:'5px 12px' }}>
                    <Timer size={13}/> Extend Time
                  </button>
                )}

                {exam.status === 'live' && isSuperAdmin && (
                  <button onClick={() => handleEndExam(exam.id)} className="btn-secondary"
                    style={{ fontSize:12, padding:'5px 12px', color:'var(--color-danger)' }}>
                    <StopCircle size={13}/> End Exam
                  </button>
                )}

                <button onClick={() => navigate(`/exams/${exam.id}/results`)} className="btn-secondary"
                  style={{ fontSize:12, padding:'5px 12px' }}>
                  <BarChart2 size={13}/> Results
                </button>

                <button onClick={() => handleClone(exam.id)} className="btn-secondary"
                  style={{ fontSize:12, padding:'5px 12px' }}>
                  <Copy size={13}/> Clone
                </button>

                {isMasterAdmin && (
                  <button onClick={() => { setDeleteConfirm(exam); setDeleteText('') }}
                    className="btn-secondary"
                    style={{ fontSize:12, padding:'5px 12px', color:'var(--color-danger)', borderColor:'var(--color-danger)' }}>
                    <Trash2 size={13}/> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.7)' }}>
          <div className="card" style={{ width:'100%', maxWidth:440, border:'2px solid var(--color-danger)' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>⚠️</div>
              <h3 style={{ fontWeight:700, fontSize:18, color:'var(--color-danger)', marginBottom:6 }}>Permanently Delete Exam</h3>
              <p style={{ fontSize:13, color:'var(--color-text)', marginBottom:4 }}><strong>{deleteConfirm.title}</strong></p>
              <p style={{ fontSize:12, color:'var(--color-text-muted)' }}>
                This will delete the exam, all {deleteConfirm.student_count || 0} student sessions, answers and results. <strong>Cannot be undone.</strong>
              </p>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, color:'var(--color-text)', display:'block', marginBottom:6 }}>
                Type <strong style={{ color:'var(--color-danger)' }}>DELETE</strong> to confirm:
              </label>
              <input className="input" placeholder="Type DELETE here"
                value={deleteText} onChange={e => setDeleteText(e.target.value)}
                style={{ borderColor: deleteText === 'DELETE' ? 'var(--color-danger)' : 'var(--color-border)', fontWeight:700, letterSpacing:2 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setDeleteConfirm(null); setDeleteText('') }} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteText !== 'DELETE' || deleting}
                style={{ flex:1, padding:'8px 16px', background: deleteText === 'DELETE' ? 'var(--color-danger)' : 'var(--color-border)', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor: deleteText === 'DELETE' ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {deleting ? <div className="spinner w-4 h-4" /> : <Trash2 size={14}/>} Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Time Modal */}
      {extendModal && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.7)' }}>
          <div className="card" style={{ width:'100%', maxWidth:380 }}>
            <h3 style={{ fontWeight:700, fontSize:17, color:'var(--color-text)', marginBottom:4 }}>⏱️ Extend Time</h3>
            <p style={{ fontSize:13, color:'var(--color-text-muted)', marginBottom:16 }}>
              Add extra minutes to ALL active students in <strong>{extendModal.title}</strong>
            </p>
            <div style={{ marginBottom:16 }}>
              <label className="label">Extra minutes to add</label>
              <input type="number" className="input" min={1} max={60} value={extendMins}
                onChange={e => setExtendMins(parseInt(e.target.value) || 0)}
                style={{ fontSize:24, fontWeight:700, textAlign:'center' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setExtendModal(null)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleExtendTime} disabled={extending || extendMins < 1}
                className="btn-primary" style={{ flex:1, justifyContent:'center' }}>
                {extending ? <div className="spinner w-4 h-4" /> : <Timer size={14}/>} Add {extendMins} Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation for live exams */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2px #22c55e40; }
          50%       { opacity: 0.7; box-shadow: 0 0 0 5px #22c55e20; }
        }
      `}</style>
    </div>
  )
}
