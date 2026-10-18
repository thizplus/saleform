import { useNavigate } from 'react-router-dom'
import { CalendarClock, AlertTriangle, ChevronDown, Phone as PhoneIcon } from 'lucide-react'
import { formatThaiDate, formatRelativeDay, formatPhone } from '@/lib/format-th'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useFollowUps } from '../hooks'
import type { SiteBrief } from '@/features/sites/service'

interface GroupedByRep {
  repName: string
  sites: SiteBrief[]
}

function groupByRep(sites: SiteBrief[]): GroupedByRep[] {
  const map = new Map<string, SiteBrief[]>()
  for (const site of sites) {
    const name = site.ownerName || 'ไม่ระบุ'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(site)
  }
  return Array.from(map.entries())
    .map(([repName, sites]) => ({ repName, sites }))
    .sort((a, b) => b.sites.length - a.sites.length)
}

export function FollowUpsPage() {
  const { data: todaySites, isLoading: loadingToday } = useFollowUps('due_today')
  const { data: overdueSites, isLoading: loadingOverdue } = useFollowUps('overdue')

  const todayGroups = groupByRep(todaySites || [])
  const overdueGroups = groupByRep(overdueSites || [])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">
            <CalendarClock className="size-4 mr-1.5" />
            วันนี้ {(todaySites?.length ?? 0) > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{todaySites!.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            <AlertTriangle className="size-4 mr-1.5" />
            เลยกำหนด {(overdueSites?.length ?? 0) > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{overdueSites!.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {loadingToday ? (
            <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
          ) : !todayGroups.length ? (
            <EmptyState icon={CalendarClock} message="ไม่มีงานต้องติดตามวันนี้" />
          ) : (
            <div className="space-y-3">
              {todayGroups.map((group) => (
                <RepGroup key={group.repName} group={group} variant="today" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          {loadingOverdue ? (
            <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
          ) : !overdueGroups.length ? (
            <EmptyState icon={AlertTriangle} message="ไม่มีงานเลยกำหนด" />
          ) : (
            <div className="space-y-3">
              {overdueGroups.map((group) => (
                <RepGroup key={group.repName} group={group} variant="overdue" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="size-10 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function RepGroup({ group, variant }: { group: GroupedByRep; variant: 'today' | 'overdue' }) {
  const navigate = useNavigate()

  return (
    <details className="border rounded-lg group" open>
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-muted/50">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        <span className="font-medium text-sm flex-1">{group.repName}</span>
        <Badge variant={variant === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
          {group.sites.length} งาน
        </Badge>
      </summary>
      <div className="border-t divide-y">
        {group.sites.map((site) => (
          <div
            key={site.siteCode}
            onClick={() => navigate(`/sites/${site.siteCode}`)}
            className="flex items-center gap-4 px-4 py-2.5 hover:bg-muted/30 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="num text-xs font-medium text-muted-foreground">{site.siteCode}</span>
                <span className="text-sm font-medium truncate">{site.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {site.amphoe && <span>{site.amphoe}</span>}
                {site.amphoe && site.phone && <span>·</span>}
                {site.phone && (
                  <a
                    href={`tel:${site.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    <PhoneIcon className="size-3" />
                    {formatPhone(site.phone)}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              {site.nextFollowUpDate && (
                <p className={`text-xs font-medium num ${variant === 'overdue' ? 'text-danger' : ''}`}>
                  {formatThaiDate(site.nextFollowUpDate)}
                </p>
              )}
              {site.nextFollowUpDate && (
                <p className={`text-[11px] ${variant === 'overdue' ? 'text-danger' : 'text-muted-foreground'}`}>
                  {formatRelativeDay(site.nextFollowUpDate)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
