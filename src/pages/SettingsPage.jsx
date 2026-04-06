import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Palette, Shield, Building2, Plus, ChevronDown, ChevronRight,
         Pencil, ToggleLeft, ToggleRight, Check, X, CalendarDays, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { THEMES, applyTheme } from '../themes'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ─── Sessions Tab ────────────────────────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [newName, setNewName]   = useState('')
  const [newType, setNewType]   = useState('Even')
  const [adding, setAdding]     = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/departments/sessions/all')
      setSessions(res.data.sessions || [])
    } catch { toast.error('Failed to load sessions') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const addSession = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await api.post('/departments/sessions', { name: newName.trim(), type: newType })
      setSessions(s => [res.data.session, ...s])
      setNewName('')
      toast.success('Session created')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setAdding(false) }
  }

  const activate = async (id) => {
    try {
      const res = await api.patch(`/departments/sessions/${id}/activate`)
      setSessions(s => s.map(x => ({ ...x, is_active: x.id === id })))
      toast.success(`"${res.data.session.name}" is now the active session`)
    } catch { toast.error('Failed to activate') }
  }

  if (loading) return <div className="text-center py-10" style={{ color:'var(--color-text-muted)' }}>Loading...</div>

  const active = sessions.find(s => s.is_active)

  return (
    <div>
      {/* Active banner */}
      {active && (
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
          style={{ background:'var(--color-success)15', border:'1px solid var(--color-success)' }}>
          <Zap size={18} style={{ color:'var(--color-success)', flexShrink:0 }} />
          <div>
            <div className="text-sm font-bold" style={{ color:'var(--color-success)' }}>Active Session</div>
            <div className="font-semibold" style={{ color:'var(--color-text)' }}>{active.name}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--color-success)25', color:'var(--color-success)' }}>{active.type} Semester</span>
            </div>
          </div>
        </div>
      )}
      {!active && (
        <div className="rounded-xl p-4 mb-5" style={{ background:'var(--color-danger)15', border:'1px solid var(--color-danger)' }}>
          <p className="text-sm font-semibold" style={{ color:'var(--color-danger)' }}>⚠️ No active session — students won't see a session when registering</p>
        </div>
      )}

      {/* Add new session */}
      <form onSubmit={addSession} className="flex gap-2 mb-5">
        <input className="input flex-1" placeholder="e.g. 2026 Jul - Dec"
          value={newName} onChange={e => setNewName(e.target.value)} />
        <select className="input w-28" value={newType} onChange={e => setNewType(e.target.value)}>
          <option value="Even">Even</option>
          <option value="Odd">Odd</option>
        </select>
        <button type="submit" disabled={adding} className="btn-primary px-4">
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Sessions list */}
      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              border: '1px solid ' + (s.is_active ? 'var(--color-success)' : 'var(--color-border)'),
              background: s.is_active ? 'var(--color-success)08' : 'var(--color-surface)'
            }}>
            <CalendarDays size={16} style={{ color: s.is_active ? 'var(--color-success)' : 'var(--color-text-muted)', flexShrink:0 }} />
            <div className="flex-1">
              <span className="font-semibold text-sm" style={{ color:'var(--color-text)' }}>{s.name}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background:'var(--color-primary)15', color:'var(--color-primary)' }}>{s.type}</span>
              {s.is_active && <span className="ml-2 text-xs font-bold" style={{ color:'var(--color-success)' }}>● Active</span>}
            </div>
            <div className="text-xs" style={{ color:'var(--color-text-muted)' }}>
              by {s.created_by_name || 'System'}
            </div>
            {!s.is_active && (
              <button onClick={() => activate(s.id)}
                className="text-xs px-3 py-1 rounded-lg font-semibold"
                style={{ background:'var(--color-primary)', color:'white', border:'none', cursor:'pointer' }}>
                Set Active
              </button>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-8" style={{ color:'var(--color-text-muted)' }}>No sessions yet. Add one above.</div>
        )}
      </div>
    </div>
  )
}

