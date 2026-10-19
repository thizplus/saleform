import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { thDate } from '@/lib/fmt'
import type { LostSiteBrief } from '@/features/analytics'

interface Props {
  sites: LostSiteBrief[]
}

/** ตารางรายการงานที่จบที่อื่น */
export function LostSiteTable({ sites }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">รหัส</TableHead>
            <TableHead>ลูกค้า</TableHead>
            <TableHead>เซลล์</TableHead>
            <TableHead>อำเภอ</TableHead>
            <TableHead>สาเหตุ</TableHead>
            <TableHead>คู่แข่ง</TableHead>
            <TableHead>ขั้นตอน</TableHead>
            <TableHead className="pr-4 text-right">วันที่ปิด</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((s) => (
            <TableRow key={s.siteCode}>
              <TableCell className="pl-4 font-mono text-xs">{s.siteCode}</TableCell>
              <TableCell className="font-medium">{s.customerName}</TableCell>
              <TableCell>{s.repName}</TableCell>
              <TableCell className="text-muted-foreground">{s.amphoe}</TableCell>
              <TableCell>{s.lostReason || '-'}</TableCell>
              <TableCell>{s.competitor || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{s.stage || '-'}</TableCell>
              <TableCell className="num pr-4 text-right text-muted-foreground">
                {thDate(new Date(s.closedAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
