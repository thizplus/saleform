import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Navigation,
  MapPin,
  User,
  Calendar,
  Clock,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { PhotoLightbox } from '@/components/shared/PhotoLightbox'
import { formatThaiDate, formatPhone, formatRelativeDay } from '@/lib/format-th'
import { useSiteDetail } from '../hooks'
import type { ReportBrief, PhotoBrief } from '../types'

/** L7 — รายละเอียดหน้างาน (full page) */
export function SiteDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { data: site, isLoading } = useSiteDetail(code || '')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
            <ArrowLeft className="size-5" />
          </button>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </header>
        <div className="flex-1 px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-muted-foreground">ไม่พบข้อมูลงาน</p>
        <Button variant="outline" onClick={() => navigate('/')}>กลับหน้าแรก</Button>
      </div>
    )
  }

  // รวมรูปทั้งหมด (จาก reports + site.photos)
  const allPhotos: PhotoBrief[] = [
    ...(site.photos || []),
    ...(site.reports || []).flatMap((r) => r.photos || []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

  function openPhoto(photoId: string) {
    const idx = allPhotos.findIndex((p) => p.id === photoId)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxOpen(true)
  }

  const hasLocation = site.lat && site.lng
  const mapsUrl = site.mapsUrl || (hasLocation ? `https://www.google.com/maps?q=${site.lat},${site.lng}` : '')

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1" aria-label="กลับ">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">
              <span className="num">#{site.siteCode}</span>
            </h1>
          </div>
          <StatusBadge status={site.status} nextFollowUpDate={site.nextFollowUpDate} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* แผนที่ย่อ */}
        {hasLocation && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-40 bg-muted relative overflow-hidden"
          >
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${site.lat},${site.lng}&zoom=15&size=640x320&markers=${site.lat},${site.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}`}
              alt="แผนที่"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback ถ้าไม่มี API key
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
              <MapPin className="size-8 text-primary" />
            </div>
          </a>
        )}

        {/* ข้อมูลลูกค้า */}
        <div className="px-4 pt-4 space-y-1">
          <h2 className="text-lg font-bold">{site.customerName || 'ไม่ระบุชื่อ'}</h2>
          {site.address && (
            <p className="text-sm text-muted-foreground">{site.address}</p>
          )}
          {site.amphoe && (
            <p className="text-sm text-muted-foreground">อ.{site.amphoe}</p>
          )}
        </div>

        {/* ปุ่มติดต่อ */}
        <div className="flex gap-2 px-4 pt-3" onClick={(e) => e.stopPropagation()}>
          {site.phone && (
            <a
              href={`tel:${site.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl border text-sm font-bold hover:bg-muted transition-colors"
            >
              <Phone className="size-4" />
              <span className="num">{formatPhone(site.phone)}</span>
            </a>
          )}
          {hasLocation && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border text-sm font-bold hover:bg-muted transition-colors"
            >
              <Navigation className="size-4" />
              นำทาง
            </a>
          )}
        </div>

        {/* Key-value pairs */}
        <div className="px-4 pt-4">
          <div className="border rounded-xl divide-y">
            <InfoRow icon={User} label="เจ้าของงาน" value={site.ownerName} />
            {site.contractorName && (
              <InfoRow icon={User} label="ช่าง" value={site.contractorName} />
            )}
            {site.decisionMaker && (
              <InfoRow icon={User} label="ผู้ตัดสินใจ" value={site.decisionMaker} />
            )}
            {site.stage && (
              <InfoRow icon={Clock} label="ขั้นตอน" value={site.stage} />
            )}
            {site.nextFollowUpDate && (
              <InfoRow
                icon={Calendar}
                label="นัดติดตาม"
                value={`${formatThaiDate(site.nextFollowUpDate)} (${formatRelativeDay(site.nextFollowUpDate)})`}
                valueClass="num"
              />
            )}
            {site.expectedOrderDate && (
              <InfoRow
                icon={Calendar}
                label="คาดว่าจะสั่ง"
                value={formatThaiDate(site.expectedOrderDate)}
                valueClass="num"
              />
            )}
            {site.lostReason && (
              <InfoRow icon={Clock} label="สาเหตุจบที่อื่น" value={site.lostReason} />
            )}
            {site.competitor && (
              <InfoRow icon={Clock} label="ร้านที่ได้งาน" value={site.competitor} />
            )}
            <InfoRow
              icon={Calendar}
              label="สร้างเมื่อ"
              value={formatThaiDate(site.createdAt)}
              valueClass="num"
            />
          </div>
        </div>

        {/* Timeline */}
        {site.reports?.length > 0 && (
          <div className="px-4 pt-6">
            <h3 className="text-base font-bold mb-3">ประวัติการติดตาม</h3>
            <div className="space-y-0">
              {site.reports.map((report, idx) => (
                <TimelineItem
                  key={report.id}
                  report={report}
                  isLast={idx === (site.reports?.length ?? 0) - 1}
                  onPhotoClick={openPhoto}
                />
              ))}
            </div>
          </div>
        )}

        {/* รูปทั้งหมด */}
        {site.photos?.length > 0 && (
          <div className="px-4 pt-6">
            <h3 className="text-base font-bold mb-3 flex items-center gap-1.5">
              <ImageIcon className="size-4" />
              รูปภาพ ({site.photos?.length})
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {(site.photos || []).map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => openPhoto(photo.id)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={photo.thumbUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        photos={allPhotos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Sticky update button */}
      {site.canEdit && site.status === 'following' && (
        <div className="fixed bottom-0 inset-x-0 bg-background border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <Button
            onClick={() => navigate(`/sites/${site.siteCode}/update`)}
            size="xl"
            className="w-full"
          >
            อัปเดตงานนี้
          </Button>
        </div>
      )}
    </div>
  )
}

/** แถว key-value */
function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof User
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium ml-auto text-right ${valueClass || ''}`}>{value}</span>
    </div>
  )
}

/** Timeline item */
function TimelineItem({ report, isLast, onPhotoClick }: { report: ReportBrief; isLast: boolean; onPhotoClick?: (id: string) => void }) {
  return (
    <div className="flex gap-3">
      {/* เส้น timeline */}
      <div className="flex flex-col items-center">
        <div className="size-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* เนื้อหา */}
      <div className="pb-4 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground num">
            {formatThaiDate(report.reportDate)}
          </span>
          {report.status && report.status !== 'following' && (
            <StatusBadge status={report.status} />
          )}
        </div>
        <p className="text-sm font-bold mt-0.5">{report.repName}</p>
        {report.stage && (
          <p className="text-xs text-muted-foreground">ขั้นตอน: {report.stage}</p>
        )}
        {report.note && (
          <p className="text-sm mt-1 text-foreground/80">{report.note}</p>
        )}
        {/* รูปในรายการนี้ */}
        {report.photos?.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto">
            {report.photos.map((photo: PhotoBrief) => (
              <button
                key={photo.id}
                onClick={() => onPhotoClick?.(photo.id)}
                className="size-16 rounded-lg overflow-hidden bg-muted shrink-0"
>
                <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
