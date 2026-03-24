import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Users, BookOpen, Activity, Plus, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const { trainer } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ exams: 0, questions: 0, students: 0, live: 0 })
  const [recentExams, setRecentExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [examsRes, qRes] = await Promise.all([
        api.get('/exams'),
        api.get('/questions?limit=1')
      ])
      const exams = examsRes.data.exams || []
      const live = exams.filter(e => e.status === 'live').length
      const totalStudents = exams.reduce((s, e) => s + parseInt(e.student_count || 0), 0)
      setStats({ exams: exams.length, questions: qRes.data.total || 0, students: totalStudents, live })
      setRecentExams(exams.slice(0, 5))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Exams', value: stats.exams, icon: FileText, color: '#1a6fbf' },
    { label: 'Questions', value: stats.questions, icon: BookOpen, color: '#7c3aed' },
    { label: 'Students Attempted', value: stats.students, icon: Users, color: '#15803d' },
    { label: 'Live Exams', value: stats.live, icon: Activity, color: stats.live > 0 ? '#dc2626' : '#6b7280' },
  ]

  const statusBadge = (s) => {
    const map = { draft: 'badge-gray', published: 'badge-info', live: 'badge-success', ended: 'badge-warning' }
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {trainer?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            CDC Exam Portal — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/exams/create')}>
          <Plus size={18} /> New Exam
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: color + '18', color }}>
              <Icon size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '—' : value}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent exams */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Recent Exams</h2>
          <button onClick={() => navigate('/exams')} className="text-sm flex items-center gap-1"
                  style={{ color: 'var(--color-primary)' }}>
            View all <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : recentExams.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No exams yet</p>
            <button className="btn-primary mt-4 mx-auto" onClick={() => navigate('/exams/create')}>
              <Plus size={16} /> Create First Exam
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Type</th>
                  <th>Questions</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentExams.map(exam => (
                  <tr key={exam.id}>
                    <td>
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{exam.title}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        🔑 {exam.room_code}
                      </div>
                    </td>
                    <td><span className="badge badge-info text-xs">{exam.exam_type}</span></td>
                    <td className="font-mono text-sm">{exam.total_questions}</td>
                    <td className="font-mono text-sm">{exam.student_count || 0}</td>
                    <td>{statusBadge(exam.status)}</td>
                    <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {exam.status === 'live' && (
                          <button onClick={() => navigate(`/exams/${exam.id}/monitor`)}
                            className="btn-secondary text-xs px-2 py-1">
                            <Activity size={14} /> Monitor
                          </button>
                        )}
                        <button onClick={() => navigate(`/exams/${exam.id}/results`)}
                          className="btn-secondary text-xs px-2 py-1">
                          Results
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
