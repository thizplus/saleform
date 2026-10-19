import * as React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, CalendarCheck, CalendarClock, LayoutDashboard, MapPinned, Moon, SearchX, Settings, Sun, UserCog, Users,
  LogOut, ChevronsUpDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const NAV = [
  {
    label: 'รายงาน',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'ภาพรวม' },
      { to: '/performance', icon: BarChart3, label: 'ผลงานเซลล์' },
      { to: '/areas', icon: MapPinned, label: 'พื้นที่' },
      { to: '/lost', icon: SearchX, label: 'สาเหตุจบที่อื่น' },
    ],
  },
  {
    label: 'งาน',
    items: [
      { to: '/sites', icon: Building2, label: 'หน้างาน' },
      { to: '/follow-ups', icon: CalendarClock, label: 'ต้องติดตาม', badgeKey: 'overdue' as const },
    ],
  },
  {
    label: 'จัดการ',
    items: [
      { to: '/check-ins', icon: CalendarCheck, label: 'เช็คอิน' },
      { to: '/reps', icon: Users, label: 'เซลล์', badgeKey: 'pendingReps' as const },
      { to: '/options', icon: Settings, label: 'ตั้งค่าตัวเลือก' },
      { to: '/users', icon: UserCog, label: 'ผู้ใช้ระบบ' },
    ],
  },
]

function useSidebarBadges() {
  const { data: overdueData } = useQuery({
    queryKey: ['sidebar-badge', 'overdue'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { total: number } }>(ADMIN_ROUTES.SITES, {
        params: { tab: 'overdue', limit: 1 },
      })
      return res.data.data.total
    },
    refetchInterval: 60_000,
  })

  const { data: repsData } = useQuery({
    queryKey: ['sidebar-badge', 'pending-reps'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ status: string }> }>(ADMIN_ROUTES.REPS)
      return res.data.data.filter((r) => r.status === 'pending').length
    },
    refetchInterval: 60_000,
  })

  return { overdue: overdueData ?? 0, pendingReps: repsData ?? 0 }
}

function ThemeToggle() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains('dark'))
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch { /* */ }
  }, [dark])
  return (
    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => setDark((d) => !d)} aria-label="สลับธีม">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const badges = useSidebarBadges()

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xs font-black">UP</span>
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-bold">UP Steel</span>
                <span className="truncate text-xs text-muted-foreground">ระบบรายงานหน้างาน</span>
              </div>
              <ThemeToggle />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const badgeCount = 'badgeKey' in item ? badges[item.badgeKey as keyof typeof badges] : undefined
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={isActive(item.to)}
                        tooltip={item.label}
                        render={<NavLink to={item.to} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {badgeCount != null && badgeCount > 0 && (
                        <SidebarMenuBadge className={
                          'badgeKey' in item && item.badgeKey === 'overdue'
                            ? 'bg-warning-soft text-warning-ink'
                            : 'bg-muted'
                        }>
                          <span className="num">{badgeCount}</span>
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.role}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={clearAuth}>
                  <LogOut />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
