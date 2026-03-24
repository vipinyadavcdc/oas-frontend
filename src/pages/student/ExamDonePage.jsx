import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ExamDonePage() {
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('cdc_done')
    if (raw) { setInfo(JSON.parse(raw)); sessionStorage.removeItem('cdc_done') }
    // Clear exam session
    sessionStorage.removeItem('cdc_session')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 28px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid #e5e7eb' }}>

        {/* Tick */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18.5L15 25.5L28 11" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>Exam Submitted!</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
          Your responses have been recorded successfully.<br/>Results will be shared by your trainer.
        </p>

        {info && (
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
            {[
              ['Name', info.name],
              ['Roll No.', info.roll_number],
              ['Exam', info.exam_title],
              ['Time taken', info.time_taken ? Math.floor(info.time_taken / 60) + ' min ' + (info.time_taken % 60) + ' sec' : '—'],
              ['Questions attempted', info.attempted !== undefined ? info.attempted + ' of ' + info.total : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', padding: '4px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                <span style={{ color: '#9ca3af' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#111' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 12, color: '#9ca3af' }}>You may now close this tab.</p>
      </div>
    </div>
  )
}
