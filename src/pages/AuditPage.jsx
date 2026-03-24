import { useEffect, useState } from 'react'
import { Shield, Search } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity_type: '', page: 1 })

  useEffect(() => { loadLogs() }, [filters])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit', { params: { ...filters, limit: 50 } })
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load audit logs') }
    finally { setLoading(false) }
  }

  const ACTION_COLORS = {
    LOGIN: 'badge-info', CREATE_EXAM: 'badge-success', PUBLISH_EXAM: 'badge-success',
    DELETE_QUESTION: 'badge-danger', DEACTIVATE_TRAINER: 'badge-danger',
    FORCE_SUBMIT_ALL: 'badge-warning', BLOCK_STUDENT: 'badge-danger',
    UPLOAD_QUESTIONS: 'badge-info', CLONE_EXAM: 'badge-gray'
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Every trainer action is recorded here</p>
        </div>
        <Shield size={24} style={{ color: 'var(--color-primary)' }} />
      </div>

      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Filter by action..." value={filters.action}
               onChange={e => setFilters({...filters, action: e.target.value, page: 1})} />
        <select className="input w-40" value={filters.entity_type}
                onChange={e => setFilters({...filters, entity_type: e.target.value, page: 1})}>
          <option value="">All Types</option>
          <option value="exam">Exam</option>
          <option value="question">Question</option>
          <option value="trainer">Trainer</option>
          <option value="session">Session</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Time</th><th>Trainer</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div className="text-sm font-medium">{log.trainer_name || '—'}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{log.emp_id}</div>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`}>{log.action}</span>
                    </td>
                    <td className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {log.entity_type} {log.entity_id ? log.entity_id.substring(0,8) + '...' : ''}
                    </td>
                    <td className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total: {total} records</p>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={filters.page === 1}
                    onClick={() => setFilters(f => ({...f, page: f.page - 1}))}>← Prev</button>
            <button className="btn-secondary" disabled={filters.page * 50 >= total}
                    onClick={() => setFilters(f => ({...f, page: f.page + 1}))}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
