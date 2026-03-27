import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Activity, BarChart2, Copy, Send, Clock, Users, Trash2, Edit, StopCircle, EyeOff, Eye, Timer, KeyRound } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const STATUS_BADGE = { draft: 'badge-gray', published: 'badge-info', live: 'badge-success', ended: 'badge-warning' }

export default function ExamsPage() {
  const navigate = useNavigate()
  const { isMasterAdmin, isSuperAdmin } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // exam to delete
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [extendModal, setExtendModal] = useState(null) // exam to extend
  const [extendMins, setExtendMins] = useState(10)
  const [extending, setExtending] = useState(false)
  const [shownMasterCodes, setShownMasterCodes] = useState({})

  useEffect(() => { loadExams() }, [statusFilter])

  const loadExams = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/exams', { params })
      setExams(res.data.exams)
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false) }
  }

  const handlePublish = async (id) => {
    try { await api.post(`/exams/${id}/publish`); toast.success('Exam published!'); loadExams() }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to publish') }
  }

  const handleUnpublish = async (id) => {
    try {
      await api.patch(`/exams/${id}`, { status: 'draft' })
      toast.success('Exam moved back to draft')
      loadExams()
    } catch { toast.error('Failed to unpublish') }
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
      setDeleteConfirm(null)
      setDeleteText('')
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
      setExtendModal(null)
      setExtendMins(10)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to extend time') }
    finally { setExtending(false) }
  }

  const handleEdit = async (exam) => {
    // If published, warn and auto-unpublish
    if (exam.status === 'published') {
      if (!confirm('Editing a published exam will move it back to draft. Students won\'t be able to join until you republish. Continue?')) return
      try {
        await api.patch(`/exams/${exam.id}`, { status: 'draft' })
        toast.success('Exam moved to draft — now editing')
      } catch { toast.error('Failed to unpublish'); return }
    }
    navigate(`/exams/${exam.id}/edit`)
  }

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(filter.toLowerCase()) ||
    e.room_code.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{exams.length} total exams</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/exams/create')}>
          <Plus size={18} /> Create Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input className="input pl-9" placeholder="Search exams or room code..."
            value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>No exams found</p>
          <button className="btn-primary mt-4 mx-auto" onClick={() => navigate('/exams/create')}>
            <Plus size={16} /> Create First Exam
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(exam => (
            <div key={exam.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>{exam.title}</h3>
                    <span className={`badge ${STATUS_BADGE[exam.status]}`}>{exam.status}</span>
                    <span className="badge badge-info">{exam.exam_type}</span>
                    <span className="badge badge-gray">{exam.university}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    {/* Room Code */}
                    <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>🔑 {exam.room_code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(exam.room_code); toast.success('Room code copied!') }}
                      className="btn-secondary" style={{ fontSize:10, padding:'1px 6px' }}>Copy</button>
                    {/* Master Code — hidden by default */}
                    <span style={{ display:'flex', alignItems:'center', gap:4, marginLeft:4 }}>
                      <KeyRound size={12} style={{ color:'var(--color-warning)' }} />
                      <span style={{ fontSize:12, color:'var(--color-warning)', fontWeight:700 }}>Master:</span>
                      <span className="font-mono font-bold" style={{ color:'var(--color-warning)', letterSpacing:2, minWidth:50 }}>
                        {shownMasterCodes[exam.id] ? (exam.master_room_code || '—') : '•••••'}
                      </span>
                      <button
                        onClick={() => setShownMasterCodes(prev => ({ ...prev, [exam.id]: !prev[exam.id] }))}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'var(--color-text-muted)' }}>
                        {shownMasterCodes[exam.id] ? <EyeOff size={12}/> : <Eye size={12}/>}
                      </button>
                      {shownMasterCodes[exam.id] && exam.master_room_code && (
                        <button onClick={() => { navigator.clipboard.writeText(exam.master_room_code); toast.success('Master code copied!') }}
                          className="btn-secondary" style={{ fontSize:10, padding:'1px 6px' }}>Copy</button>
                      )}
                    </span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration_minutes} min</span>
                    <span>📝 {exam.total_questions} questions</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {exam.student_count || 0} students</span>
                    <span>by {exam.trainer_name}</span>
                    <span>{formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}</span>
                  </div>
                  {/* Section times */}
                  {(exam.aptitude_time_minutes > 0 || exam.verbal_time_minutes > 0) && (
                    <div className="flex gap-2 mt-1">
                      {exam.aptitude_time_minutes > 0 && <span style={{ fontSize:11, color:'var(--color-primary)' }}>🧮 Apt: {exam.aptitude_time_minutes}min</span>}
                      {exam.verbal_time_minutes > 0 && <span style={{ fontSize:11, color:'var(--color-warning)' }}>📝 Ver: {exam.verbal_time_minutes}min</span>}
                    </div>
                  )}
                  {/* Share link */}
                  {exam.status !== 'draft' && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs px-2 py-1 rounded font-mono"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text-muted)' }}>
                        {window.location.origin}/exam
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/exam'); toast.success('Link copied!') }}
                        className="text-xs px-2 py-1 rounded btn-secondary">Copy Link</button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0" style={{ minWidth: 140 }}>
                  {/* Live Monitor */}
                  {exam.status === 'live' && (
                    <button onClick={() => navigate(`/exams/${exam.id}/monitor`)} className="btn-primary text-sm">
                      <Activity size={14} /> Live Monitor
                    </button>
                  )}

                  {/* Publish */}
                  {exam.status === 'draft' && (
                    <button onClick={() => handlePublish(exam.id)} className="btn-primary text-sm"
                      style={{ background: 'var(--color-success)' }}>
                      <Send size={14} /> Publish
                    </button>
                  )}

                  {/* Edit — draft or published only */}
                  {['draft', 'published'].includes(exam.status) && (
                    <button onClick={() => handleEdit(exam)} className="btn-secondary text-sm">
                      <Edit size={14} /> Edit
                    </button>
                  )}

                  {/* Unpublish — published only */}
                  {exam.status === 'published' && isSuperAdmin && (
                    <button onClick={() => handleUnpublish(exam.id)} className="btn-secondary text-sm">
                      <EyeOff size={14} /> Unpublish
                    </button>
                  )}

                  {/* Extend time — live only */}
                  {exam.status === 'live' && isSuperAdmin && (
                    <button onClick={() => setExtendModal(exam)} className="btn-secondary text-sm">
                      <Timer size={14} /> Extend Time
                    </button>
                  )}

                  {/* End exam — live only */}
                  {exam.status === 'live' && isSuperAdmin && (
                    <button onClick={() => handleEndExam(exam.id)} className="btn-secondary text-sm"
                      style={{ color: 'var(--color-danger)' }}>
                      <StopCircle size={14} /> End Exam
                    </button>
                  )}

                  {/* Results */}
                  <button onClick={() => navigate(`/exams/${exam.id}/results`)} className="btn-secondary text-sm">
                    <BarChart2 size={14} /> Results
                  </button>

                  {/* Clone */}
                  <button onClick={() => handleClone(exam.id)} className="btn-secondary text-sm">
                    <Copy size={14} /> Clone
                  </button>

                  {/* Delete — master_admin only */}
                  {isMasterAdmin && (
                    <button onClick={() => { setDeleteConfirm(exam); setDeleteText('') }}
                      className="btn-secondary text-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.7)' }}>
          <div className="card" style={{ width:'100%', maxWidth:440, border:'2px solid var(--color-danger)' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>⚠️</div>
              <h3 style={{ fontWeight:700, fontSize:18, color:'var(--color-danger)', marginBottom:6 }}>Permanently Delete Exam</h3>
              <p style={{ fontSize:13, color:'var(--color-text)', marginBottom:4 }}><strong>{deleteConfirm.title}</strong></p>
              <p style={{ fontSize:12, color:'var(--color-text-muted)' }}>
                This will permanently delete the exam, all {deleteConfirm.student_count || 0} student sessions, all answers and all results. <strong>This cannot be undone.</strong>
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
              <button onClick={() => { setDeleteConfirm(null); setDeleteText('') }} className="btn-secondary" style={{ flex:1 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteText !== 'DELETE' || deleting}
                style={{ flex:1, padding:'8px 16px', background: deleteText === 'DELETE' ? 'var(--color-danger)' : 'var(--color-border)', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor: deleteText === 'DELETE' ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {deleting ? <div className="spinner w-4 h-4" /> : <Trash2 size={14} />}
                Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend time modal */}
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
                className="btn-primary" style={{ flex:1, justifyContent:'center', background:'var(--color-primary)' }}>
                {extending ? <div className="spinner w-4 h-4" /> : <Timer size={14} />}
                Add {extendMins} Minutes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
