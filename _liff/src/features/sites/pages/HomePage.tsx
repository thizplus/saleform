import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, BarChart3, Search, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/shared'
import { useAuthStore } from '@/stores/auth'
import { formatThaiDate, formatRelativeDay, formatPhone, formatAgo } from '@/lib/format-th'
import { useKeyboardOpen } from '@/hooks/use-keyboard-open'
import { useSiteList } from '../hooks'
import type { SiteListParams, SiteBrief } from '../types'

type TabValue = 'due_today' | 'overdue' | 'following' | 'all'

/**
 * L4 — งานของฉัน (หน้าแรก) แบบกะทัดรัด
 * ส่วนที่ติดบนจอมีแค่ 2 แถว (~100px): ชื่อ + แท็บพร้อมตัวเลข
 * พื้นที่ที่เหลือให้รายการงานทั้งหมด
 */
export function HomePage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const counts = profile?.counts
  const keyboardOpen = useKeyboardOpen()

  const [tab, setTab] = useState<TabValue>('due_today')
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  // ค้นหา = ค้นทุกงาน ไม่จำกัดแท็บ
  const params: SiteListParams = debouncedQ
    ? { tab: 'all', q: debouncedQ, page: 1, limit: 50 }
    : { tab, page: 1, limit: 50 }
  const { data, isLoading, isError, refetch, isFetching } = useSiteList(params, true)
  const sites = data?.sites ?? []

  const tabs: { value: TabValue; label: string; count?: number; tone?: 'warn' }[] = [
    { value: 'due_today', label: 'วันนี้', count: counts?.dueToday },
    { value: 'overdue', label: 'เลยกำหนด', count: counts?.overdue, tone: 'warn' },
    { value: 'following', label: 'ติดตาม', count: counts?.following },
    { value: 'all', label: 'ทั้งหมด', count: counts?.total },
  ]

  function openSearch() {
    setSearchOpen(true)
    requestAnimationFrame(() => searchRef.current?.focus())
  }
  function closeSearch() {
    setSearchOpen(false)
    setQ('')
  }

  // แท็บ "ติดตาม" จัดกลุ่มตามวันนัด เพื่อวางแผนสัปดาห์
  const grouped = tab === 'following' && !debouncedQ

  return (
    <div className="min-h-dvh bg-background">
      {/* ===== ส่วนบนที่ติดจอ (2 แถว) ===== */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        {searchOpen ? (
          <div className="flex items-center gap-2 px-3 h-14">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ชื่อลูกค้า ช่าง เบอร์ หรือรหัสงาน"
              className="flex-1 h-10 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              enterKeyHint="search"
            />
            <button onClick={closeSearch} className="h-10 px-2 text-sm font-bold" aria-label="ปิดการค้นหา">
              ยกเลิก
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 h-14">
            {profile?.pictureUrl ? (
              <img src={profile.pictureUrl} alt="" className="size-8 rounded-full shrink-0" />
            ) : (
              <div className="size-8 rounded-full bg-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold truncate">{profile?.nickname || profile?.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.areas?.length ? profile.areas.join(' · ') : 'ยังไม่ระบุพื้นที่'}
              </p>
            </div>
            <IconBtn label="ค้นหา" onClick={openSearch}><Search className="size-5" /></IconBtn>
            <IconBtn label="ผลงานของฉัน" onClick={() => navigate('/my-stats')}><BarChart3 className="size-5" /></IconBtn>
          </div>
        )}

        {/* แท็บพร้อมตัวเลข (แทน hero + week strip เดิม) */}
        {!debouncedQ && (
          <nav className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar" aria-label="กรองงาน">
            {tabs.map((t) => {
              const active = tab === t.value
              const warn = t.tone === 'warn' && (t.count ?? 0) > 0
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  aria-pressed={active}
                  className={`shrink-0 h-9 px-3 rounded-full text-sm flex items-center gap-1.5 border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'bg-background border-border text-foreground'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={`num text-xs font-bold min-w-5 h-5 px-1 rounded-full grid place-items-center ${
                        active
                          ? 'bg-primary-foreground/20'
                          : warn
                            ? 'bg-warning-soft text-warning-ink'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        )}
        {debouncedQ && (
          <p className="px-4 pb-2 text-xs text-muted-foreground">
            ผลการค้นหา "{debouncedQ}" · <span className="num">{data?.total ?? 0}</span> งาน
          </p>
        )}
      </header>

      {/* ===== รายการงาน ===== */}
      <main className="pb-24">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <div className="px-4 py-10 text-center space-y-3">
            <p className="text-sm">โหลดรายการไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง</p>
            <button onClick={() => refetch()} className="h-10 px-4 rounded-lg border text-sm font-bold">ลองอีกครั้ง</button>
          </div>
        ) : sites.length === 0 ? (
          <EmptyState tab={tab} searching={!!debouncedQ} onNew={() => navigate('/new')} />
        ) : (
          <ul className="divide-y">
            {sites.map((site, i) => {
              const header = grouped ? groupLabel(site, sites[i - 1]) : null
              return (
                <li key={site.siteCode}>
                  {header && (
                    <div className="bg-muted px-4 py-1.5 text-xs font-bold text-muted-foreground">
                      {header}
                    </div>
                  )}
                  <SiteRow site={site} onOpen={() => navigate(`/sites/${site.siteCode}`)} />
                </li>
              )
            })}
          </ul>
        )}

        {!isLoading && sites.length > 0 && (
          <button
            onClick={() => refetch()}
            className="w-full py-4 text-xs text-muted-foreground flex items-center justify-center gap-1"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'กำลังโหลด…' : `แสดง ${sites.length} จาก ${data?.total ?? sites.length} งาน · แตะเพื่อโหลดใหม่`}
          </button>
        )}
      </main>

      {/* ===== ปุ่มรายงานงานใหม่ (ซ่อนตอนพิมพ์) ===== */}
      {!keyboardOpen && !searchOpen && (
        <button
          onClick={() => navigate('/new')}
          className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground font-bold text-base flex items-center gap-1.5 shadow-lg shadow-black/20 active:scale-[0.98] transition-transform"
        >
          <Plus className="size-5" />
          รายงานงานใหม่
        </button>
      )}
    </div>
  )
}

/** แถวงาน 1 รายการ — สูงประมาณ 76px เห็นได้ 7–8 งานต่อจอ */
function SiteRow({ site, onOpen }: { site: SiteBrief; onOpen: () => void }) {
  const title = site.customerName || (site.contractorName ? `ช่าง${site.contractorName}` : 'ไม่ระบุชื่อ')
  const sub = [
    site.customerName && site.contractorName ? `ช่าง${site.contractorName}` : null,
    site.tambon ? `ต.${site.tambon}` : null,
    site.amphoe ? `อ.${site.amphoe}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex items-stretch">
      <button onClick={onOpen} className="flex-1 min-w-0 text-left px-4 py-3 active:bg-muted/60">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold truncate flex-1">{title}</p>
          <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} className="shrink-0" />
        </div>
        {sub && <p className="text-[13px] text-muted-foreground truncate mt-0.5">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <span className="num font-bold text-foreground/70">#{site.siteCode}</span>
          <span>·</span>
          <span>ตาม <span className="num">{site.reportCount}</span> ครั้ง</span>
          {site.lastReportAt && (
            <>
              <span>·</span>
              <span>ล่าสุด{formatAgo(site.lastReportAt)}</span>
            </>
          )}
        </p>
      </button>
      {site.phone && (
        <a
          href={`tel:${site.phone}`}
          aria-label={`โทร ${formatPhone(site.phone)}`}
          className="w-14 shrink-0 grid place-items-center border-l text-foreground active:bg-muted/60"
        >
          <Phone className="size-5" />
        </a>
      )}
    </div>
  )
}

/** หัวกลุ่มวันนัด (แท็บติดตาม) */
function groupLabel(site: SiteBrief, prev?: SiteBrief): string | null {
  const key = site.nextFollowUpDate?.slice(0, 10) ?? 'none'
  const prevKey = prev ? prev.nextFollowUpDate?.slice(0, 10) ?? 'none' : null
  if (key === prevKey) return null
  if (key === 'none') return 'ไม่มีวันนัด'
  const rel = formatRelativeDay(key)
  return `${rel} · ${formatThaiDate(key)}`
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="size-10 grid place-items-center rounded-full active:bg-muted shrink-0">
      {children}
    </button>
  )
}

function ListSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3 space-y-2 animate-pulse">
          <div className="flex justify-between"><div className="h-4 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-16" /></div>
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ tab, searching, onNew }: { tab: TabValue; searching: boolean; onNew: () => void }) {
  const text = searching
    ? 'ไม่พบงานที่ค้นหา ลองพิมพ์เบอร์หรือชื่อช่าง'
    : tab === 'due_today'
      ? 'วันนี้ไม่มีงานต้องตาม'
      : tab === 'overdue'
        ? 'ไม่มีงานเลยกำหนด'
        : 'ยังไม่มีงาน'
  return (
    <div className="px-6 py-14 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      {!searching && (
        <button onClick={onNew} className="h-10 px-4 rounded-full border text-sm font-bold inline-flex items-center gap-1.5">
          <Plus className="size-4" /> รายงานงานใหม่
        </button>
      )}
    </div>
  )
}
