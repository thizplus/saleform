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
      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <ul className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="px-4 py-3 space-y-2 animate-pulse">
                <div className="flex justify-between"><div className="h-4 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-16" /></div>
                <div className="h-3 bg-muted rounded w-2/3" />
              </li>
            ))}
          </ul>
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
          <ul className="divide-y">
            {data.sites.map((site) => (
              <SiteRow
                key={site.siteCode}
                site={site}
                onTap={() => navigate(`/sites/${site.siteCode}`)}
              />
            ))}
          </ul>
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

/** แถวงาน compact — กดแถวเปิด detail, กดไอคอนโทรได้ */
function SiteRow({ site, onTap }: { site: SiteBrief; onTap: () => void }) {
  const sub = [
    site.amphoe && `อ.${site.amphoe}`,
    site.phone && formatPhone(site.phone),
  ].filter(Boolean).join(' · ')

  return (
    <li className="flex items-stretch">
      <button onClick={onTap} className="flex-1 min-w-0 text-left px-4 py-2.5 active:bg-muted/60">
        {/* บรรทัด 1: ชื่อ + สถานะ */}
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold truncate flex-1">{site.customerName || 'ไม่ระบุชื่อ'}</p>
          <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} className="shrink-0" />
        </div>
        {/* บรรทัด 2: อำเภอ · เบอร์ */}
        {sub && <p className="text-[13px] text-muted-foreground truncate mt-0.5">{sub}</p>}
        {/* บรรทัด 3: รหัส · ครั้งที่ · นัด */}
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span className="num font-bold text-foreground/70">#{site.siteCode}</span>
          {site.reportCount > 0 && (
            <><span>·</span><span>ตาม <span className="num">{site.reportCount}</span> ครั้ง</span></>
          )}
          {site.nextFollowUpDate && (
            <><span>·</span><span>นัด {formatThaiDate(site.nextFollowUpDate)}</span></>
          )}
        </p>
      </button>
      {/* ปุ่มโทรขวาสุด */}
      {site.phone && (
        <a
          href={`tel:${site.phone}`}
          className="w-12 shrink-0 grid place-items-center border-l active:bg-muted/60"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="size-5 text-foreground" />
        </a>
      )}
    </li>
  )
}
