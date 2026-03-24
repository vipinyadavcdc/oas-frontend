import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Enter Email Address and password')
    const res = await login(form.email, form.password)
    if (res.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-lg"
               style={{ background: 'var(--color-primary)' }}>
            CDC
          </div>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
            Exam Portal
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Career Development Centre — MREI
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-xl">
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            Trainer Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                placeholder="vipin.cdc@mriu.edu.in"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Default password is your Email Address
              </p>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <div className="spinner w-4 h-4" /> : <LogIn size={18} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Students don't need to login — use the exam link given by your trainer
        </p>
      </div>
    </div>
  )
}
