import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Navigation, RefreshCw, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { formatThaiDate } from '@/lib/format-th'
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-xl p-3 space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-9 bg-muted rounded flex-1" />
                  <div className="h-9 bg-muted rounded flex-1" />
                  <div className="h-9 bg-muted rounded flex-1" />
                </div>
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

        {!isLoading && data?.sites?.length && (
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

/** การ์ดงาน (SiteCard) */
function SiteCard({
  site,
  onTap,
  onUpdate,
}: {
  site: SiteBrief
  onTap: () => void
  onUpdate: () => void
}) {
  const mapsUrl = site.lat && site.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`
    : null

  return (
    <div
      className="border rounded-xl p-3 space-y-2 active:bg-muted/50 transition-colors"
      onClick={onTap}
    >
      {/* Row 1: รหัส + สถานะ */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold num">#{site.siteCode}</span>
        <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} />
      </div>

      {/* Row 2: ชื่อ */}
      <p className="text-base font-bold leading-tight">{site.customerName}</p>

      {/* Row 3: ข้อมูลเพิ่ม */}
      <p className="text-sm text-muted-foreground">
        {site.reportCount > 0 && (
          <>ครั้งที่ <span className="num">{site.reportCount}</span> · </>
        )}
        {site.nextFollowUpDate && (
          <>นัด {formatThaiDate(site.nextFollowUpDate)}</>
        )}
      </p>

      {/* Row 4: ปุ่มลัด */}
      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            className="flex items-center justify-center h-9 px-3 rounded-lg border text-sm font-bold hover:bg-muted transition-colors"
          >
            <Phone className="size-4" />
          </a>
        )}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-9 px-3 rounded-lg border text-sm font-bold hover:bg-muted transition-colors"
          >
            <Navigation className="size-4" />
          </a>
        ) : (
          <button disabled className="flex items-center justify-center h-9 px-3 rounded-lg border text-sm font-bold opacity-30">
            <Navigation className="size-4" />
          </button>
        )}
        <Button variant="default" size="sm" className="flex-1" onClick={onUpdate}>
          อัปเดต
        </Button>
      </div>
    </div>
  )
}
