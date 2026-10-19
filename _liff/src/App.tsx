import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import {
  useBootstrapAuth,
  LoadingPage,
  NotInLinePage,
  RegisterPage,
  PendingPage,
  InactivePage,
} from '@/features/auth'
import { CheckInPage } from '@/features/checkin'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  const { status, retry } = useBootstrapAuth()
  const [checkedIn, setCheckedIn] = useState(false)

  // Auth states — แสดงหน้าจอตาม status
  if (status === 'loading' || status === 'slow' || status === 'error') {
    return <LoadingPage status={status} onRetry={retry} />
  }
  if (status === 'not-in-line') {
    return <NotInLinePage />
  }
  if (status === 'register') {
    return <RegisterPage onSuccess={retry} />
  }
  if (status === 'pending') {
    return <PendingPage onApproved={retry} />
  }
  if (status === 'inactive') {
    return <InactivePage />
  }

  // Check-in gate — เช็คอินก่อนเริ่มงาน
  if (!checkedIn) {
    return <CheckInPage onDone={() => setCheckedIn(true)} />
  }

  // status === 'ready' + checked in → แสดงแอปจริง
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
