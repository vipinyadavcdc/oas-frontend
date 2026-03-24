import { useState } from 'react'
import { Search, User, AlertTriangle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function StudentHistoryPage() {
  const [rollNumber, setRollNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(null)
  const [student, setStudent] = useState(null)

  const search = async () => {
    if (!rollNumber.trim()) return toast.error('Enter a roll number')
    setLoading(true)
    try {
      const res = await api.get('/results/student/' + rollNumber.trim().toUpperCase() + '/history')
      setHistory(res.data.history)
      setStudent(res.data.student)
      if (res.data.history.length === 0) toast('No exam history found for this roll number')
    } catch { toast.error('Failed to fetch history') }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student History</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Search any roll number to see full exam history</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Enter roll number e.g. 21BCE0452"
          value={rollNumber}
          onChange={e => setRollNumber(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button onClick={search} className="btn-primary" disabled={loading}>
          <Search size={16} /> {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {student && (
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                 style={{ background: 'var(--color-primary)' }}>
              {student.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>{student.name}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {student.roll_number} · {student.department} · {student.section} · {student.university}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{student.email} · {student.mobile}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{history?.length || 0}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total exams</div>
            </div>
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Exam</th><th>Type</th><th>Date</th><th>Score</th><th>%</th>
                <th>Correct</th><th>Wrong</th><th>Aptitude</th><th>Verbal</th>
                <th>Time</th><th>Violations</th><th>Status</th>
              </tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} style={{ background: h.is_flagged ? '#fff5f5' : undefined }}>
                    <td>
                      <div className="font-medium text-sm">{h.exam_title}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{h.room_code}</div>
                    </td>
                    <td className="text-xs">{h.exam_type}</td>
                    <td className="text-xs">{h.started_at ? new Date(h.started_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
                      {h.final_score||0}/{h.max_score||0}
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: parseFloat(h.percentage)>=50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {parseFloat(h.percentage||0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="font-mono text-sm" style={{ color: 'var(--color-success)' }}>{h.correct||0}</td>
                    <td className="font-mono text-sm" style={{ color: 'var(--color-danger)' }}>{h.incorrect||0}</td>
                    <td className="font-mono text-sm">{parseFloat(h.aptitude_score||0).toFixed(1)}</td>
                    <td className="font-mono text-sm">{parseFloat(h.verbal_score||0).toFixed(1)}</td>
                    <td className="text-xs">{h.time_taken_seconds ? Math.round(h.time_taken_seconds/60)+'m' : '—'}</td>
                    <td>
                      {h.is_flagged
                        ? <span className="badge badge-danger">FLAGGED · {h.tab_switches||0} tabs</span>
                        : <span className="badge badge-success">Clean</span>}
                    </td>
                    <td><span className={`badge ${h.status==='submitted' ? 'badge-success' : h.status==='auto_submitted' ? 'badge-warning' : 'badge-gray'}`}>{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
