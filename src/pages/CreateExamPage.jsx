import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Check, AlertTriangle, BookOpen } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const APTITUDE_TOPICS = [
  { topic: 'Number System (General)', tag: 'NS' },
  { topic: 'Unit Digit', tag: 'UD' },
  { topic: 'Remainder Theorem', tag: 'RT' },
  { topic: 'Factorial', tag: 'FAC' },
  { topic: 'LCM & HCF', tag: 'LCM' },
  { topic: 'Divisibility', tag: 'DIV' },
  { topic: 'Profit & Loss', tag: 'PL' },
  { topic: 'Discount', tag: 'DISC' },
  { topic: 'Simple Interest', tag: 'SI' },
  { topic: 'Compound Interest', tag: 'CI' },
  { topic: 'Time & Work', tag: 'TW' },
  { topic: 'Pipes & Cisterns', tag: 'PC' },
  { topic: 'Speed Distance Time', tag: 'SDT' },
  { topic: 'Boats & Streams', tag: 'BS' },
  { topic: 'Trains', tag: 'TRN' },
  { topic: 'Percentage', tag: 'PCT' },
  { topic: 'Ratio & Proportion', tag: 'RP' },
  { topic: 'Averages', tag: 'AVG' },
  { topic: 'Mixtures & Alligation', tag: 'MIX' },
  { topic: 'Partnership', tag: 'PART' },
  { topic: 'Ages', tag: 'AGE' },
  { topic: 'Simplification', tag: 'SIMP' },
  { topic: 'Approximation', tag: 'APPRX' },
  { topic: 'Quadratic Equations', tag: 'QE' },
  { topic: 'Surds & Indices', tag: 'SURD' },
  { topic: 'Mensuration 2D', tag: 'MEN2' },
  { topic: 'Mensuration 3D', tag: 'MEN3' },
  { topic: 'Probability', tag: 'PROB' },
  { topic: 'Permutation & Combination', tag: 'PNC' },
  { topic: 'Series & Sequences', tag: 'SEQ' },
  { topic: 'Coding Decoding', tag: 'CD' },
  { topic: 'Blood Relations', tag: 'BR' },
  { topic: 'Direction Sense', tag: 'DS' },
  { topic: 'Seating Arrangement', tag: 'SEAT' },
  { topic: 'Puzzles', tag: 'PUZ' },
  { topic: 'Syllogism', tag: 'SYL' },
  { topic: 'Inequalities', tag: 'INEQ' },
  { topic: 'Input Output', tag: 'IO' },
  { topic: 'Analogies (Reasoning)', tag: 'ANA' },
  { topic: 'Classification', tag: 'CLS' },
  { topic: 'Number Series', tag: 'NSER' },
  { topic: 'Statement & Conclusion', tag: 'STC' },
  { topic: 'Cause & Effect', tag: 'CAE' },
  { topic: 'Critical Reasoning', tag: 'CR' },
]

const VERBAL_TOPICS = [
  { topic: 'Synonyms', tag: 'SYN' },
  { topic: 'Antonyms', tag: 'ANT' },
  { topic: 'Analogies (Verbal)', tag: 'VANA' },
  { topic: 'Spotting Errors', tag: 'SE' },
  { topic: 'Sentence Correction', tag: 'SCOR' },
  { topic: 'Fill in the Blanks', tag: 'FIB' },
  { topic: 'Cloze Test', tag: 'CLZ' },
  { topic: 'Idioms & Phrases', tag: 'IP' },
  { topic: 'One Word Substitution', tag: 'OWS' },
  { topic: 'Word Meaning in Context', tag: 'WMC' },
  { topic: 'Para Jumbles', tag: 'PJ' },
  { topic: 'Para Summary', tag: 'PS' },
]

const STEPS = ['Exam Details', 'Domain Setup', 'Aptitude Topics', 'Verbal Topics', 'Review & Publish']