// ─── Departments Tab ─────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [uniTab, setUniTab]         = useState('MRIIRS')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [expandedDept, setExpandedDept] = useState({})
  const [expandedSem, setExpandedSem]   = useState({})

  const [newDeptName, setNewDeptName] = useState('')
  const [addingDept, setAddingDept]   = useState(false)
  const [newSection, setNewSection]   = useState({})
  const [addingSect, setAddingSect]   = useState({})
  const [editingDept, setEditingDept] = useState(null)
  const [editingSect, setEditingSect] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/departments/all')
      setDepartments(res.data.departments || [])
    } catch { toast.error('Failed to load departments') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = departments.filter(d => d.university === uniTab)

  // ── Dept actions ──
  const addDept = async (e) => {
    e.preventDefault()
    if (!newDeptName.trim()) return
    setAddingDept(true)
    try {
      const res = await api.post('/departments', { name: newDeptName.trim(), university: uniTab })
      setDepartments(d => [...d, { ...res.data.department, semesters: [] }])
      setNewDeptName('')
      toast.success('Department added')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setAddingDept(false) }
  }

  const toggleDept = async (dept) => {
    try {
      await api.patch(`/departments/${dept.id}`, { is_active: !dept.is_active })
      setDepartments(ds => ds.map(d => d.id === dept.id ? { ...d, is_active: !d.is_active } : d))
      toast.success(dept.is_active ? 'Hidden from students' : 'Visible to students')
    } catch { toast.error('Failed') }
  }

  const saveDeptName = async (id) => {
    if (!editingDept?.name.trim()) return
    try {
      await api.patch(`/departments/${id}`, { name: editingDept.name.trim() })
      setDepartments(ds => ds.map(d => d.id === id ? { ...d, name: editingDept.name.trim() } : d))
      setEditingDept(null)
      toast.success('Renamed')
    } catch { toast.error('Failed') }
  }

  // ── Semester actions ──
  const addSemester = async (deptId, number) => {
    try {
      const res = await api.post(`/departments/${deptId}/semesters`, { number })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, semesters: [...d.semesters, { ...res.data.semester, sections: [] }].sort((a,b) => a.number - b.number) }
        : d
      ))
      toast.success(`Semester ${number} added`)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const toggleSem = async (deptId, sem) => {
    try {
      await api.patch(`/departments/semesters/${sem.id}`, { is_active: !sem.is_active })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, semesters: d.semesters.map(s => s.id === sem.id ? { ...s, is_active: !s.is_active } : s) }
        : d
      ))
    } catch { toast.error('Failed') }
  }

  // ── Section actions ──
  const addSection = async (e, semId, deptId) => {
    e.preventDefault()
    const name = newSection[semId]?.trim()
    if (!name) return
    setAddingSect(a => ({ ...a, [semId]: true }))
    try {
      const res = await api.post(`/departments/semesters/${semId}/sections`, { name })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, semesters: d.semesters.map(s => s.id === semId
            ? { ...s, sections: [...s.sections, res.data.section] }
            : s) }
        : d
      ))
      setNewSection(n => ({ ...n, [semId]: '' }))
      toast.success('Section added')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setAddingSect(a => ({ ...a, [semId]: false })) }
  }

  const toggleSection = async (deptId, semId, sect) => {
    try {
      await api.patch(`/departments/sections/${sect.id}`, { is_active: !sect.is_active })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, semesters: d.semesters.map(s => s.id === semId
            ? { ...s, sections: s.sections.map(sc => sc.id === sect.id ? { ...sc, is_active: !sc.is_active } : sc) }
            : s) }
        : d
      ))
    } catch { toast.error('Failed') }
  }

  const saveSectName = async (deptId, semId, sectId) => {
    if (!editingSect?.name.trim()) return
    try {
      await api.patch(`/departments/sections/${sectId}`, { name: editingSect.name.trim() })
      setDepartments(ds => ds.map(d => d.id === deptId
        ? { ...d, semesters: d.semesters.map(s => s.id === semId
            ? { ...s, sections: s.sections.map(sc => sc.id === sectId ? { ...sc, name: editingSect.name.trim() } : sc) }
            : s) }
        : d
      ))
      setEditingSect(null)
      toast.success('Renamed')
    } catch { toast.error('Failed') }
  }

  if (loading) return <div className="text-center py-10" style={{ color:'var(--color-text-muted)' }}>Loading...</div>

  return (
    <div>
      {/* University tabs */}
      <div className="flex gap-2 mb-5">
        {['MRIIRS', 'MRU'].map(u => (
          <button key={u} onClick={() => setUniTab(u)}
            className="px-5 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: uniTab === u ? 'var(--color-primary)' : 'var(--color-surface2)',
              color: uniTab === u ? 'white' : 'var(--color-text-muted)',
              border: '2px solid ' + (uniTab === u ? 'var(--color-primary)' : 'var(--color-border)')
            }}>
            {u} <span className="ml-1 opacity-70 text-xs">({departments.filter(d=>d.university===u&&d.is_active).length})</span>
          </button>
        ))}
      </div>

      {/* Add dept */}
      <form onSubmit={addDept} className="flex gap-2 mb-5">
        <input className="input flex-1" placeholder={`Add department for ${uniTab}...`}
          value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
        <button type="submit" disabled={addingDept} className="btn-primary px-4"><Plus size={16} /> Add</button>
      </form>

      {filtered.length === 0 && (
        <div className="text-center py-8" style={{ color:'var(--color-text-muted)' }}>No departments for {uniTab} yet.</div>
      )}

      {/* Dept list */}
      <div className="space-y-3">
        {filtered.map(dept => (
          <div key={dept.id} className="rounded-xl overflow-hidden"
            style={{ border:'1px solid var(--color-border)', background:'var(--color-surface)' }}>

            {/* Dept row */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => setExpandedDept(e => ({ ...e, [dept.id]: !e[dept.id] }))}
                style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, flex:1, textAlign:'left' }}>
                {expandedDept[dept.id]
                  ? <ChevronDown size={15} style={{ color:'var(--color-primary)', flexShrink:0 }} />
                  : <ChevronRight size={15} style={{ color:'var(--color-text-muted)', flexShrink:0 }} />}
                {editingDept?.id === dept.id
                  ? <input className="input py-1 text-sm flex-1" value={editingDept.name}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                      onKeyDown={e => { if(e.key==='Enter') saveDeptName(dept.id); if(e.key==='Escape') setEditingDept(null) }}
                      autoFocus />
                  : <span className="font-semibold text-sm flex-1" style={{ color: dept.is_active ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {dept.name}
                      {!dept.is_active && <span className="ml-2 text-xs" style={{ color:'var(--color-danger)' }}>(hidden)</span>}
                    </span>
                }
                <span className="text-xs ml-2 shrink-0" style={{ color:'var(--color-text-muted)' }}>
                  {dept.semesters?.filter(s=>s.is_active).length || 0} semesters
                </span>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                {editingDept?.id === dept.id
                  ? <>
                      <button onClick={() => saveDeptName(dept.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-success)' }}><Check size={15} /></button>
                      <button onClick={() => setEditingDept(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-danger)' }}><X size={15} /></button>
                    </>
                  : <button onClick={() => setEditingDept({ id:dept.id, name:dept.name })} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)' }}><Pencil size={13} /></button>
                }
                <button onClick={() => toggleDept(dept)}>
                  {dept.is_active
                    ? <ToggleRight size={18} style={{ color:'var(--color-success)', background:'none', border:'none', cursor:'pointer' }} />
                    : <ToggleLeft size={18} style={{ color:'var(--color-text-muted)', background:'none', border:'none', cursor:'pointer' }} />}
                </button>
              </div>
            </div>

            {/* Semesters panel */}
            {expandedDept[dept.id] && (
              <div style={{ borderTop:'1px solid var(--color-border)', background:'var(--color-surface2)', padding:'12px 16px' }}>
                {/* Add semester buttons */}
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-2" style={{ color:'var(--color-text-muted)' }}>Add Semester:</p>
                  <div className="flex flex-wrap gap-1">
                    {[1,2,3,4,5,6,7,8].filter(n => !dept.semesters?.find(s => s.number === n)).map(n => (
                      <button key={n} onClick={() => addSemester(dept.id, n)}
                        className="text-xs px-2 py-1 rounded-lg font-semibold"
                        style={{ background:'var(--color-surface)', border:'1px dashed var(--color-border)', color:'var(--color-text-muted)', cursor:'pointer' }}>
                        + Sem {n}
                      </button>
                    ))}
                    {[1,2,3,4,5,6,7,8].every(n => dept.semesters?.find(s => s.number === n)) &&
                      <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>All semesters added</span>}
                  </div>
                </div>

                {/* Semester list */}
                <div className="space-y-2">
                  {(dept.semesters || []).sort((a,b) => a.number - b.number).map(sem => (
                    <div key={sem.id} className="rounded-lg overflow-hidden"
                      style={{ border:'1px solid var(--color-border)', background:'var(--color-surface)' }}>

                      {/* Sem row */}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button onClick={() => setExpandedSem(e => ({ ...e, [sem.id]: !e[sem.id] }))}
                          style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, flex:1 }}>
                          {expandedSem[sem.id]
                            ? <ChevronDown size={13} style={{ color:'var(--color-primary)' }} />
                            : <ChevronRight size={13} style={{ color:'var(--color-text-muted)' }} />}
                          <span className="text-sm font-semibold" style={{ color: sem.is_active ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                            Semester {sem.number}
                          </span>
                          <span className="text-xs ml-1" style={{ color:'var(--color-text-muted)' }}>
                            ({sem.sections?.filter(s=>s.is_active).length || 0} sections)
                          </span>
                        </button>
                        <button onClick={() => toggleSem(dept.id, sem)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                          {sem.is_active
                            ? <ToggleRight size={16} style={{ color:'var(--color-success)' }} />
                            : <ToggleLeft size={16} style={{ color:'var(--color-text-muted)' }} />}
                        </button>
                      </div>

                      {/* Sections panel */}
                      {expandedSem[sem.id] && (
                        <div style={{ borderTop:'1px solid var(--color-border)', background:'var(--color-surface2)', padding:'10px 12px' }}>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(sem.sections || []).map(sect => (
                              <div key={sect.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                                style={{
                                  background: sect.is_active ? 'var(--color-primary)18' : 'var(--color-surface)',
                                  border:'1px solid ' + (sect.is_active ? 'var(--color-primary)' : 'var(--color-border)'),
                                  color: sect.is_active ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                }}>
                                {editingSect?.id === sect.id
                                  ? <input className="input py-0 text-xs w-16 text-center" value={editingSect.name}
                                      onChange={e => setEditingSect({ ...editingSect, name: e.target.value.toUpperCase() })}
                                      onKeyDown={e => { if(e.key==='Enter') saveSectName(dept.id, sem.id, sect.id); if(e.key==='Escape') setEditingSect(null) }}
                                      autoFocus />
                                  : <span>{sect.name}</span>
                                }
                                {editingSect?.id === sect.id
                                  ? <>
                                      <button onClick={() => saveSectName(dept.id, sem.id, sect.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-success)', padding:'0 1px' }}><Check size={11} /></button>
                                      <button onClick={() => setEditingSect(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-danger)', padding:'0 1px' }}><X size={11} /></button>
                                    </>
                                  : <>
                                      <button onClick={() => setEditingSect({ id:sect.id, name:sect.name })} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.6, padding:'0 1px' }}><Pencil size={10} /></button>
                                      <button onClick={() => toggleSection(dept.id, sem.id, sect)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.6, padding:'0 1px' }}>
                                        {sect.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                      </button>
                                    </>
                                }
                              </div>
                            ))}
                            {(sem.sections || []).length === 0 && (
                              <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>No sections yet</span>
                            )}
                          </div>
                          <form onSubmit={e => addSection(e, sem.id, dept.id)} className="flex gap-2">
                            <input className="input text-xs py-1 flex-1" placeholder="e.g. 6A, 6B, 6 AIML"
                              value={newSection[sem.id] || ''}
                              onChange={e => setNewSection(n => ({ ...n, [sem.id]: e.target.value.toUpperCase() }))} />
                            <button type="submit" disabled={addingSect[sem.id]} className="btn-primary px-3 py-1 text-xs">
                              <Plus size={12} /> Add
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tree view */}
      {filtered.some(d => d.is_active && d.semesters?.some(s => s.is_active && s.sections?.some(sc => sc.is_active))) && (
        <div className="mt-8 rounded-xl p-5" style={{ background:'var(--color-surface2)', border:'1px solid var(--color-border)' }}>
          <h4 className="font-bold mb-4 text-sm" style={{ color:'var(--color-text)' }}>🌳 Active Structure — {uniTab}</h4>
          <div className="space-y-4">
            {filtered.filter(d => d.is_active).map(dept => (
              <div key={dept.id}>
                <div className="font-semibold text-sm mb-2" style={{ color:'var(--color-text)' }}>📁 {dept.name}</div>
                <div className="ml-5 space-y-2">
                  {dept.semesters?.filter(s => s.is_active).sort((a,b) => a.number-b.number).map(sem => (
                    <div key={sem.id}>
                      <div className="text-xs font-semibold mb-1" style={{ color:'var(--color-text-muted)' }}>
                        └ Semester {sem.number}
                      </div>
                      <div className="flex flex-wrap gap-1 ml-4">
                        {sem.sections?.filter(s => s.is_active).length === 0
                          ? <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>No active sections</span>
                          : sem.sections.filter(s => s.is_active).map(sc => (
                            <span key={sc.id} className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                              style={{ background:'var(--color-primary)18', color:'var(--color-primary)', border:'1px solid var(--color-primary)40' }}>
                              {sc.name}
                            </span>
                          ))
                        }
                      </div>
                    </div>
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

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { trainer, isSuperAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('cdc_theme') || 'ocean')
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTheme = (key) => { applyTheme(key); setCurrentTheme(key); toast.success('Theme applied!') }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passForm.new_password !== passForm.confirm) return toast.error('Passwords do not match')
    if (passForm.new_password.length < 6) return toast.error('Min 6 characters')
    setSaving(true)
    try {
      await api.post('/auth/change-password', { current_password: passForm.current_password, new_password: passForm.new_password })
      toast.success('Password changed!')
      setPassForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const tabs = [
    { key: 'general', label: 'General' },
    ...(isSuperAdmin ? [
      { key: 'sessions',     label: '📅 Sessions' },
      { key: 'departments',  label: '🏫 Departments' },
    ] : [])
  ]

  return (
    <div className="fade-in max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
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

      {activeTab === 'general' && (
        <>
          <div className="card mb-5">
            <h3 className="font-bold mb-4" style={{ color:'var(--color-text)' }}>Profile</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                   style={{ background:'var(--color-primary)' }}>{trainer?.name?.[0]}</div>
              <div>
                <div className="text-xl font-bold" style={{ color:'var(--color-text)' }}>{trainer?.name}</div>
                <div className="text-sm" style={{ color:'var(--color-text-muted)' }}>{trainer?.emp_id} · {trainer?.email}</div>
                <div className="mt-1">
                  <span className={`badge ${trainer?.role === 'super_admin' ? 'badge-warning' : 'badge-info'}`}>
                    {trainer?.role === 'super_admin' ? '⭐ Super Admin' : 'Trainer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-5">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color:'var(--color-text)' }}>
              <Palette size={18} style={{ color:'var(--color-primary)' }} /> Theme
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => handleTheme(key)}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: currentTheme === key ? 'var(--color-primary)' : 'var(--color-border)',
                    background:  currentTheme === key ? 'var(--color-primary)12' : 'var(--color-surface2)',
                  }}>
                  <div className="text-2xl mb-1">{theme.emoji}</div>
                  <div className="text-sm font-semibold" style={{ color:'var(--color-text)' }}>{theme.name}</div>
                  {currentTheme === key && <div className="text-xs mt-1 font-bold" style={{ color:'var(--color-primary)' }}>✓ Active</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color:'var(--color-text)' }}>
              <Shield size={18} style={{ color:'var(--color-primary)' }} /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                    value={passForm.current_password}
                    onChange={e => setPassForm({...passForm, current_password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'var(--color-text-muted)' }}>
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
                {saving ? <div className="spinner w-4 h-4" /> : <Save size={16} />} Change Password
              </button>
            </form>
          </div>
        </>
      )}

      {activeTab === 'sessions' && isSuperAdmin && (
        <div className="card">
          <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color:'var(--color-text)' }}>
            <CalendarDays size={18} style={{ color:'var(--color-primary)' }} /> Academic Sessions
          </h3>
          <p className="text-sm mb-5" style={{ color:'var(--color-text-muted)' }}>
            Create a session for each semester period. Only one can be active at a time — students see it auto-selected.
          </p>
          <SessionsTab />
        </div>
      )}

      {activeTab === 'departments' && isSuperAdmin && (
        <div className="card">
          <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color:'var(--color-text)' }}>
            <Building2 size={18} style={{ color:'var(--color-primary)' }} /> Departments, Semesters & Sections
          </h3>
          <p className="text-sm mb-5" style={{ color:'var(--color-text-muted)' }}>
            Build the full hierarchy for each university. Students select from these dropdowns when registering.
          </p>
          <DepartmentsTab />
        </div>
      )}
    </div>
  )
}
