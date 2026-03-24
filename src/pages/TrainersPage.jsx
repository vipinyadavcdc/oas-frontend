import { useEffect, useState } from 'react'
import { UserPlus, RotateCcw, UserX, Shield } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const BLANK = { emp_id: '', name: '', email: '', role: 'trainer', university: 'BOTH', department: '' }

export default function TrainersPage() {
  const { isGranter } = useAuth()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTrainers() }, [])

  const loadTrainers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/trainers')
      setTrainers(res.data.trainers)
    } catch { toast.error('Failed to load trainers') }
    finally { setLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/trainers', form)
      toast.success('Trainer added! Default password = ' + form.emp_id)
      setShowAdd(false)
      setForm(BLANK)
      loadTrainers()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add trainer') }
    finally { setSaving(false) }
  }

  const handleDeactivate = async (id, name) => {
    if (!confirm('Deactivate ' + name + '?')) return
    try {
      await api.delete('/trainers/' + id)
      toast.success(name + ' deactivated')
      loadTrainers()
    } catch { toast.error('Failed') }
  }

  const handleResetPassword = async (id, name) => {
    if (!confirm('Reset password for ' + name + ' to their emp_id?')) return
    try {
      await api.post('/trainers/' + id + '/reset-password')
      toast.success('Password reset to emp_id')
    } catch { toast.error('Failed') }
  }

  const superAdmins = trainers.filter(t => t.role === 'super_admin')
  const regular = trainers.filter(t => t.role === 'trainer')

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{trainers.length} total — {superAdmins.length} super admins</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><UserPlus size={16} /> Add Trainer</button>
      </div>

      {showAdd && (
        <div className="card mb-5">
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Add New Trainer</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Employee ID *</label>
              <input className="input" placeholder="e.g. EMP025" value={form.emp_id}
                     onChange={e => setForm({...form, emp_id: e.target.value.toUpperCase()})} required />
            </div>
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Trainer name" value={form.name}
                     onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="trainer@mrei.ac.in" value={form.email}
                     onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="trainer">Trainer</option>
                {isGranter && <option value="super_admin">Super Admin</option>}
              </select>
            </div>
            <div>
              <label className="label">University</label>
              <select className="input" value={form.university} onChange={e => setForm({...form, university: e.target.value})}>
                <option value="BOTH">Both</option>
                <option value="MRIIRS">MRIIRS</option>
                <option value="MRU">MRU</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="Optional" value={form.department}
                     onChange={e => setForm({...form, department: e.target.value})} />
            </div>
            <div className="col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <div className="spinner w-4 h-4" /> : <UserPlus size={16} />}
                Add Trainer
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Default password = Employee ID</p>
        </div>
      )}

      {/* Super Admins */}
      <div className="card mb-5">
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Shield size={18} style={{ color: 'var(--color-primary)' }} /> Super Admins
        </h3>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Emp ID</th><th>Email</th><th>University</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {superAdmins.map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td className="font-mono text-sm">{t.emp_id}</td>
                  <td className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.email}</td>
                  <td><span className="badge badge-info">{t.university}</span></td>
                  <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <button onClick={() => handleResetPassword(t.id, t.name)} className="btn-secondary text-xs px-2 py-1">
                      <RotateCcw size={12} /> Reset Pass
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainers */}
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>Trainers ({regular.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Emp ID</th><th>Email</th><th>University</th><th>Dept</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {regular.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td className="font-mono text-sm">{t.emp_id}</td>
                    <td className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.email}</td>
                    <td><span className="badge badge-gray">{t.university}</span></td>
                    <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.department || '—'}</td>
                    <td><span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleResetPassword(t.id, t.name)} className="btn-secondary text-xs px-2 py-1">
                          <RotateCcw size={12} />
                        </button>
                        {t.is_active && (
                          <button onClick={() => handleDeactivate(t.id, t.name)} className="text-xs px-2 py-1 rounded"
                                  style={{ color: 'var(--color-danger)' }}>
                            <UserX size={12} />
                          </button>
                        )}
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
