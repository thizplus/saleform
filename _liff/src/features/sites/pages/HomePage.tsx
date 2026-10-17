import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Navigation, RefreshCw, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { formatThaiDate, formatPhone } from '@/lib/format-th'
import { useSiteList } from '../hooks'
import type { SiteListParams, SiteBrief } from '../types'

const TAB_OPTIONS = [
  { value: 'due_today', label: 'ต้องตาม' },
  { value: 'overdue', label: 'เลยกำหนด' },
  { value: 'all', label: 'ทั้งหมด' },
] as const

/** L4 — งานของฉัน (หน้าแรก) */
export function HomePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  const [activeTab, setActiveTab] = useState('due_today')
  const [search, setSearch] = useState('')
  const [params, setParams] = useState<SiteListParams>({ tab: 'due_today', page: 1, limit: 50 })

  const { data, isLoading, refetch } = useSiteList(params, true)

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setParams((prev) => ({ ...prev, tab, page: 1 }))
  }

  function handleSearch(q: string) {
    setSearch(q)
    setParams((prev) => ({ ...prev, q: q || undefined, page: 1 }))
  }

  const counts = profile?.counts

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {profile?.pictureUrl && (
              <img src={profile.pictureUrl} alt="" className="size-8 rounded-full" />
            )}
            <div>
              <p className="text-sm font-bold">{profile?.nickname || profile?.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.areas?.join(', ') || 'ไม่ระบุพื้นที่'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/my-stats')}
            aria-label="ผลงานของฉัน"
          >
            <BarChart3 className="size-5" />
          </Button>
        </div>

        {/* Hero: ต้องตามวันนี้ */}
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">วันนี้ต้องตาม</p>
          <p className="text-[56px] leading-none font-black num">
            {counts?.dueToday ?? 0}
            <span className="text-base font-normal text-muted-foreground ml-2">งาน</span>
          </p>
          <div className="flex gap-3 mt-1 text-sm">
            {(counts?.overdue ?? 0) > 0 && (
              <span className="text-warning-ink font-bold">
                เลยกำหนด <span className="num">{counts?.overdue}</span> งาน
              </span>
            )}
            <span className="text-muted-foreground">
              ติดตามอยู่ <span className="num">{counts?.following ?? 0}</span>
            </span>
          </div>
        </div>

        {/* TODO: WeekStrip 7 วัน (L-02) */}
      </header>

      {/* Tabs + Search */}
      <div className="border-b px-4 pt-2">
        <div className="flex gap-1">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              className={`px-3 py-2 text-sm rounded-t-lg transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label}
              {tab.value === 'overdue' && (counts?.overdue ?? 0) > 0 && (
                <span className="ml-1 num">{counts?.overdue}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative py-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ เบอร์ รหัสงาน"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-10 text-base"
          />
        </div>
      </div>

      {/* Site list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">
        {isLoading ? (
          // Skeleton 3 การ์ด
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
            <p className="text-muted-foreground">ไม่มีงานต้องตามวันนี้</p>
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

        {/* Pull to refresh hint */}
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
      <p className="text-lg font-bold leading-tight">{site.customerName}</p>

      {/* Row 3: ตำบล อำเภอ */}
      <p className="text-sm text-muted-foreground">
        {site.reportCount > 0 && (
          <>ครั้งที่ <span className="num">{site.reportCount}</span> · </>
        )}
        {site.nextFollowUpDate && (
          <>ล่าสุด {formatThaiDate(site.nextFollowUpDate)}</>
        )}
      </p>

      {/* Row 4: ปุ่มลัด */}
      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg border text-sm font-bold hover:bg-muted transition-colors"
          >
            <Phone className="size-4" />
            <span className="num">{formatPhone(site.phone)}</span>
          </a>
        )}
        {/* TODO: ปุ่มนำทางใช้ lat/lng */}
        <button
          className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border text-sm font-bold hover:bg-muted transition-colors"
          onClick={() => {/* TODO: open maps */}}
        >
          <Navigation className="size-4" />
        </button>
        <Button
          variant="default"
          className="flex-1"
          onClick={onUpdate}
        >
          อัปเดต
        </Button>
      </div>
    </div>
  )
}
