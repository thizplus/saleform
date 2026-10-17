import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/features/sites/pages/HomePage'
import { NewReportPage, SuccessPage } from '@/features/report-new'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewReportPage />} />
      <Route path="/success" element={<SuccessPage />} />
      {/* Deep link จากการ์ดในกลุ่ม LINE */}
      <Route path="/sites/:code" element={<div>TODO: SiteDetailPage (L-06)</div>} />
    </Routes>
  )
}
