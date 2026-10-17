import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/features/auth'
import { SitesPage } from '@/features/sites'
import { RepsPage } from '@/features/reps'
import { OptionsPage } from '@/features/options'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<SitesPage />} />
        <Route path="/reps" element={<RepsPage />} />
        <Route path="/options" element={<OptionsPage />} />
      </Route>
    </Routes>
  )
}
