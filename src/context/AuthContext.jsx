import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [trainer, setTrainer] = useState(() => {
    const saved = localStorage.getItem('cdc_trainer')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
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

  const isMasterAdmin = trainer?.role === 'master_admin'
  const isSuperAdmin  = trainer?.role === 'super_admin' || trainer?.role === 'master_admin'
  const isGranter     = trainer?.role === 'master_admin'

  return (
    <AuthContext.Provider value={{ trainer, login, logout, loading, isMasterAdmin, isSuperAdmin, isGranter }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
