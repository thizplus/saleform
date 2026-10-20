import { useState } from 'react'
import { toast } from 'sonner'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SITE_STATUS_LABELS, SITE_STATUS_STYLES } from '@/constants/enums'
import { formatThaiDate } from '@/lib/thai-date'
import { useSiteDetail } from '../hooks'
import { FollowUpSheet } from './FollowUpSheet'
import type { ReportBrief } from '../types'

interface SiteDetailSheetProps {
  code: string | null
  onClose: () => void
}

export function SiteDetailSheet({ code, onClose }: SiteDetailSheetProps) {
  const { data: site, isLoading } = useSiteDetail(code || '')
  const [showFollowUp, setShowFollowUp] = useState(false)

  if (!code) return null

  return (
    <>
      <Drawer open={!!code} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="flex items-center justify-between px-4 pb-2">
            <DrawerTitle className="text-base">
              {isLoading ? 'กำลังโหลด...' : `#${site?.siteCode}`}
            </DrawerTitle>
            <DrawerClose
              className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium hover:bg-muted"
            >
              ปิด
            </DrawerClose>
          </DrawerHeader>

          {isLoading ? (
            <div className="px-4 pb-6 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : site ? (
            <div className="overflow-y-auto px-4 pb-6 space-y-4">
              {/* Status + Stage */}
              <div className="flex items-center gap-2">
                <Badge className={SITE_STATUS_STYLES[site.status] || ''}>
                  {SITE_STATUS_LABELS[site.status] || site.status}
                </Badge>
                {site.stage && (
                  <Badge variant="outline" className="text-xs">{site.stage}</Badge>
                )}
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <InfoRow label="ลูกค้า" value={site.customerName} />
                {site.customerType && <InfoRow label="ประเภท" value={site.customerType} />}
                <InfoRow label="โทร" value={site.phone} isPhone />
                {site.contractorName && <InfoRow label="ผู้รับเหมา" value={site.contractorName} />}
                <InfoRow label="เจ้าของงาน" value={site.ownerName} />
              </div>

              {/* Contacts */}
              {site.contacts && site.contacts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">ผู้ติดต่อ ({site.contacts.length})</h4>
                    <div className="space-y-2">
                      {site.contacts.map((c) => (
                        <div key={c.id} className="rounded-lg border p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{c.name || 'ไม่ระบุชื่อ'}</span>
                            {c.isPrimary && (
                              <Badge variant="outline" className="text-[10px]">หลัก</Badge>
                            )}
                          </div>
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="text-xs text-primary underline">
                              {formatPhoneDisplay(c.phone)}
                            </a>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-xs">
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
                </>
              )}

              <Separator />

              {/* Location + Dates */}
              <div className="space-y-2">
                {site.address && <InfoRow label="ที่อยู่" value={site.address} />}
                {site.amphoe && <InfoRow label="อำเภอ" value={site.amphoe} />}
                {site.nextFollowUpDate && (
                  <InfoRow label="นัดติดตาม" value={formatThaiDate(site.nextFollowUpDate)} />
                )}
                {site.expectedOrderDate && (
                  <InfoRow label="คาดว่าจะสั่ง" value={formatThaiDate(site.expectedOrderDate)} />
                )}
                {site.lostReason && <InfoRow label="สาเหตุจบที่อื่น" value={site.lostReason} />}
                {site.competitor && <InfoRow label="คู่แข่ง" value={site.competitor} />}
                <InfoRow label="สร้างเมื่อ" value={formatThaiDate(site.createdAt)} />
              </div>

              {/* Map link */}
              {site.mapsUrl && (
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-primary underline"
                >
                  เปิดใน Google Maps
                </a>
              )}

              <Separator />

              {/* Photos */}
              {site.photos && site.photos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">รูปภาพ</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {site.photos.map((p) => (
                      <img
                        key={p.id}
                        src={p.thumbUrl || p.fullUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded-md border flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  ประวัติการรายงาน ({site.reports?.length || 0})
                </h4>
                <div className="space-y-3">
                  {site.reports?.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              {site.canEdit && site.status === 'following' && (
                <Button
                  onClick={() => setShowFollowUp(true)}
                  className="w-full"
                  size="lg"
                >
                  รายงาน Follow-up
                </Button>
              )}
            </div>
          ) : (
            <div className="px-4 pb-6 text-center text-sm text-muted-foreground">ไม่พบข้อมูล</div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Follow-up Sheet */}
      {showFollowUp && site && (
        <FollowUpSheet
          siteCode={site.siteCode}
          siteName={site.customerName}
          currentStage={site.stage}
          onClose={() => setShowFollowUp(false)}
          onSuccess={() => {
            setShowFollowUp(false)
            toast.success('บันทึก Follow-up สำเร็จ')
          }}
        />
      )}
    </>
  )
}

function InfoRow({ label, value, isPhone }: { label: string; value: string; isPhone?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {isPhone ? (
        <a href={`tel:${value}`} className="font-medium text-primary underline">
          {formatPhoneDisplay(value)}
        </a>
      ) : (
        <span className="font-medium text-right max-w-[60%]">{value}</span>
      )}
    </div>
  )
}

function ReportCard({ report }: { report: ReportBrief }) {
  const isNew = report.reportType === 'new'
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isNew ? 'default' : 'secondary'} className="text-xs">
            {isNew ? 'งานใหม่' : 'Follow-up'}
          </Badge>
          {report.status && report.status !== 'following' && (
            <Badge className={`text-xs ${SITE_STATUS_STYLES[report.status] || ''}`}>
              {SITE_STATUS_LABELS[report.status] || report.status}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatThaiDate(report.reportDate)}
        </span>
      </div>
      {report.note && (
        <p className="text-sm text-muted-foreground">{report.note}</p>
      )}
      <p className="text-xs text-muted-foreground">โดย {report.repName}</p>
      {report.photos && report.photos.length > 0 && (
        <div className="flex gap-1 mt-1">
          {report.photos.map((p) => (
            <img
              key={p.id}
              src={p.thumbUrl || p.fullUrl}
              alt=""
              className="w-12 h-12 object-cover rounded border"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatPhoneDisplay(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
  }
  return phone
}
