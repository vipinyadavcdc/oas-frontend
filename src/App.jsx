import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { loadSavedTheme } from './themes'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ExamsPage from './pages/ExamsPage'
import CreateExamPage from './pages/CreateExamPage'
import QuestionBankPage from './pages/QuestionBankPage'
import ResultsPage from './pages/ResultsPage'
import MonitorPage from './pages/MonitorPage'
import TrainersPage from './pages/TrainersPage'
import AuditPage from './pages/AuditPage'
import SettingsPage from './pages/SettingsPage'
import StudentHistoryPage from './pages/StudentHistoryPage'
import QuestionAnalyticsPage from './pages/QuestionAnalyticsPage'

import StudentEntryPage from './pages/student/StudentEntryPage'
import StudentExamPage from './pages/student/StudentExamPage'
import ExamDonePage from './pages/student/ExamDonePage'

import DashboardLayout from './components/common/DashboardLayout'

function ProtectedRoute({ children, superAdminOnly = false }) {
  const { trainer, isSuperAdmin } = useAuth()
  if (!trainer) return <Navigate to="/login" replace />
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { trainer } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={trainer ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/exam" element={<StudentEntryPage />} />
      <Route path="/exam/start" element={<StudentExamPage />} />
      <Route path="/exam/done" element={<ExamDonePage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="exams/create" element={<CreateExamPage />} />
        <Route path="exams/:id/edit" element={<CreateExamPage />} />
        <Route path="exams/:id/results" element={<ResultsPage />} />
        <Route path="exams/:id/monitor" element={<MonitorPage />} />
        <Route path="questions" element={<QuestionBankPage />} />
        <Route path="questions/analytics" element={<QuestionAnalyticsPage />} />
        <Route path="students" element={<StudentHistoryPage />} />
        <Route path="students/:rollNumber" element={<StudentHistoryPage />} />
        <Route path="trainers" element={<ProtectedRoute superAdminOnly><TrainersPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute superAdminOnly><AuditPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  useEffect(() => { loadSavedTheme() }, [])
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ style: { background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', fontFamily: 'Plus Jakarta Sans, sans-serif' } }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
