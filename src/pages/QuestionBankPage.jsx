import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Plus, Upload, Download, Search, BookOpen, Archive, Trash2, BarChart2, RotateCcw } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function QuestionBankPage() {
  const navigate = useNavigate()
  const { isMasterAdmin } = useAuth()
  const [tab, setTab] = useState('active')
  const [archived, setArchived] = useState([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ section: '', tag: '', difficulty: '', search: '' })
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [masterTags, setMasterTags] = useState([])

  const [newQ, setNewQ] = useState({
    section: 'aptitude_reasoning', topic: '', tag: '', question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', difficulty: 'medium'
  })

  useEffect(() => { loadQuestions() }, [filters, page])
  useEffect(() => {
    api.get('/questions/tags').then(r => setMasterTags(r.data.tags)).catch(() => {})
  }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...filters }
      const res = await api.get('/questions', { params })
      setQuestions(res.data.questions)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  const loadArchived = async () => {
    setArchivedLoading(true)
    try {
      const res = await api.get('/questions', { params: { archived: 'true', limit: 5000 } })
      setArchived(res.data.questions)
    } catch { toast.error('Failed to load archived questions') }
    finally { setArchivedLoading(false) }
  }

  const handleRestore = async (id) => {
    try {
      await api.patch('/questions/' + id, { is_archived: false, is_active: true })
      toast.success('Question restored!')
      setArchived(prev => prev.filter(q => q.id !== id))
    } catch { toast.error('Failed to restore') }
  }

  const handleHardDelete = async (id) => {
    if (!confirm('PERMANENTLY delete this question? This cannot be undone!')) return
    try {
      await api.delete('/questions/' + id)
      toast.success('Question permanently deleted')
      setArchived(prev => prev.filter(q => q.id !== id))
    } catch { toast.error('Failed to delete') }
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'archived') loadArchived()
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    try {
      await api.post('/questions', newQ)
      toast.success('Question added!')
      setShowAdd(false)
      setNewQ({ section: 'aptitude_reasoning', topic: '', tag: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', difficulty: 'medium' })
      loadQuestions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add question')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return
    try { await api.delete(`/questions/${id}`); toast.success('Deleted'); loadQuestions() }
    catch { toast.error('Failed to delete') }
  }

  const handleArchive = async (id) => {
    try { await api.patch(`/questions/${id}`, { is_archived: true }); toast.success('Archived'); loadQuestions() }
    catch { toast.error('Failed to archive') }
  }

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/questions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadResult(res.data)
      if (res.data.inserted > 0) { toast.success(`${res.data.inserted} questions uploaded!`); loadQuestions() }
      if (res.data.errors > 0) toast.error(`${res.data.errors} rows had errors`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setUploading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1
  })

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/questions/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'question_template.xlsx'; a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download template') }
  }

  const sectionTags = masterTags.filter(t =>
    filters.section === '' ||
    (filters.section === 'aptitude_reasoning' && !['SYN','ANT','VANA','SE','SCOR','FIB','CLZ','IP','OWS','WMC','RC','PJ','PS'].includes(t.tag)) ||
    (filters.section === 'verbal' && ['SYN','ANT','VANA','SE','SCOR','FIB','CLZ','IP','OWS','WMC','RC','PJ','PS'].includes(t.tag))
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{total} questions total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/questions/analytics')} className="btn-secondary"><BarChart2 size={16} /> Analytics</button>
          <button onClick={() => navigate('/questions/analytics')} className="btn-secondary"><BarChart2 size={16} /> Analytics</button>
          <button onClick={downloadTemplate} className="btn-secondary"><Download size={16} /> Template</button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus size={16} /> Add Question</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => handleTabChange('active')}
          className={tab === 'active' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: 13 }}>
          Active Questions
        </button>
        <button onClick={() => handleTabChange('archived')}
          className={tab === 'archived' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: 13 }}>
          <Archive size={14} /> Archived {archived.length > 0 && '(' + archived.length + ')'}
        </button>
        <button onClick={() => navigate('/questions/analytics')} className="btn-secondary" style={{ fontSize: 13, marginLeft: 'auto' }}>
          <BarChart2 size={14} /> Analytics
        </button>
      </div>

      {/* ARCHIVED TAB */}
      {tab === 'archived' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, color: 'var(--color-text)' }}>Archived Questions ({archived.length})</h3>
            <button onClick={loadArchived} className="btn-secondary" style={{ fontSize: 12 }}>Refresh</button>
          </div>
          {archivedLoading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : archived.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={40} className="mx-auto mb-3 opacity-30" />
              <p style={{ color: 'var(--color-text-muted)' }}>No archived questions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {archived.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--color-surface2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-text)', margin: 0 }}>{q.question_text}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      <span className="badge badge-info text-xs">{q.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{q.topic}</span>
                      <span className="badge badge-success text-xs font-mono">{q.tag}</span>
                      <span className={`badge text-xs ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleRestore(q.id)} title="Restore"
                      style={{ background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <RotateCcw size={13} /> Restore
                    </button>
                    {isMasterAdmin && (
                      <button onClick={() => handleHardDelete(q.id)} title="Permanently Delete"
                        style={{ background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'active' && <>
      {/* Upload */}
      <div className="card mb-5">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>Bulk Upload (Excel)</h3>
        <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{ borderColor: isDragActive ? 'var(--color-primary)' : 'var(--color-border)', background: isDragActive ? 'var(--color-surface2)' : 'transparent' }}>
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="spinner w-8 h-8" />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Uploading...</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {isDragActive ? 'Drop file here' : 'Drag & drop Excel or click to browse'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Download template first for correct format</p>
            </>
          )}
        </div>
        {uploadResult && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-surface2)' }}>
            <div className="flex gap-4 text-sm mb-3">
              <span className="text-green-600 font-semibold">{uploadResult.inserted} inserted</span>
              <span className="text-yellow-600 font-semibold">{uploadResult.duplicates} duplicates</span>
              <span className="text-red-600 font-semibold">{uploadResult.errors} errors</span>
            </div>
            {uploadResult.error_details?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>Error details:</p>
                {uploadResult.error_details.map((e, i) => (
                  <p key={i} className="text-xs font-mono p-1.5 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>
                    Row {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Question Form */}
      {showAdd && (
        <div className="card mb-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Add New Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="label">Section *</label>
                <select className="input" value={newQ.section} onChange={e => setNewQ({ ...newQ, section: e.target.value, topic: '', tag: '' })}>
                  <option value="aptitude_reasoning">Aptitude & Reasoning</option>
                  <option value="verbal">Verbal</option>
                </select>
              </div>
              <div>
                <label className="label">Topic *</label>
                <select className="input" value={newQ.topic}
                  onChange={e => {
                    const found = masterTags.find(t => t.topic === e.target.value)
                    setNewQ({ ...newQ, topic: e.target.value, tag: found ? found.tag : '' })
                  }} required>
                  <option value="">Select topic...</option>
                  {masterTags.map(t => (
                    <option key={t.tag} value={t.topic}>{t.topic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tag (auto-filled)</label>
                <input className="input" value={newQ.tag} readOnly
                  style={{ background: 'var(--color-surface2)', color: 'var(--color-success)', fontWeight: 'bold' }}
                  placeholder="Auto from topic" />
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input" value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Correct Answer *</label>
              <select className="input" value={newQ.correct_option} onChange={e => setNewQ({ ...newQ, correct_option: e.target.value })}>
                {['A','B','C','D'].map(o => <option key={o} value={o}>Option {o}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Question Text *</label>
              <textarea className="input" rows={3} placeholder="Enter question..." value={newQ.question_text}
                onChange={e => setNewQ({ ...newQ, question_text: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['A','B','C','D'].map(opt => (
                <div key={opt}>
                  <label className="label flex items-center gap-2">
                    Option {opt}
                    {newQ.correct_option === opt && <span className="text-green-600 text-xs font-bold">Correct</span>}
                  </label>
                  <input className="input" placeholder={`Option ${opt}`} value={newQ[`option_${opt.toLowerCase()}`]}
                    onChange={e => setNewQ({ ...newQ, [`option_${opt.toLowerCase()}`]: e.target.value })} required />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary"><Plus size={16} /> Add Question</button>
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input className="input pl-9" placeholder="Search questions..." value={filters.search}
              onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1) }} />
          </div>
          <select className="input" value={filters.section} onChange={e => { setFilters({ ...filters, section: e.target.value, tag: '' }); setPage(1) }}>
            <option value="">All Sections</option>
            <option value="aptitude_reasoning">Aptitude & Reasoning</option>
            <option value="verbal">Verbal</option>
          </select>
          <select className="input" value={filters.tag} onChange={e => { setFilters({ ...filters, tag: e.target.value }); setPage(1) }}>
            <option value="">All Tags</option>
            {sectionTags.map(t => (
              <option key={t.tag} value={t.tag}>{t.tag} — {t.topic}</option>
            ))}
          </select>
          <select className="input" value={filters.difficulty} onChange={e => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1) }}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button className="btn-secondary" onClick={() => { setFilters({ section: '', tag: '', difficulty: '', search: '' }); setPage(1) }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Questions Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p style={{ color: 'var(--color-text-muted)' }}>No questions found</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Question</th>
                    <th>Section</th>
                    <th>Topic</th>
                    <th>Tag</th>
                    <th>Difficulty</th>
                    <th>Answer</th>
                    <th>Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id}>
                      <td>
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text)' }}>{q.question_text}</p>
                      </td>
                      <td>
                        <span className="badge badge-info text-xs">
                          {q.section === 'aptitude_reasoning' ? 'Aptitude' : 'Verbal'}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{q.topic}</td>
                      <td>
                        <span className="badge badge-success text-xs font-mono font-bold">{q.tag || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-sm font-mono" style={{ color: 'var(--color-success)' }}>{q.correct_option}</span>
                      </td>
                      <td className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{q.usage_count}x</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => handleArchive(q.id)} title="Archive"
                            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-warning)' }}>
                            <Archive size={15} />
                          </button>
                          <button onClick={() => handleDelete(q.id)} title="Delete"
                            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" disabled={page===1} onClick={() => setPage(p => p-1)}>Prev</button>
                <button className="btn-secondary" disabled={page*20>=total} onClick={() => setPage(p => p+1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
    }
  )
}
