import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from './AppSidebar'

const PAGE_TITLES: Record<string, string> = {
  '': 'ภาพรวม',
  performance: 'ผลงานเซลล์',
  areas: 'พื้นที่',
  lost: 'สาเหตุจบที่อื่น',
  sites: 'หน้างาน',
  'follow-ups': 'ต้องติดตาม',
  reps: 'เซลล์',
  options: 'ตั้งค่าตัวเลือก',
  users: 'ผู้ใช้ระบบ',
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const seg = pathname.split('/')[1] ?? ''
  const title = PAGE_TITLES[seg] ?? ''

  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">UP Steel</span>
            <span className="text-muted-foreground">/</span>
            <span className="truncate font-bold">{title}</span>
          </nav>
        </header>
        <div className="mx-auto w-full max-w-[1400px] min-w-0 space-y-6 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
