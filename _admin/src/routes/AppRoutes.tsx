import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/features/auth'
import { SitesPage, SiteDetailPage } from '@/features/sites'
import { FollowUpsPage } from '@/features/followups'
import { DashboardPage } from '@/features/dashboard'
import { PerformancePage } from '@/features/performance'
import { AreasPage } from '@/features/areas'
import { LostPage } from '@/features/lost'
import { RepsPage } from '@/features/reps'
import { OptionsPage } from '@/features/options'
import { UsersPage } from '@/features/users'
import { CheckInsPage } from '@/features/checkins'
import { DailySummarySettingsPage } from '@/features/settings'

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
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/performance/:repId" element={<PerformancePage />} />
        <Route path="/areas" element={<AreasPage />} />
        <Route path="/lost" element={<LostPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:code" element={<SiteDetailPage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/reps" element={<RepsPage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/check-ins" element={<CheckInsPage />} />
        <Route path="/daily-summary" element={<DailySummarySettingsPage />} />
      </Route>
    </Routes>
  )
}
