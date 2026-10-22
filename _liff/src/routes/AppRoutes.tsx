import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/features/sites/pages/HomePage'
import { SiteDetailPage } from '@/features/sites/pages/SiteDetailPage'
import { MyStatsPage } from '@/features/sites/pages/MyStatsPage'
import { NewReportPage, SuccessPage } from '@/features/report-new'
import { UpdateSitePage } from '@/features/site/UpdateSitePage'
import { EveningSummaryPage } from '@/features/checkin'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewReportPage />} />
      <Route path="/success" element={<SuccessPage />} />
      {/* Deep link จากการ์ดในกลุ่ม LINE */}
      <Route path="/sites/:code" element={<SiteDetailPage />} />
      {/* อัปเดตงาน */}
      <Route path="/sites/:code/update" element={<UpdateSitePage />} />
      {/* ผลงานของฉัน */}
      <Route path="/my-stats" element={<MyStatsPage />} />
      {/* สรุปงานประจำวัน */}
      <Route path="/evening-summary" element={<EveningSummaryPage />} />
    </Routes>
  )
}
