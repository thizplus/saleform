import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, RefreshCw, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { formatThaiDate, formatPhone } from '@/lib/format-th'
import { useSiteList } from '../hooks'
import type { SiteListParams, SiteBrief } from '../types'

type TabValue = 'due_today' | 'overdue' | 'following' | 'all'

/** L4 — งานของฉัน (หน้าแรก) — compact header */
export function HomePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const counts = profile?.counts

  const [activeTab, setActiveTab] = useState<TabValue>('due_today')
  const [search, setSearch] = useState('')
  const [params, setParams] = useState<SiteListParams>({ tab: 'due_today', page: 1, limit: 50 })

  const { data, isLoading, refetch } = useSiteList(params, true)

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab)
    setParams((prev) => ({ ...prev, tab, page: 1 }))
  }

  function handleSearch(q: string) {
    setSearch(q)
    setParams((prev) => ({ ...prev, q: q || undefined, page: 1 }))
  }

  const tabs: { value: TabValue; label: string; count?: number; warn?: boolean }[] = [
    { value: 'due_today', label: 'วันนี้', count: counts?.dueToday },
    { value: 'overdue', label: 'เลยกำหนด', count: counts?.overdue, warn: true },
    { value: 'following', label: 'ติดตาม', count: counts?.following },
    { value: 'all', label: 'ทั้งหมด', count: counts?.total },
  ]

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header compact: profile + แท็บ + ค้นหา */}
      <header className="sticky top-0 z-10 bg-background border-b">
        {/* แถว 1: profile + icons */}
        <div className="flex items-center gap-2.5 px-4 h-12">
          {profile?.pictureUrl && (
            <img src={profile.pictureUrl} alt="" className="size-7 rounded-full shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile?.nickname || profile?.displayName}</p>
            {profile?.area && (
              <p className="text-xs text-muted-foreground truncate">{profile.area}</p>
            )}
          </div>
          <button onClick={() => navigate('/my-stats')} className="size-9 grid place-items-center rounded-full active:bg-muted" aria-label="ผลงาน">
            <BarChart3 className="size-5" />
          </button>
        </div>

        {/* แถว 2: แท็บ pill พร้อมตัวเลข */}
        <nav className="flex gap-1.5 px-3 pb-2 overflow-x-auto" aria-label="กรองงาน">
          {tabs.map((t) => {
            const active = activeTab === t.value
            const showWarn = t.warn && (t.count ?? 0) > 0
            return (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
                className={`shrink-0 h-8 px-3 rounded-full text-sm flex items-center gap-1.5 border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'bg-background border-border text-foreground'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`num text-xs font-bold min-w-4 h-4 px-1 rounded-full grid place-items-center ${
                    active
                      ? 'bg-primary-foreground/20'
                      : showWarn
                        ? 'bg-warning-soft text-warning-ink'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* ค้นหา */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ เบอร์ รหัสงาน"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </header>

      {/* Site list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 pb-24">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-xl p-3 space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </>
        ) : !data?.sites?.length ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">
              {activeTab === 'due_today' ? 'วันนี้ไม่มีงานต้องตาม' :
               activeTab === 'overdue' ? 'ไม่มีงานเลยกำหนด' :
               'ไม่มีงาน'}
            </p>
            <Button variant="outline" onClick={() => navigate('/new')}>
              รายงานงานใหม่
            </Button>
          </div>
        ) : (
          data.sites.map((site) => (
            <SiteCard
              key={site.siteCode}
              site={site}
              onTap={() => navigate(`/sites/${site.siteCode}`)}
              onUpdate={() => navigate(`/sites/${site.siteCode}/update`)}
            />
          ))
        )}

        {!isLoading && (data?.sites?.length ?? 0) > 0 && (
          <button
            onClick={() => refetch()}
            className="w-full py-3 text-sm text-muted-foreground flex items-center justify-center gap-1"
          >
            <RefreshCw className="size-3.5" />
            โหลดใหม่
          </button>
        )}
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          onClick={() => navigate('/new')}
          size="xl"
          className="w-full gap-2"
        >
          <Plus className="size-5" />
          รายงานงานใหม่
        </Button>
      </div>
    </div>
  )
}

/** การ์ดงาน compact — text-based + ปุ่ม action เรียงเป็นแถว */
function SiteCard({
  site,
  onTap,
  onUpdate,
}: {
  site: SiteBrief
  onTap: () => void
  onUpdate: () => void
}) {
  const info = [
    site.amphoe && `อ.${site.amphoe}`,
    site.phone && formatPhone(site.phone),
    site.reportCount > 0 && `ตาม ${site.reportCount} ครั้ง`,
    site.nextFollowUpDate && `นัด ${formatThaiDate(site.nextFollowUpDate)}`,
  ].filter(Boolean).join(' · ')

  return (
    <div
      className="border rounded-xl p-3 space-y-2 active:bg-muted/50 transition-colors"
      onClick={onTap}
    >
      {/* แถว 1: ชื่อ + สถานะ */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight truncate">{site.customerName || 'ไม่ระบุชื่อ'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="num font-bold text-foreground/70">#{site.siteCode}</span>
            {info && <> · {info}</>}
          </p>
        </div>
        <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} className="shrink-0 mt-0.5" />
      </div>

      {/* แถว 2: ปุ่ม action */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            className="h-8 px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 hover:bg-muted transition-colors"
          >
            <Phone className="size-3.5" />
            โทร
          </a>
        )}
        <Button variant="default" size="sm" className="h-8 flex-1 text-xs" onClick={onUpdate}>
          อัปเดต
        </Button>
      </div>
    </div>
  )
}
