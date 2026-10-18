import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/features/auth'
import { SitesPage, SiteDetailPage } from '@/features/sites'
import { RepsPage } from '@/features/reps'
import { OptionsPage } from '@/features/options'
import { FollowUpsPage } from '@/features/followups'
import { DashboardPage } from '@/features/dashboard'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/reports" element={<PlaceholderPage title="รายงาน" description="รายงานประสิทธิภาพ — กำลังพัฒนา" />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:code" element={<SiteDetailPage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/reps" element={<RepsPage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/users" element={<PlaceholderPage title="ผู้ใช้ระบบ" description="จัดการผู้ใช้ระบบ — กำลังพัฒนา" />} />
      </Route>
    </Routes>
  )
}
