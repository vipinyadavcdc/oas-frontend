import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Activity, BarChart2, Copy, Eye, Send, Clock, Users } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const STATUS_BADGE = { draft: 'badge-gray', published: 'badge-info', live: 'badge-success', ended: 'badge-warning' }

export default function ExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { loadExams() }, [])

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

  useEffect(() => { loadExams() }, [statusFilter])

  const handlePublish = async (id) => {
    try {
      await api.post(`/exams/${id}/publish`)
      toast.success('Exam published!')
      loadExams()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to publish') }
  }

  const handleClone = async (id) => {
    try {
      await api.post(`/exams/${id}/clone`)
      toast.success('Exam cloned!')
      loadExams()
    } catch { toast.error('Failed to clone') }
  }

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(filter.toLowerCase()) ||
    e.room_code.toLowerCase().includes(filter.toLowerCase())
  )

  const examUrl = (code) => `${window.location.origin}/exam`

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
                    <span className="flex items-center gap-1">
                      <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>🔑 {exam.room_code}</span>
                    </span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration_minutes} min</span>
                    <span className="flex items-center gap-1">📝 {exam.total_questions} questions</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {exam.student_count || 0} students</span>
                    <span>by {exam.trainer_name}</span>
                    <span>{formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}</span>
                  </div>

                  {/* Share link */}
                  {exam.status !== 'draft' && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs px-2 py-1 rounded font-mono"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text-muted)' }}>
                        {examUrl(exam.room_code)}
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(examUrl(exam.room_code)); toast.success('Link copied!') }}
                        className="text-xs px-2 py-1 rounded btn-secondary">
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {exam.status === 'draft' && (
                    <>
                      <button onClick={() => navigate(`/exams/${exam.id}/edit`)} className="btn-secondary text-sm">
                        <Eye size={14} /> Edit
                      </button>
                      <button onClick={() => handlePublish(exam.id)} className="btn-primary text-sm"
                              style={{ background: 'var(--color-success)' }}>
                        <Send size={14} /> Publish
                      </button>
                    </>
                  )}
                  {exam.status === 'live' && (
                    <button onClick={() => navigate(`/exams/${exam.id}/monitor`)} className="btn-primary text-sm">
                      <Activity size={14} /> Live Monitor
                    </button>
                  )}
                  <button onClick={() => navigate(`/exams/${exam.id}/results`)} className="btn-secondary text-sm">
                    <BarChart2 size={14} /> Results
                  </button>
                  <button onClick={() => handleClone(exam.id)} className="btn-secondary text-sm">
                    <Copy size={14} /> Clone
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
