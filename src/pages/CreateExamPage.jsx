import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Plus, Check, ArrowLeft, BookTemplate, Trash2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function CreateExamPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '', description: '', exam_type: 'CE', university: 'BOTH',
    department: '', section_filter: '', duration_minutes: 60,
    start_time: '', end_time: '',
    marks_per_question: 1, negative_marking: false, negative_marks: 0.25,
    randomize_questions: true, randomize_options: true
  })

  const [selectedQIds, setSelectedQIds] = useState([])
  const [qSearch, setQSearch] = useState({ section: '', topic: '', search: '' })
  const [qResults, setQResults] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  useEffect(() => { if (isEdit) loadExam(); loadTemplates() }, [id])
  useEffect(() => { searchQuestions() }, [qSearch])

  const loadExam = async () => {
    try {
      const res = await api.get('/exams/' + id)
      const e = res.data.exam
      setForm({
        title: e.title, description: e.description || '', exam_type: e.exam_type,
        university: e.university, department: e.department || '', section_filter: e.section_filter || '',
        duration_minutes: e.duration_minutes,
        start_time: e.start_time ? e.start_time.slice(0,16) : '',
        end_time: e.end_time ? e.end_time.slice(0,16) : '',
        marks_per_question: e.marks_per_question, negative_marking: e.negative_marking,
        negative_marks: e.negative_marks, randomize_questions: e.randomize_questions,
        randomize_options: e.randomize_options
      })
      setSelectedQIds(res.data.questions.map(q => q.id))
    } catch { toast.error('Failed to load exam') }
  }

  const loadTemplates = async () => {
    try { const res = await api.get('/templates'); setTemplates(res.data.templates) } catch {}
  }

  const applyTemplate = (t) => {
    setForm(f => ({
      ...f,
      exam_type: t.exam_type,
      university: t.university || f.university,
      department: t.department || f.department,
      duration_minutes: t.duration_minutes,
      marks_per_question: t.marks_per_question,
      negative_marking: t.negative_marking,
      negative_marks: t.negative_marks,
      randomize_questions: t.randomize_questions,
      randomize_options: t.randomize_options
    }))
    setShowTemplates(false)
    toast.success('Template "' + t.name + '" applied!')
  }

  const deleteTemplate = async (tId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this template?')) return
    try { await api.delete('/templates/' + tId); loadTemplates(); toast.success('Template deleted') } catch {}
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return toast.error('Enter a template name')
    setSavingTemplate(true)
    try {
      await api.post('/templates', { name: templateName, ...form })
      toast.success('Template saved!')
      setShowSaveTemplate(false)
      setTemplateName('')
      loadTemplates()
    } catch { toast.error('Failed to save template') }
    finally { setSavingTemplate(false) }
  }

  const searchQuestions = async () => {
    setQLoading(true)
    try { const res = await api.get('/questions', { params: { ...qSearch, limit: 50 } }); setQResults(res.data.questions) }
    catch {}
    finally { setQLoading(false) }
  }

  const toggleQuestion = (q) => {
    setSelectedQIds(ids => ids.includes(q.id) ? ids.filter(i => i !== q.id) : [...ids, q.id])
  }

  const handleSave = async (publish = false) => {
    if (!form.title) return toast.error('Exam title required')
    if (selectedQIds.length === 0) return toast.error('Add at least one question')
    setSaving(true)
    try {
      const aptCount = qResults.filter(q => selectedQIds.includes(q.id) && q.section === 'aptitude_reasoning').length
      const verCount = qResults.filter(q => selectedQIds.includes(q.id) && q.section === 'verbal').length
      const payload = { ...form, question_ids: selectedQIds, aptitude_count: aptCount, verbal_count: verCount, start_time: form.start_time || null, end_time: form.end_time || null }
      let examId = id
      if (isEdit) { await api.patch('/exams/' + id, payload) }
      else { const res = await api.post('/exams', payload); examId = res.data.exam.id }
      if (publish) { await api.post('/exams/' + examId + '/publish'); toast.success('Exam created and published!') }
      else { toast.success(isEdit ? 'Exam updated!' : 'Exam saved as draft!') }
      navigate('/exams')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const aptCount = selectedQIds.filter(qid => qResults.find(q => q.id === qid && q.section === 'aptitude_reasoning')).length
  const verCount = selectedQIds.filter(qid => qResults.find(q => q.id === qid && q.section === 'verbal')).length

  return (
    <div className="fade-in max-w-6xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="btn-secondary p-2"><ArrowLeft size={18} /></button>
          <h1 className="page-title">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(!showTemplates)} className="btn-secondary">
            Templates {templates.length > 0 && <span className="ml-1 text-xs font-bold">({templates.length})</span>}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary"><Save size={16} /> Save Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary" style={{ background: 'var(--color-success)' }}>
            {saving ? <div className="spinner w-4 h-4" /> : <Plus size={16} />} Save & Publish
          </button>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Saved Templates</h3>
            <button onClick={() => setShowSaveTemplate(!showSaveTemplate)} className="btn-secondary text-xs">+ Save current as template</button>
          </div>
          {showSaveTemplate && (
            <div className="flex gap-2 mb-3">
              <input className="input" placeholder="Template name e.g. Standard CE 25Q" value={templateName} onChange={e => setTemplateName(e.target.value)} />
              <button onClick={handleSaveTemplate} disabled={savingTemplate} className="btn-primary text-sm">Save</button>
            </div>
          )}
          {templates.length === 0
            ? <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No templates yet. Save an exam config as a template for quick reuse.</p>
            : <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map(t => (
                  <div key={t.id} onClick={() => applyTemplate(t)}
                    className="p-3 rounded-xl border cursor-pointer transition-all hover:border-primary"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{t.name}</div>
                      <button onClick={(e) => deleteTemplate(t.id, e)} className="p-0.5 text-xs" style={{ color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t.exam_type} · {t.duration_minutes}min · {t.aptitude_count}A+{t.verbal_count}V
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t.marks_per_question}m {t.negative_marking ? '· -' + t.negative_marks + ' neg' : '· no neg'}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Exam Details</h3>
            <div className="space-y-3">
              <div><label className="label">Title *</label><input className="input" placeholder="e.g. Mock CAT - Batch A" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div><label className="label">Description</label><textarea className="input" rows={2} placeholder="Optional instructions..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Exam Type *</label>
                  <select className="input" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
                    <option value="CE">Campus Engagement</option><option value="Practice">Practice</option>
                    <option value="Mid Term">Mid Term</option><option value="End Term">End Term</option>
                  </select>
                </div>
                <div><label className="label">University *</label>
                  <select className="input" value={form.university} onChange={e => setForm({...form, university: e.target.value})}>
                    <option value="BOTH">Both</option><option value="MRIIRS">MRIIRS</option><option value="MRU">MRU</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Department</label><input className="input" placeholder="e.g. CSE" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
                <div><label className="label">Section/Batch</label><input className="input" placeholder="e.g. A, B" value={form.section_filter} onChange={e => setForm({...form, section_filter: e.target.value})} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Timing & Scoring</h3>
            <div className="space-y-3">
              <div><label className="label">Duration (minutes) *</label><input type="number" className="input" min={5} max={300} value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value)})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Time</label><input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} /></div>
                <div><label className="label">End Time</label><input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} /></div>
              </div>
              <div><label className="label">Marks per Question</label><input type="number" className="input" step={0.5} min={0.5} value={form.marks_per_question} onChange={e => setForm({...form, marks_per_question: parseFloat(e.target.value)})} /></div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.negative_marking} onChange={e => setForm({...form, negative_marking: e.target.checked})} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Negative Marking</span>
                </label>
                {form.negative_marking && <input type="number" className="input w-24" step={0.25} min={0.25} value={form.negative_marks} onChange={e => setForm({...form, negative_marks: parseFloat(e.target.value)})} />}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Anti-Cheat Options</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.randomize_questions} onChange={e => setForm({...form, randomize_questions: e.target.checked})} />
                <div><p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Randomize Question Order</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Each student gets different sequence</p></div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.randomize_options} onChange={e => setForm({...form, randomize_options: e.target.checked})} />
                <div><p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Randomize Options</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>A/B/C/D positions shuffled per student</p></div>
              </label>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'var(--color-primary)', borderWidth: '2px' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Selected Questions</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Total', selectedQIds.length, 'var(--color-primary)'], ['Aptitude', aptCount, 'var(--color-success)'], ['Verbal', verCount, 'var(--color-warning)']].map(([label, val, color]) => (
                <div key={label} className="p-2 rounded-lg" style={{ background: 'var(--color-surface2)' }}>
                  <div className="text-2xl font-bold" style={{ color }}>{val}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Total Marks: {(selectedQIds.length * form.marks_per_question).toFixed(1)}</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card h-full">
            <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Pick Questions ({selectedQIds.length} selected)</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <input className="input" placeholder="Search..." value={qSearch.search} onChange={e => setQSearch({...qSearch, search: e.target.value})} />
              <select className="input" value={qSearch.section} onChange={e => setQSearch({...qSearch, section: e.target.value})}>
                <option value="">All Sections</option><option value="aptitude_reasoning">Aptitude</option><option value="verbal">Verbal</option>
              </select>
              <input className="input" placeholder="Topic..." value={qSearch.topic} onChange={e => setQSearch({...qSearch, topic: e.target.value})} />
            </div>
            <div className="flex gap-2 mb-3">
              <button className="btn-secondary text-xs" onClick={() => setSelectedQIds(qResults.map(q => q.id))}>Select All ({qResults.length})</button>
              <button className="btn-secondary text-xs" onClick={() => setSelectedQIds([])}>Clear All</button>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {qLoading ? <div className="flex justify-center py-8"><div className="spinner" /></div>
                : qResults.map(q => {
                  const selected = selectedQIds.includes(q.id)
                  return (
                    <div key={q.id} onClick={() => !q.is_locked && toggleQuestion(q)}
                      className="flex items-start gap-3 p-3 rounded-xl transition-all border-2"
                      style={{ borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', background: selected ? 'var(--color-primary)10' : 'var(--color-surface)', cursor: q.is_locked ? 'default' : 'pointer', opacity: q.is_locked ? 0.6 : 1 }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: selected ? 'var(--color-primary)' : 'var(--color-surface2)' }}>
                        {selected && <Check size={14} color="white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text)' }}>{q.question_text}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="badge badge-info text-xs">{q.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{q.topic}</span>
                          <span className={`badge text-xs ${q.difficulty==='easy' ? 'badge-success' : q.difficulty==='hard' ? 'badge-danger' : 'badge-warning'}`}>{q.difficulty}</span>
                          {q.is_locked && <span className="badge badge-warning text-xs">🔒 locked</span>}
                          {q.trainer_name && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>by {q.trainer_name}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
