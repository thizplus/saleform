import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  User,
  Users,
  FileText,
  Pencil,
  ExternalLink,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatThaiDate, formatPhone, formatRelativeDay } from '@/lib/format-th'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { useSiteDetail, siteKeys } from '../hooks'
import { siteService } from '../service'
import type { ReportBrief, PhotoBrief } from '../service'

const STATUS_LABELS: Record<string, string> = {
  following: 'กำลังติดตาม',
  won: 'จบได้',
  lost: 'จบที่อื่น',
  cancelled: 'ยกเลิก',
}

const STATUS_STYLES: Record<string, string> = {
  following: 'status-following',
  won: 'status-success',
  lost: 'status-danger',
  cancelled: 'status-neutral',
}

export function SiteDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: site, isLoading } = useSiteDetail(code || '')
  const [editOpen, setEditOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => siteService.updateSite(code!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(code!) })
      queryClient.invalidateQueries({ queryKey: siteKeys.all })
      setEditOpen(false)
      toast.success('บันทึกแล้ว')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลงาน</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/sites')}>
          กลับหน้ารายการ
        </Button>
      </div>
    )
  }

  // รวมรูปจากทุก report (fallback ถ้า backend ยังไม่ส่ง photos)
  const allPhotos: PhotoBrief[] = site.photos?.length
    ? site.photos
    : site.reports?.flatMap((r) => r.photos || []) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/sites')}>
          <ArrowLeft />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold truncate">{site.customerName}</h1>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[site.status] || ''}`}>
              {STATUS_LABELS[site.status] || site.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="num font-medium">{site.siteCode}</span>
            <span className="mx-1.5">·</span>
            เซลล์: {site.ownerName}
            <span className="mx-1.5">·</span>
            สร้าง {formatThaiDate(site.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4 mr-1" />
          แก้ไข
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Info + Photos */}
        <div className="space-y-6">
          {/* Info Grid */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-bold mb-3">ข้อมูลงาน</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <InfoRow icon={Phone} label="โทร" value={site.phone ? formatPhone(site.phone) : '-'} href={site.phone ? `tel:${site.phone}` : undefined} />
              <InfoRow icon={MapPin} label="ตำบล" value={site.tambon || '-'} />
              <InfoRow icon={MapPin} label="อำเภอ" value={site.amphoe || '-'} />
              <InfoRow icon={MapPin} label="จังหวัด" value={site.province || '-'} />
              {site.postcode && <InfoRow icon={MapPin} label="รหัสไปรษณีย์" value={site.postcode} />}
              <InfoRow icon={FileText} label="ขั้นตอน" value={site.stage || '-'} />
              <InfoRow icon={Calendar} label="นัดติดตาม" value={site.nextFollowUpDate ? `${formatThaiDate(site.nextFollowUpDate)} (${formatRelativeDay(site.nextFollowUpDate)})` : '-'} />
              {site.status === 'lost' && (
                <>
                  <InfoRow icon={FileText} label="สาเหตุจบ" value={site.lostReason || '-'} />
                  <InfoRow icon={FileText} label="คู่แข่ง" value={site.competitor || '-'} />
                </>
              )}
            </div>
            {site.mapsUrl && (
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
              >
                <ExternalLink className="size-3" />
                เปิด Google Maps
              </a>
            )}
          </div>

          {/* Contacts */}
          {site.contacts?.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-bold">ผู้ติดต่อ ({site.contacts.length})</h3>
              </div>
              <div className="space-y-2">
                {site.contacts.map((c: { id: string; name: string; phone: string; contactType: string; authority: string; role: string; isPrimary: boolean }) => (
                  <div key={c.id} className="rounded-lg border px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{c.name || 'ไม่ระบุชื่อ'}</span>
                        {c.isPrimary && <Badge variant="outline" className="text-[10px] px-1">หลัก</Badge>}
                      </div>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-xs text-primary hover:underline num">{formatPhone(c.phone)}</a>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                      {c.role && (
                        <div>
                          <span className="text-muted-foreground">บทบาท: </span>
                          <span className="font-medium">{c.role}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">ประเภท: </span>
                        <span className="font-medium">{c.contactType || 'ไม่ระบุ'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">สิทธิ์: </span>
                        <span className="font-medium">{c.authority || 'ไม่ระบุ'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">รูปภาพ ({allPhotos.length})</h3>
            </div>
            {!allPhotos.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">ไม่มีรูปภาพ</p>
            ) : (
              <div className="grid grid-cols-6 gap-1.5">
                {allPhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIdx(idx)}
                    className="aspect-square rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
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
            )}
          </div>
        </div>

        {/* Right: Timeline */}
        <div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-bold mb-4">ประวัติการติดตาม ({site.reports?.length || 0})</h3>
            {!site.reports?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีรายงาน</p>
            ) : (
              <div className="space-y-0">
                {site.reports.map((report, i) => (
                  <TimelineItem
                    key={report.id}
                    report={report}
                    isLast={i === site.reports.length - 1}
                    allPhotos={allPhotos}
                    onPhotoClick={setLightboxIdx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDialog
        site={site}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(data) => updateMutation.mutate(data)}
        isPending={updateMutation.isPending}
      />

      {/* Photo Lightbox with prev/next */}
      <Dialog open={lightboxIdx !== null} onOpenChange={() => setLightboxIdx(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>รูปภาพ</DialogTitle>
            <DialogDescription>ดูรูปภาพขนาดเต็ม</DialogDescription>
          </DialogHeader>
          {lightboxIdx !== null && allPhotos[lightboxIdx] && (
            <div className="relative">
              <img src={allPhotos[lightboxIdx].fullUrl} alt="" className="w-full rounded-lg" />
              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full num">
                {lightboxIdx + 1} / {allPhotos.length}
              </div>
              {/* Prev */}
              {lightboxIdx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              {/* Next */}
              {lightboxIdx < allPhotos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, href }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="font-medium num text-primary hover:underline">{value}</a>
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    </div>
  )
}

function TimelineItem({ report, isLast, allPhotos, onPhotoClick }: {
  report: ReportBrief
  isLast: boolean
  allPhotos: PhotoBrief[]
  onPhotoClick: (idx: number) => void
}) {
  const isNew = report.reportType === 'new'
  return (
    <div className="flex gap-3">
      {/* Line */}
      <div className="flex flex-col items-center">
        <div className={`size-2.5 rounded-full mt-1.5 shrink-0 ${isNew ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className="pb-5 min-w-0 flex-1">
        <p className="text-xs font-medium">
          <span className="num">{formatThaiDate(report.reportDate)}</span>
          <span className="text-muted-foreground ml-1.5">· {report.repName}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {isNew ? 'งานใหม่' : 'ติดตาม'}
          </Badge>
          {report.stage && (
            <span className="text-xs text-muted-foreground">{report.stage}</span>
          )}
        </div>
        {report.jobType && (
          <p className="text-xs mt-1 text-muted-foreground">
            <span className="font-medium">ตัวเลือกงาน:</span> {report.jobType === 'อื่นๆ' && report.jobTypeOther ? report.jobTypeOther : report.jobType}
          </p>
        )}
        {report.note && (
          <p className="text-sm mt-1.5 whitespace-pre-wrap text-muted-foreground leading-relaxed">
            <span className="font-medium">สินค้าที่สนใจ:</span> {report.note}
          </p>
        )}
        {report.jobDetail && (
          <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground leading-relaxed">
            <span className="font-medium">รายละเอียดหน้างาน:</span> {report.jobDetail}
          </p>
        )}
        {report.photos?.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {report.photos.map((photo) => {
              const globalIdx = allPhotos.findIndex((p) => p.id === photo.id)
              return (
                <button
                  key={photo.id}
                  onClick={() => onPhotoClick(globalIdx >= 0 ? globalIdx : 0)}
                  className="aspect-square rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                >
                  <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EditDialog({ site, open, onOpenChange, onSave, isPending }: {
  site: { customerName: string; phone: string; amphoe: string; stage: string; status: string; lostReason: string; competitor: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Record<string, unknown>) => void
  isPending: boolean
}) {
  const [form, setForm] = useState(() => ({
    customerName: site.customerName,
    phone: site.phone,
    amphoe: site.amphoe,
    stage: site.stage,
    status: site.status,
    lostReason: site.lostReason,
    competitor: site.competitor,
  }))

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลงาน</DialogTitle>
          <DialogDescription className="sr-only">แก้ไขข้อมูลหน้างาน</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ชื่อลูกค้า</Label>
              <Input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>โทร</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>อำเภอ</Label>
              <Input value={form.amphoe} onChange={(e) => set('amphoe', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ขั้นตอน</Label>
              <Input value={form.stage} onChange={(e) => set('stage', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={form.status} onValueChange={(v) => v && set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="following">กำลังติดตาม</SelectItem>
                  <SelectItem value="won">จบได้</SelectItem>
                  <SelectItem value="lost">จบที่อื่น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.status === 'lost' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>สาเหตุ</Label>
                <Input value={form.lostReason} onChange={(e) => set('lostReason', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>คู่แข่ง</Label>
                <Input value={form.competitor} onChange={(e) => set('competitor', e.target.value)} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            ยกเลิก
          </DialogClose>
          <Button onClick={() => onSave(form)} disabled={isPending}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
