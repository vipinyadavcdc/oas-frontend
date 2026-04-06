import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Palette, Shield, Building2, Plus, ChevronDown, ChevronRight, Pencil, ToggleLeft, ToggleRight, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { THEMES, applyTheme } from '../themes'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Departments Tab (super admin only) ──────────────────────────────────────
function DepartmentsTab() {
  const [uniTab, setUniTab]         = useState('MRIIRS')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState({})

  // Add dept
  const [newDeptName, setNewDeptName] = useState('')
  const [addingDept, setAddingDept]   = useState(false)

  // Add section
  const [newSection, setNewSection]   = useState({})  // { deptId: '' }
  const [addingSect, setAddingSect]   = useState({})  // { deptId: true }

  // Inline edit
  const [editingDept, setEditingDept]   = useState(null) // { id, name }
  const [editingSect, setEditingSect]   = useState(null) // { id, name }

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/departments/all')
      setDepartments(res.data.departments || [])
    } catch { toast.error('Failed to load departments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filteredDepts = departments.filter(d => d.university === uniTab)

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // ── Add Department ──
  const addDept = async (e) => {
    e.preventDefault()
    if (!newDeptName.trim()) return
    setAddingDept(true)
    try {
      const res = await api.post('/departments', { name: newDeptName.trim(), university: uniTab })
      setDepartments(d => [...d, { ...res.data.department, sections: [] }])
      setNewDeptName('')
      toast.success('Department added')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add department')
    } finally { setAddingDept(false) }
  }

  // ── Toggle dept active ──
  const toggleDept = async (dept) => {
    try {
      await api.patch(`/departments/${dept.id}`, { is_active: !dept.is_active })
      setDepartments(ds => ds.map(d => d.id === dept.id ? { ...d, is_active: !d.is_active } : d))
      toast.success(dept.is_active ? 'Department hidden from students' : 'Department visible to students')
    } catch { toast.error('Failed to update') }
  }

  // ── Rename dept ──
  const saveDeptName = async (id) => {
    if (!editingDept?.name.trim()) return
    try {
      await api.patch(`/departments/${id}`, { name: editingDept.name.trim() })
      setDepartments(ds => ds.map(d => d.id === id ? { ...d, name: editingDept.name.trim() } : d))
      setEditingDept(null)
      toast.success('Renamed')
    } catch { toast.error('Failed to rename') }
  }

  // ── Add Section ──
  const addSection = async (e, deptId) => {
    e.preventDefault()
    const name = newSection[deptId]?.trim()
    if (!name) return
    setAddingSect(a => ({ ...a, [deptId]: true }))
    try {
      const res = await api.post(`/departments/${deptId}/sections`, { name })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, sections: [...d.sections, res.data.section] }
        : d
      ))
      setNewSection(n => ({ ...n, [deptId]: '' }))
      toast.success('Section added')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add section')
    } finally { setAddingSect(a => ({ ...a, [deptId]: false })) }
  }

  // ── Toggle section active ──
  const toggleSection = async (deptId, sect) => {
    try {
      await api.patch(`/departments/sections/${sect.id}`, { is_active: !sect.is_active })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, sections: d.sections.map(s => s.id === sect.id ? { ...s, is_active: !s.is_active } : s) }
        : d
      ))
      toast.success(sect.is_active ? 'Section hidden' : 'Section visible')
    } catch { toast.error('Failed to update') }
  }

  // ── Rename section ──
  const saveSectName = async (deptId, sectId) => {
    if (!editingSect?.name.trim()) return
    try {
      await api.patch(`/departments/sections/${sectId}`, { name: editingSect.name.trim() })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, sections: d.sections.map(s => s.id === sectId ? { ...s, name: editingSect.name.trim() } : s) }
        : d
      ))
      setEditingSect(null)
      toast.success('Renamed')
    } catch { toast.error('Failed to rename') }
  }

  if (loading) return <div className="text-center py-12" style={{ color:'var(--color-text-muted)' }}>Loading...</div>

  return (
    <div>
      {/* University tabs */}
      <div className="flex gap-2 mb-6">
        {['MRIIRS', 'MRU'].map(u => (
          <button key={u} onClick={() => setUniTab(u)}
            className="px-5 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: uniTab === u ? 'var(--color-primary)' : 'var(--color-surface2)',
              color: uniTab === u ? 'white' : 'var(--color-text-muted)',
              border: '2px solid ' + (uniTab === u ? 'var(--color-primary)' : 'var(--color-border)')
            }}>
            {u}
            <span className="ml-2 text-xs opacity-70">
              ({departments.filter(d => d.university === u && d.is_active).length} active)
            </span>
          </button>
        ))}
      </div>

      {/* Add department form */}
      <form onSubmit={addDept} className="flex gap-2 mb-5">
        <input className="input flex-1" placeholder={`Add department for ${uniTab}...`}
          value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
        <button type="submit" disabled={addingDept} className="btn-primary px-4">
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Department list */}
      {filteredDepts.length === 0 && (
        <div className="text-center py-10" style={{ color:'var(--color-text-muted)' }}>
          No departments yet for {uniTab}. Add one above.
        </div>
      )}

      <div className="space-y-3">
        {filteredDepts.map(dept => (
          <div key={dept.id} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)', background:'var(--color-surface)' }}>

            {/* Dept header row */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => toggleExpand(dept.id)} className="flex-1 flex items-center gap-2 text-left"
                style={{ background:'none', border:'none', cursor:'pointer' }}>
                {expanded[dept.id]
                  ? <ChevronDown size={16} style={{ color:'var(--color-primary)', flexShrink:0 }} />
                  : <ChevronRight size={16} style={{ color:'var(--color-text-muted)', flexShrink:0 }} />
                }
                {editingDept?.id === dept.id ? (
                  <input className="input py-1 text-sm flex-1" value={editingDept.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') saveDeptName(dept.id); if (e.key === 'Escape') setEditingDept(null) }}
                    autoFocus />
                ) : (
                  <span className="font-semibold text-sm flex-1" style={{ color: dept.is_active ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {dept.name}
                    {!dept.is_active && <span className="ml-2 text-xs" style={{ color:'var(--color-danger)' }}>(hidden)</span>}
                  </span>
                )}
                <span className="text-xs ml-2" style={{ color:'var(--color-text-muted)', flexShrink:0 }}>
                  {dept.sections.filter(s => s.is_active).length}/{dept.sections.length} sections
                </span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1" style={{ flexShrink:0 }}>
                {editingDept?.id === dept.id ? (
                  <>
                    <button onClick={() => saveDeptName(dept.id)} className="btn-icon" title="Save" style={{ color:'var(--color-success)' }}><Check size={15} /></button>
                    <button onClick={() => setEditingDept(null)} className="btn-icon" title="Cancel" style={{ color:'var(--color-danger)' }}><X size={15} /></button>
                  </>
                ) : (
                  <button onClick={() => setEditingDept({ id: dept.id, name: dept.name })} className="btn-icon" title="Rename" style={{ color:'var(--color-text-muted)' }}><Pencil size={14} /></button>
                )}
                <button onClick={() => toggleDept(dept)} className="btn-icon" title={dept.is_active ? 'Hide from students' : 'Show to students'}>
                  {dept.is_active
                    ? <ToggleRight size={18} style={{ color:'var(--color-success)' }} />
                    : <ToggleLeft size={18} style={{ color:'var(--color-text-muted)' }} />
                  }
                </button>
              </div>
            </div>

            {/* Sections panel */}
            {expanded[dept.id] && (
              <div style={{ borderTop:'1px solid var(--color-border)', background:'var(--color-surface2)', padding:'12px 16px' }}>
                {/* Existing sections */}
                {dept.sections.length === 0 && (
                  <p className="text-xs mb-3" style={{ color:'var(--color-text-muted)' }}>No sections yet.</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {dept.sections.map(sect => (
                    <div key={sect.id} className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-mono font-semibold"
                      style={{
                        background: sect.is_active ? 'var(--color-primary)18' : 'var(--color-surface)',
                        border: '1px solid ' + (sect.is_active ? 'var(--color-primary)' : 'var(--color-border)'),
                        color: sect.is_active ? 'var(--color-primary)' : 'var(--color-text-muted)'
                      }}>
                      {editingSect?.id === sect.id ? (
                        <input className="input py-0 text-xs w-16 text-center" value={editingSect.name}
                          onChange={e => setEditingSect({ ...editingSect, name: e.target.value.toUpperCase() })}
                          onKeyDown={e => { if (e.key === 'Enter') saveSectName(dept.id, sect.id); if (e.key === 'Escape') setEditingSect(null) }}
                          autoFocus />
                      ) : (
                        <span>{sect.name}</span>
                      )}
                      {editingSect?.id === sect.id ? (
                        <>
                          <button onClick={() => saveSectName(dept.id, sect.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-success)', padding:'0 2px' }}><Check size={12} /></button>
                          <button onClick={() => setEditingSect(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-danger)', padding:'0 2px' }}><X size={12} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingSect({ id: sect.id, name: sect.name })} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.6, padding:'0 1px' }}><Pencil size={11} /></button>
                          <button onClick={() => toggleSection(dept.id, sect)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.6, padding:'0 1px' }}>
                            {sect.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add section */}
                <form onSubmit={e => addSection(e, dept.id)} className="flex gap-2">
                  <input className="input text-sm py-1 flex-1" placeholder="Section name e.g. A, B, C1"
                    value={newSection[dept.id] || ''}
                    onChange={e => setNewSection(n => ({ ...n, [dept.id]: e.target.value.toUpperCase() }))} />
                  <button type="submit" disabled={addingSect[dept.id]} className="btn-primary px-3 py-1 text-sm">
                    <Plus size={14} /> Add
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Structure Tree */}
      {filteredDepts.some(d => d.is_active && d.sections.some(s => s.is_active)) && (
        <div className="mt-8 rounded-xl p-5" style={{ background:'var(--color-surface2)', border:'1px solid var(--color-border)' }}>
          <h4 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color:'var(--color-text)' }}>
            🌳 Active Structure — {uniTab}
          </h4>
          <div className="space-y-3">
            {filteredDepts.filter(d => d.is_active).map(dept => (
              <div key={dept.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color:'var(--color-text)' }}>📁 {dept.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-5">
                  {dept.sections.filter(s => s.is_active).length === 0 && (
                    <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>No active sections</span>
                  )}
                  {dept.sections.filter(s => s.is_active).map(s => (
                    <span key={s.id} className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                      style={{ background:'var(--color-primary)18', color:'var(--color-primary)', border:'1px solid var(--color-primary)40' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { trainer, isSuperAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('cdc_theme') || 'ocean')
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTheme = (key) => {
    applyTheme(key)
    setCurrentTheme(key)
    toast.success('Theme applied!')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passForm.new_password !== passForm.confirm) return toast.error('New passwords do not match')
    if (passForm.new_password.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        current_password: passForm.current_password,
        new_password: passForm.new_password
      })
      toast.success('Password changed successfully!')
      setPassForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const tabs = [
    { key: 'general', label: 'General' },
    ...(isSuperAdmin ? [{ key: 'departments', label: '🏫 Departments & Sections' }] : [])
  ]

  return (
    <div className="fade-in max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeTab === t.key ? 'white' : 'var(--color-text-muted)',
                border: '2px solid ' + (activeTab === t.key ? 'var(--color-primary)' : 'var(--color-border)')
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── GENERAL TAB ── */}
      {activeTab === 'general' && (
        <>
          {/* Profile */}
          <div className="card mb-5">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                   style={{ background: 'var(--color-primary)' }}>
                {trainer?.name?.[0]}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{trainer?.name}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{trainer?.emp_id} · {trainer?.email}</div>
                <div className="mt-1">
                  <span className={`badge ${trainer?.role === 'super_admin' ? 'badge-warning' : 'badge-info'}`}>
                    {trainer?.role === 'super_admin' ? '⭐ Super Admin' : 'Trainer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="card mb-5">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Palette size={18} style={{ color: 'var(--color-primary)' }} /> Theme
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => handleTheme(key)}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: currentTheme === key ? 'var(--color-primary)' : 'var(--color-border)',
                    background: currentTheme === key ? 'var(--color-primary)' + '12' : 'var(--color-surface2)',
                  }}>
                  <div className="text-2xl mb-1">{theme.emoji}</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{theme.name}</div>
                  {currentTheme === key && (
                    <div className="text-xs mt-1 font-bold" style={{ color: 'var(--color-primary)' }}>✓ Active</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                         value={passForm.current_password}
                         onChange={e => setPassForm({...passForm, current_password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={passForm.new_password}
                       onChange={e => setPassForm({...passForm, new_password: e.target.value})} required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" value={passForm.confirm}
                       onChange={e => setPassForm({...passForm, confirm: e.target.value})} required />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <div className="spinner w-4 h-4" /> : <Save size={16} />}
                Change Password
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── DEPARTMENTS TAB ── */}
      {activeTab === 'departments' && isSuperAdmin && (
        <div className="card">
          <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Building2 size={18} style={{ color: 'var(--color-primary)' }} /> Departments & Sections
          </h3>
          <p className="text-sm mb-5" style={{ color:'var(--color-text-muted)' }}>
            Manage departments and sections for each university. Students will see these as dropdowns when registering for an exam.
          </p>
          <DepartmentsTab />
        </div>
      )}
    </div>
  )
}
