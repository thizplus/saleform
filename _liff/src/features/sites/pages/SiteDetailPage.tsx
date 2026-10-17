import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { PhotoLightbox } from '@/components/shared/PhotoLightbox'
import { formatThaiDate, formatPhone, formatRelativeDay } from '@/lib/format-th'
import { useSiteDetail } from '../hooks'
import type { ReportBrief, PhotoBrief } from '../types'

/** L7 — รายละเอียดหน้างาน (กะทัดรัด: ข้อมูลหลักอยู่ในจอแรก) */
export function SiteDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { data: site, isLoading, isError, refetch } = useSiteDetail(code || '')

  // hooks ต้องอยู่ก่อน return ใด ๆ เสมอ
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <TopBar onBack={back}><div className="h-4 bg-muted rounded w-28 animate-pulse" /></TopBar>
        <div className="px-4 py-4 space-y-3 animate-pulse">
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !site) {
    return (
      <div className="min-h-dvh bg-background">
        <TopBar onBack={back}><span className="text-sm font-bold">ไม่พบงาน</span></TopBar>
        <div className="px-6 py-14 text-center space-y-3">
          <p className="text-sm text-muted-foreground">ไม่พบข้อมูลงาน #{code} หรือโหลดไม่สำเร็จ</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => refetch()}>ลองอีกครั้ง</Button>
            <Button onClick={() => navigate('/')}>กลับหน้าแรก</Button>
          </div>
        </div>
      </div>
    )
  }

  // รวมรูปทั้งหมดไม่ซ้ำ (ใหม่ → เก่า)
  const allPhotos: PhotoBrief[] = [
    ...(site.reports || []).flatMap((r) => r.photos || []),
    ...(site.photos || []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

  function openPhoto(photoId: string) {
    const idx = allPhotos.findIndex((p) => p.id === photoId)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxOpen(true)
  }

  const hasLocation = !!(site.lat && site.lng)
  const navUrl = hasLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`
    : site.mapsUrl
  const place = [site.tambon && `ต.${site.tambon}`, site.amphoe && `อ.${site.amphoe}`].filter(Boolean).join(' ') || site.address
  const title = site.customerName || (site.contractorName ? `ช่าง${site.contractorName}` : 'ไม่ระบุชื่อ')
  const showUpdate = site.canEdit && site.status === 'following'

  // ข้อมูลย่อยแบบ 2 คอลัมน์ — แสดงเฉพาะที่มีค่า
  const facts: [string, string, boolean?][] = [
    ['นัดตามต่อ', site.nextFollowUpDate ? `${formatThaiDate(site.nextFollowUpDate)} (${formatRelativeDay(site.nextFollowUpDate)})` : '', true],
    ['ขั้นตอน', site.stage],
    ['ผู้ตัดสินใจ', site.decisionMaker],
    ['คาดว่าจะสั่ง', site.expectedOrderDate ? formatThaiDate(site.expectedOrderDate) : ''],
    ['สาเหตุจบที่อื่น', site.lostReason],
    ['ร้านที่ได้งาน', site.competitor],
    ['เจ้าของงาน', site.ownerName],
    ['เปิดงานเมื่อ', formatThaiDate(site.createdAt)],
  ].filter(([, v]) => !!v) as [string, string, boolean?][]

  return (
    <div className="min-h-dvh bg-background">
      <TopBar onBack={back}>
        <span className="num font-bold text-[15px] flex-1 truncate">#{site.siteCode}</span>
        <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} />
      </TopBar>

      <main className={showUpdate ? 'pb-24' : 'pb-8'}>
        {/* ผู้ติดต่อ + ที่ตั้ง */}
        <section className="px-4 pt-3 pb-4 space-y-1.5">
          <h1 className="text-lg font-bold leading-snug">{title}</h1>
          {site.customerName && site.contractorName && (
            <p className="text-sm text-muted-foreground">ช่าง{site.contractorName}{site.customerType ? ` · ผู้ติดต่อ: ${site.customerType}` : ''}</p>
          )}

          {site.phone && (
            <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1.5 text-[15px] font-bold underline decoration-1 underline-offset-4 py-1">
              <Phone className="size-4" />
              <span className="num">{formatPhone(site.phone)}</span>
            </a>
          )}

          {(place || hasLocation) && (
            <div className="flex items-start gap-1.5 text-sm">
              <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground flex-1">{place || 'มีพิกัดหน้างาน'}</span>
              {navUrl && (
                <a href={navUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 font-bold underline underline-offset-4">
                  <Navigation className="size-3.5" />นำทาง
                </a>
              )}
            </div>
          )}
        </section>

        {/* ข้อมูลหน้างาน 2 คอลัมน์ */}
        {facts.length > 0 && (
          <section className="mx-4 rounded-xl bg-muted/70 px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
            {facts.map(([label, value, wide]) => (
              <div key={label} className={wide ? 'col-span-2' : ''}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold leading-snug">{value}</p>
              </div>
            ))}
          </section>
        )}

        {/* รูปทั้งหมด — แถบเลื่อนแนวนอน */}
        {allPhotos.length > 0 && (
          <section className="pt-4">
            <h2 className="px-4 text-sm font-bold mb-2">รูปหน้างาน <span className="num text-muted-foreground font-normal">({allPhotos.length})</span></h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
              {allPhotos.map((photo) => (
                <button key={photo.id} onClick={() => openPhoto(photo.id)} className="size-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img src={photo.thumbUrl || photo.fullUrl} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ประวัติ */}
        {site.reports?.length > 0 && (
          <section className="px-4 pt-5">
            <h2 className="text-sm font-bold mb-2">ประวัติการติดตาม <span className="num text-muted-foreground font-normal">({site.reports.length})</span></h2>
            <ol>
              {site.reports.map((report, idx) => (
                <TimelineItem key={report.id} report={report} first={idx === 0} isLast={idx === site.reports.length - 1} onPhotoClick={openPhoto} />
              ))}
            </ol>
          </section>
        )}
      </main>

      <PhotoLightbox photos={allPhotos} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />

      {showUpdate && (
        <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <Button onClick={() => navigate(`/sites/${site.siteCode}/update`)} size="xl" className="w-full">
            อัปเดตงานนี้
          </Button>
        </div>
      )}
    </div>
  )
}

function TopBar({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b h-12 px-2 flex items-center gap-2">
      <button onClick={onBack} className="size-10 grid place-items-center rounded-full active:bg-muted" aria-label="กลับ">
        <ArrowLeft className="size-5" />
      </button>
      {children}
      <span className="w-2" />
    </header>
  )
}

function TimelineItem({ report, first, isLast, onPhotoClick }: { report: ReportBrief; first: boolean; isLast: boolean; onPhotoClick: (id: string) => void }) {
  const label = report.reportType === 'new' ? 'งานใหม่' : null
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className={`size-2.5 rounded-full shrink-0 ${first ? 'bg-primary' : 'border-2 border-primary bg-background'}`} />
        {!isLast && <span className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="pb-4 min-w-0 flex-1">
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5">
          <span className="num">{formatThaiDate(report.reportDate)}</span>
          <span>· {report.repName}</span>
          {label && <span>· {label}</span>}
          {report.stage && <span>· {report.stage}</span>}
        </p>
        {report.status && report.status !== 'following' && (
          <div className="mt-1"><StatusBadge status={report.status} /></div>
        )}
        {report.note && <p className="text-sm leading-relaxed mt-0.5 whitespace-pre-line">{report.note}</p>}
        {report.photos?.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {report.photos.map((photo) => (
              <button key={photo.id} onClick={() => onPhotoClick(photo.id)} className="size-14 rounded-md overflow-hidden bg-muted shrink-0">
                <img src={photo.thumbUrl || photo.fullUrl} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
