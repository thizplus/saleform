import { BrowserRouter } from 'react-router-dom'
import {
  useBootstrapAuth,
  LoadingPage,
  NotInLinePage,
  RegisterPage,
  PendingPage,
  InactivePage,
} from '@/features/auth'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  const { status, retry } = useBootstrapAuth()

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

  // status === 'ready' → แสดงแอปจริง
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
