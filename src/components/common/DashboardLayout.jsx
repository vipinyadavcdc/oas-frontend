import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, FileText, BookOpen, Users, Shield, Settings, LogOut, Menu, X, History, BarChart2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ThemeSwitcher from './ThemeSwitcher'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exams',     icon: FileText,         label: 'Exams' },
  { to: '/questions', icon: BookOpen,         label: 'Question Bank' },
  { to: '/students',  icon: History,       label: 'Student History' },
]
const analysisItem = { to: '/analysis', icon: BarChart2, label: 'Analysis' }
const adminItems = [
  { to: '/trainers', icon: Users,  label: 'Trainers' },
  { to: '/audit',    icon: Shield, label: 'Audit Log' },
]

export default function DashboardLayout() {
  const { trainer, logout, isSuperAdmin } = useAuth()
  const isAnalysisUser = ['vipinyadav.cdc@mriu.edu.in', 'ankurkumaraggarwal@mru.edu.in'].includes(trainer?.email?.toLowerCase())
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--color-primary)' }}>CDC</div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Exam Portal</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>MREI · v2</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--color-text-muted)' }}>Main</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => 'sidebar-link ' + (isActive ? 'active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}

        {isAnalysisUser && (
          <NavLink to="/analysis"
            className={({ isActive }) => 'sidebar-link ' + (isActive ? 'active' : '')}
            onClick={() => setSidebarOpen(false)}>
            <BarChart2 size={18} /><span>Analysis</span>
          </NavLink>
        )}

        {isSuperAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-5" style={{ color: 'var(--color-text-muted)' }}>Admin</div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => 'sidebar-link ' + (isActive ? 'active' : '')}
                onClick={() => setSidebarOpen(false)}>
                <Icon size={18} /><span>{label}</span>
              </NavLink>
            ))}
          </>
        )}

        <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-5" style={{ color: 'var(--color-text-muted)' }}>Account</div>
        <NavLink to="/settings" className={({ isActive }) => 'sidebar-link ' + (isActive ? 'active' : '')} onClick={() => setSidebarOpen(false)}>
          <Settings size={18} /><span>Settings</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--color-primary)' }}>
            {trainer?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{trainer?.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {trainer?.emp_id} · {trainer?.role === 'super_admin' ? '⭐ Super Admin' : 'Trainer'}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--color-danger)' }}>
          <LogOut size={16} /><span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 h-full" style={{ background: 'var(--color-surface)' }}>
            <button className="absolute top-4 right-4 p-1" onClick={() => setSidebarOpen(false)}><X size={20} style={{ color: 'var(--color-text-muted)' }} /></button>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}><Menu size={22} style={{ color: 'var(--color-text)' }} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{trainer?.university || 'MREI'}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
