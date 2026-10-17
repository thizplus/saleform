import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/features/sites/pages/HomePage'
import { LiffTestPage } from '@/features/auth/pages/LiffTestPage'
import { NewReportPage, SuccessPage } from '@/features/report-new'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewReportPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/test" element={<LiffTestPage />} />
    </Routes>
  )
}
