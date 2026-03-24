import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, UserX, UserCheck, Clock, Send, Wifi, WifiOff } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function MonitorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [extendModal, setExtendModal] = useState(null)
  const [extraMins, setExtraMins] = useState(10)
  const [lastRefresh, setLastRefresh] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    loadData()
    pollRef.current = setInterval(loadData, 30000) // 10s auto-refresh
    return () => clearInterval(pollRef.current)
  }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/monitor/' + id)
      setData(res.data)
      setLastRefresh(new Date())
    } catch { toast.error('Failed to load monitor data') }
    finally { setLoading(false) }
  }

  const handleBlock = async (sessionId, name) => {
    if (!confirm('Block ' + name + ' from the exam?')) return
    try { await api.post('/monitor/block-student', { session_id: sessionId }); toast.success(name + ' blocked'); loadData() }
    catch { toast.error('Failed to block student') }
  }

  const handleUnlock = async (sessionId, name) => {
    try { await api.post('/monitor/unlock-student', { session_id: sessionId }); toast.success(name + ' unlocked'); loadData() }
    catch { toast.error('Failed to unlock student') }
  }

  const handleForceSubmitAll = async () => {
    if (!confirm('Force submit ALL active students? This cannot be undone.')) return
    try { await api.post('/exams/' + id + '/force-submit-all'); toast.success('All students force submitted!'); loadData() }
    catch { toast.error('Failed to force submit') }
  }

  const handleExtend = async () => {
    try {
      await api.post('/monitor/' + id + '/extend-time', { session_id: extendModal.id, extra_minutes: extraMins })
      toast.success(extraMins + ' minutes added for ' + extendModal.name)
      setExtendModal(null); loadData()
    } catch { toast.error('Failed to extend time') }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>

  const stats = data?.stats || {}
  const students = data?.students || []
  const activeCount = parseInt(stats.active || 0)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="btn-secondary p-2"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">Live Monitor</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {data?.exam?.title} · auto-refreshes every 30s
              {lastRefresh && <span> · last at {lastRefresh.toLocaleTimeString()}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={handleForceSubmitAll} className="btn-danger"><Send size={16} /> Force Submit All</button>
        </div>
      </div>

      {/* Big live stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-success)', animation: activeCount > 0 ? 'pulse 1.5s infinite' : 'none' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>ACTIVE</span>
          </div>
          <div className="text-4xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.active || 0}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>SUBMITTED</div>
          <div className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.submitted || 0}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>FLAGGED</div>
          <div className="text-4xl font-bold" style={{ color: 'var(--color-danger)' }}>{stats.flagged || 0}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>TOTAL JOINED</div>
          <div className="text-4xl font-bold" style={{ color: 'var(--color-text-muted)' }}>{stats.total || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Student</th><th>Roll No</th><th>Dept/Sec</th>
              <th>Answered</th><th>Tab</th><th>Split</th><th>Heartbeat</th>
              <th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {students.map(s => {
                const lastHB = s.last_heartbeat ? new Date(s.last_heartbeat) : null
                const hbOld = lastHB && (Date.now() - lastHB.getTime()) > 60000
                return (
                  <tr key={s.id} style={{ background: s.is_flagged ? '#fff5f5' : undefined }}>
                    <td>
                      <div className="font-medium text-sm">{s.name}</div>
                      {s.is_flagged && <span className="badge badge-danger text-xs">FLAGGED</span>}
                    </td>
                    <td className="font-mono text-xs">{s.roll_number}</td>
                    <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.department} / {s.section}</td>
                    <td className="font-mono text-sm">{s.answered || 0}/{data?.exam?.total_questions || '?'}</td>
                    <td>
                      <span style={{ color: parseInt(s.tab_switches)>=3 ? 'var(--color-danger)' : 'var(--color-text)' }} className="font-bold">
                        {s.tab_switches || 0}{parseInt(s.tab_switches)>=3 && ' ⚠'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: parseInt(s.split_screens)>=2 ? 'var(--color-danger)' : 'var(--color-text)' }} className="font-bold">
                        {s.split_screens || 0}{parseInt(s.split_screens)>=2 && ' ⚠'}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: hbOld ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {lastHB ? (hbOld ? '⚠ ' : '✓ ') + lastHB.toLocaleTimeString() : '—'}
                    </td>
                    <td>
                      <span className={`badge ${s.status==='active' ? 'badge-success' : ['submitted','auto_submitted'].includes(s.status) ? 'badge-info' : 'badge-danger'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {s.status==='active' && (
                          <>
                            <button onClick={() => setExtendModal(s)} title="Extend time" className="p-1.5 rounded-lg btn-secondary"><Clock size={14} /></button>
                            <button onClick={() => handleBlock(s.id, s.name)} title="Block student" className="p-1.5 rounded-lg" style={{ color: 'var(--color-danger)' }}><UserX size={14} /></button>
                          </>
                        )}
                        {s.status==='blocked' && (
                          <button onClick={() => handleUnlock(s.id, s.name)} title="Unlock student" className="p-1.5 rounded-lg" style={{ color: 'var(--color-success)' }}><UserCheck size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {students.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No students have joined yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {extendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card w-full max-w-sm shadow-2xl">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Extend Time — {extendModal.name}</h3>
            <label className="label">Extra Minutes</label>
            <input type="number" className="input mb-4" min={1} max={60} value={extraMins} onChange={e => setExtraMins(parseInt(e.target.value))} />
            <div className="flex gap-3">
              <button onClick={() => setExtendModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleExtend} className="btn-primary flex-1 justify-center"><Clock size={16} /> Add {extraMins} mins</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
