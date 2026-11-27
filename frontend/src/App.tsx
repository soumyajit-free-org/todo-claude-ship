import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, authError, retry, logout } = useAuth()
  if (isLoading) return <p className="loading" role="status">Loading…</p>
  if (authError)
    return (
      <div role="alert" className="error auth-error">
        <p>{authError}</p>
        <button type="button" onClick={retry}>Retry</button>
        <button type="button" onClick={logout}>Log out</button>
      </div>
    )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
