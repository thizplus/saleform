import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'
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
  if (pathname.startsWith('/sites/')) return 'รายละเอียดหน้างาน'
  if (pathname.startsWith('/reports/')) return 'รายงานรายบุคคล'
  return 'Admin'
}

function useSidebarBadges() {
  // นับงานเลยกำหนด
  const { data: overdueData } = useQuery({
    queryKey: ['sidebar-badge', 'overdue'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { total: number } }>(ADMIN_ROUTES.SITES, {
        params: { tab: 'overdue', limit: 1 },
      })
      return res.data.data.total
    },
    refetchInterval: 60_000, // refresh ทุก 1 นาที
  })

  // นับเซลล์รออนุมัติ
  const { data: repsData } = useQuery({
    queryKey: ['sidebar-badge', 'pending-reps'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ status: string }> }>(ADMIN_ROUTES.REPS)
      return res.data.data.filter((r) => r.status === 'pending').length
    },
    refetchInterval: 60_000,
  })

  return {
    overdue: overdueData ?? 0,
    pendingReps: repsData ?? 0,
  }
}

export function AdminLayout() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const badges = useSidebarBadges()

  return (
    <SidebarProvider>
      <AppSidebar badges={badges} />
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
