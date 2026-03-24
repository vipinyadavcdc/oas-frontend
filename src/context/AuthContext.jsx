import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [trainer, setTrainer] = useState(() => {
    const saved = localStorage.getItem('cdc_trainer')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (emp_id, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { emp_id, password })
      const { token, trainer } = res.data
      localStorage.setItem('cdc_token', token)
      localStorage.setItem('cdc_trainer', JSON.stringify(trainer))
      setTrainer(trainer)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('cdc_token')
    localStorage.removeItem('cdc_trainer')
    setTrainer(null)
  }

  const isSuperAdmin = trainer?.role === 'super_admin'
  const isGranter = ['EMP001', 'EMP002'].includes(trainer?.emp_id) // Vipin & Ankur

  return (
    <AuthContext.Provider value={{ trainer, login, logout, loading, isSuperAdmin, isGranter }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