export default function CreateExamPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', exam_type: 'CE', university: 'BOTH',
    department: '', section_filter: '', duration_minutes: 60,
    start_time: '', end_time: '',
    marks_per_question: 1, negative_marking: false, negative_marks: 0.25,
    randomize_questions: true, randomize_options: true
  })

  // Domain counts
  const [aptTotal, setAptTotal] = useState(15)
  const [verTotal, setVerTotal] = useState(10)

  // Topic selections: { tag: { easy: n, medium: n, hard: n } }
  const [aptSel, setAptSel] = useState({})
  const [verSel, setVerSel] = useState({})

  // Pool availability: { tag_easy: count, tag_medium: count, tag_hard: count }
  const [pool, setPool] = useState({})
  const [poolLoading, setPoolLoading] = useState(false)

  useEffect(() => { if (isEdit) loadExam() }, [id])

  // Load pool counts whenever we move to step 2 or 3
  useEffect(() => {
    if (step === 2 || step === 3) loadPool()
  }, [step])

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
    } catch { toast.error('Failed to load exam') }
  }

  const loadPool = async () => {
    setPoolLoading(true)
    try {
      const res = await api.get('/questions', { params: { limit: 5000 } })
      const counts = {}
      res.data.questions.forEach(q => {
        const key = q.tag + '_' + q.difficulty
        counts[key] = (counts[key] || 0) + 1
      })
      setPool(counts)
    } catch {}
    finally { setPoolLoading(false) }
  }

  const toggleTopic = (tag, section) => {
    if (section === 'apt') {
      setAptSel(prev => {
        if (prev[tag]) { const n = {...prev}; delete n[tag]; return n }
        return { ...prev, [tag]: { easy: 0, medium: 0, hard: 0 } }
      })
    } else {
      setVerSel(prev => {
        if (prev[tag]) { const n = {...prev}; delete n[tag]; return n }
        return { ...prev, [tag]: { easy: 0, medium: 0, hard: 0 } }
      })
    }
  }

  const updateDiff = (tag, diff, val, section) => {
    const v = Math.max(0, parseInt(val) || 0)
    if (section === 'apt') setAptSel(prev => ({ ...prev, [tag]: { ...prev[tag], [diff]: v } }))
    else setVerSel(prev => ({ ...prev, [tag]: { ...prev[tag], [diff]: v } }))
  }

  const aptSelected = Object.values(aptSel).reduce((s, t) => s + t.easy + t.medium + t.hard, 0)
  const verSelected = Object.values(verSel).reduce((s, t) => s + t.easy + t.medium + t.hard, 0)

  const getPoolCount = (tag, diff) => pool[tag + '_' + diff] || 0

  const getWarnings = () => {
    const warns = []
    Object.entries(aptSel).forEach(([tag, d]) => {
      ['easy','medium','hard'].forEach(diff => {
        if (d[diff] > 0 && d[diff] > getPoolCount(tag, diff)) {
          warns.push(`${tag} ${diff}: need ${d[diff]}, only ${getPoolCount(tag, diff)} available`)
        }
      })
    })
    Object.entries(verSel).forEach(([tag, d]) => {
      ['easy','medium','hard'].forEach(diff => {
        if (d[diff] > 0 && d[diff] > getPoolCount(tag, diff)) {
          warns.push(`${tag} ${diff}: need ${d[diff]}, only ${getPoolCount(tag, diff)} available`)
        }
      })
    })
    return warns
  }

  const canNext = () => {
    if (step === 0) return form.title.trim().length > 0
    if (step === 1) return aptTotal + verTotal > 0
    if (step === 2) return aptTotal === 0 || aptSelected === aptTotal
    if (step === 3) return verTotal === 0 || verSelected === verTotal
    return true
  }

  const handleSave = async (publish = false) => {
    if (getWarnings().length > 0) return toast.error('Fix pool warnings before publishing')
    setSaving(true)
    try {
      // Build question selection payload
      const questionSpec = []
      Object.entries(aptSel).forEach(([tag, d]) => {
        ['easy','medium','hard'].forEach(diff => {
          if (d[diff] > 0) questionSpec.push({ tag, difficulty: diff, count: d[diff], section: 'aptitude_reasoning' })
        })
      })
      Object.entries(verSel).forEach(([tag, d]) => {
        ['easy','medium','hard'].forEach(diff => {
          if (d[diff] > 0) questionSpec.push({ tag, difficulty: diff, count: d[diff], section: 'verbal' })
        })
      })

      const payload = {
        ...form,
        question_spec: questionSpec,
        aptitude_count: aptSelected,
        verbal_count: verSelected,
        total_questions: aptSelected + verSelected,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null
      }

      let examId = id
      if (isEdit) {
        await api.patch('/exams/' + id, payload)
      } else {
        const res = await api.post('/exams', payload)
        examId = res.data.exam.id
      }
      if (publish) {
        await api.post('/exams/' + examId + '/publish')
        toast.success('Exam published successfully!')
      } else {
        toast.success('Exam saved as draft!')
      }
      navigate('/exams')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save exam')
    } finally {
      setSaving(false)
    }
  }

  const TopicCard = ({ tag, topic, sel, onToggle, onUpdate, section }) => {
    const isSelected = Boolean(sel[tag])
    const d = sel[tag] || { easy: 0, medium: 0, hard: 0 }
    const total = d.easy + d.medium + d.hard
    const poolE = getPoolCount(tag, 'easy')
    const poolM = getPoolCount(tag, 'medium')
    const poolH = getPoolCount(tag, 'hard')
    const hasWarning = (d.easy > poolE) || (d.medium > poolM) || (d.hard > poolH)

    return (
      <div style={{
        border: `2px solid ${isSelected ? (hasWarning ? 'var(--color-danger)' : 'var(--color-primary)') : 'var(--color-border)'}`,
        borderRadius: 12, padding: '12px', background: isSelected ? 'var(--color-surface2)' : 'var(--color-surface)',
        transition: 'all 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isSelected ? 10 : 0, cursor: 'pointer' }}
          onClick={() => onToggle(tag)}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: isSelected ? 'var(--color-primary)' : 'var(--color-surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isSelected && <Check size={12} color="white" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{topic}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {tag} · Pool: {poolE}E {poolM}M {poolH}H
            </div>
          </div>
          {isSelected && total > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: hasWarning ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {total}Q
            </span>
          )}
        </div>

        {isSelected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[['easy','E','var(--color-success)'], ['medium','M','var(--color-warning)'], ['hard','H','var(--color-danger)']].map(([diff, label, color]) => (
              <div key={diff}>
                <div style={{ fontSize: 10, color, fontWeight: 600, marginBottom: 3, textAlign: 'center' }}>
                  {label} ({getPoolCount(tag, diff)})
                </div>
                <input type="number" min={0} max={getPoolCount(tag, diff)} value={d[diff]}
                  onChange={e => onUpdate(tag, diff, e.target.value, section)}
                  style={{
                    width: '100%', padding: '4px 6px', border: `1px solid ${d[diff] > getPoolCount(tag, diff) ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 6, fontSize: 13, fontWeight: 700, textAlign: 'center',
                    background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none'
                  }} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/exams')} className="btn-secondary" style={{ padding: 8 }}><ArrowLeft size={18} /></button>
          <h1 className="page-title">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {step === 4 && <>
            <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary"><Save size={16} /> Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving || getWarnings().length > 0} className="btn-primary" style={{ background: 'var(--color-success)' }}>
              {saving ? <div className="spinner w-4 h-4" /> : <Check size={16} />} Publish Exam
            </button>
          </>}
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: 4, borderRadius: 2, marginBottom: 6,
              background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
              transition: 'background 0.3s'
            }} />
            <div style={{ fontSize: 10, color: i === step ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: i === step ? 700 : 400 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {/* STEP 0 — Exam Details */}
      {step === 0 && (
        <div className="card">
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>Exam Details</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. Mock CAT - Batch A" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} placeholder="Optional instructions..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Exam Type *</label>
                <select className="input" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
                  <option value="CE">Campus Engagement</option>
                  <option value="Practice">Practice</option>
                  <option value="Mid Term">Mid Term</option>
                  <option value="End Term">End Term</option>
                </select>
              </div>
              <div>
                <label className="label">University *</label>
                <select className="input" value={form.university} onChange={e => setForm({...form, university: e.target.value})}>
                  <option value="BOTH">Both</option>
                  <option value="MRIIRS">MRIIRS</option>
                  <option value="MRU">MRU</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Department</label>
                <input className="input" placeholder="e.g. CSE" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
              </div>
              <div>
                <label className="label">Section/Batch</label>
                <input className="input" placeholder="e.g. A, B" value={form.section_filter} onChange={e => setForm({...form, section_filter: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Duration (min) *</label>
                <input type="number" className="input" min={5} max={300} value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Marks per Question</label>
                <input type="number" className="input" step={0.5} min={0.5} value={form.marks_per_question} onChange={e => setForm({...form, marks_per_question: parseFloat(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.negative_marking} onChange={e => setForm({...form, negative_marking: e.target.checked})} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Negative Marking</span>
                  {form.negative_marking && (
                    <input type="number" className="input" style={{ width: 80 }} step={0.25} min={0.25} value={form.negative_marks} onChange={e => setForm({...form, negative_marks: parseFloat(e.target.value)})} />
                  )}
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.randomize_questions} onChange={e => setForm({...form, randomize_questions: e.target.checked})} />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>Randomize Question Order</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.randomize_options} onChange={e => setForm({...form, randomize_options: e.target.checked})} />
                <span className="text-sm" style={{ color: 'var(--color-text)' }}>Randomize Options</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — Domain Setup */}
      {step === 1 && (
        <div className="card">
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>How many questions from each domain?</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Set to 0 if you don't want that section in this exam.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--color-surface2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>🧮</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--color-text)' }}>Aptitude & Reasoning</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>44 topics available</div>
              <input type="number" min={0} max={200} value={aptTotal}
                onChange={e => setAptTotal(parseInt(e.target.value) || 0)}
                style={{ width: 100, padding: '10px', border: '2px solid var(--color-primary)', borderRadius: 8, fontSize: 24, fontWeight: 700, textAlign: 'center', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>questions</div>
            </div>
            <div style={{ background: 'var(--color-surface2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--color-text)' }}>Verbal</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>12 topics available</div>
              <input type="number" min={0} max={200} value={verTotal}
                onChange={e => setVerTotal(parseInt(e.target.value) || 0)}
                style={{ width: 100, padding: '10px', border: '2px solid var(--color-warning)', borderRadius: 8, fontSize: 24, fontWeight: 700, textAlign: 'center', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>questions</div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: 16, background: 'var(--color-surface2)', borderRadius: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Total: {aptTotal + verTotal} questions</span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 12 }}>
              · Marks: {((aptTotal + verTotal) * form.marks_per_question).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* STEP 2 — Aptitude Topics */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Select Aptitude Topics</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pick topics and set easy/medium/hard count. Pool size shown in brackets.</p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14,
              background: aptSelected === aptTotal ? 'var(--color-success)20' : aptSelected > aptTotal ? 'var(--color-danger)20' : 'var(--color-surface2)',
              color: aptSelected === aptTotal ? 'var(--color-success)' : aptSelected > aptTotal ? 'var(--color-danger)' : 'var(--color-text)',
              border: `1px solid ${aptSelected === aptTotal ? 'var(--color-success)' : aptSelected > aptTotal ? 'var(--color-danger)' : 'var(--color-border)'}`
            }}>
              {aptSelected} / {aptTotal} selected
            </div>
          </div>
          {poolLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner w-8 h-8" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {APTITUDE_TOPICS.map(({ topic, tag }) => (
                <TopicCard key={tag} tag={tag} topic={topic} sel={aptSel} onToggle={t => toggleTopic(t, 'apt')} onUpdate={updateDiff} section="apt" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Verbal Topics */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>Select Verbal Topics</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pick topics and set easy/medium/hard count. Pool size shown in brackets.</p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14,
              background: verSelected === verTotal ? 'var(--color-success)20' : verSelected > verTotal ? 'var(--color-danger)20' : 'var(--color-surface2)',
              color: verSelected === verTotal ? 'var(--color-success)' : verSelected > verTotal ? 'var(--color-danger)' : 'var(--color-text)',
              border: `1px solid ${verSelected === verTotal ? 'var(--color-success)' : verSelected > verTotal ? 'var(--color-danger)' : 'var(--color-border)'}`
            }}>
              {verSelected} / {verTotal} selected
            </div>
          </div>
          {poolLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner w-8 h-8" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {VERBAL_TOPICS.map(({ topic, tag }) => (
                <TopicCard key={tag} tag={tag} topic={topic} sel={verSel} onToggle={t => toggleTopic(t, 'ver')} onUpdate={updateDiff} section="ver" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Review */}
      {step === 4 && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>Exam Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              {[
                ['Title', form.title],
                ['Type', form.exam_type],
                ['University', form.university],
                ['Duration', form.duration_minutes + ' minutes'],
                ['Marks/Q', form.marks_per_question],
                ['Negative', form.negative_marking ? '-' + form.negative_marks : 'No'],
                ['Total Questions', aptSelected + verSelected],
                ['Total Marks', ((aptSelected + verSelected) * form.marks_per_question).toFixed(1)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {aptSelected > 0 && (
            <div className="card">
              <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>Aptitude Breakdown ({aptSelected} questions)</h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(aptSel).filter(([_, d]) => d.easy + d.medium + d.hard > 0).map(([tag, d]) => (
                  <div key={tag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>{APTITUDE_TOPICS.find(t => t.tag === tag)?.topic} ({tag})</span>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                      {d.easy > 0 && <span style={{ color: 'var(--color-success)' }}>{d.easy}E</span>}
                      {d.medium > 0 && <span style={{ color: 'var(--color-warning)' }}>{d.medium}M</span>}
                      {d.hard > 0 && <span style={{ color: 'var(--color-danger)' }}>{d.hard}H</span>}
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{d.easy + d.medium + d.hard}Q</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verSelected > 0 && (
            <div className="card">
              <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>Verbal Breakdown ({verSelected} questions)</h3>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(verSel).filter(([_, d]) => d.easy + d.medium + d.hard > 0).map(([tag, d]) => (
                  <div key={tag} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--color-surface2)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>{VERBAL_TOPICS.find(t => t.tag === tag)?.topic} ({tag})</span>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                      {d.easy > 0 && <span style={{ color: 'var(--color-success)' }}>{d.easy}E</span>}
                      {d.medium > 0 && <span style={{ color: 'var(--color-warning)' }}>{d.medium}M</span>}
                      {d.hard > 0 && <span style={{ color: 'var(--color-danger)' }}>{d.hard}H</span>}
                      <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{d.easy + d.medium + d.hard}Q</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {getWarnings().length > 0 && (
            <div style={{ background: 'var(--color-danger)15', border: '1px solid var(--color-danger)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-danger)', fontWeight: 700 }}>
                <AlertTriangle size={16} /> Pool Warnings — Not enough questions available
              </div>
              {getWarnings().map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 2 }}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back
        </button>
        {step < 4 ? (
          <button onClick={() => {
            if (step === 1 && aptTotal === 0) { setStep(3); return }
            setStep(s => s + 1)
          }}
            disabled={!canNext()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary"><Save size={16} /> Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving || getWarnings().length > 0} className="btn-primary" style={{ background: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <div className="spinner w-4 h-4" /> : <Check size={16} />} Publish Exam
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
