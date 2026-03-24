import { useState } from 'react'
import { Eye, EyeOff, Save, Palette, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { THEMES, applyTheme } from '../themes'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { trainer } = useAuth()
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

  return (
    <div className="fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

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
    </div>
  )
}
