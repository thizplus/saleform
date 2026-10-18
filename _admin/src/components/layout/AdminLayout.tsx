import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { AppSidebar } from './AppSidebar'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'ภาพรวม',
  '/reports': 'รายงาน',
  '/sites': 'หน้างาน',
  '/follow-ups': 'ต้องติดตาม',
  '/reps': 'เซลล์',
  '/options': 'ตั้งค่าตัวเลือก',
  '/users': 'ผู้ใช้ระบบ',
}

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // /sites/XXX → หน้างาน > รายละเอียด
  if (pathname.startsWith('/sites/')) return 'รายละเอียดหน้างาน'
  if (pathname.startsWith('/reports/')) return 'รายงานรายบุคคล'
  return 'Admin'
}

export function AdminLayout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
