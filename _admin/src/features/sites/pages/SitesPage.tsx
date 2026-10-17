import { useState } from 'react'
import { formatThaiDate } from '@/lib/thai-date'
import { useSiteList } from '../hooks'
import type { SiteListParams } from '../service'

const STATUS_LABELS: Record<string, string> = {
  following: 'กำลังติดตาม',
  won: 'จบได้',
  lost: 'จบที่อื่น',
  cancelled: 'ยกเลิก',
}

const STATUS_COLORS: Record<string, string> = {
  following: 'bg-blue-100 text-blue-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function SitesPage() {
  const [params, setParams] = useState<SiteListParams>({ page: 1, limit: 20 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = useSiteList(params)

  function handleSearch() {
    setParams((p) => ({ ...p, q: search, page: 1 }))
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status)
    setParams((p) => ({ ...p, status: status || undefined, page: 1 }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">งานทั้งหมด</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ค้นหา ชื่อ / เบอร์ / รหัส..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm w-64"
          />
          <button
            onClick={handleSearch}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm"
          >
            ค้นหา
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">ทุกสถานะ</option>
          <option value="following">กำลังติดตาม</option>
          <option value="won">จบได้</option>
          <option value="lost">จบที่อื่น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">รหัส</th>
              <th className="text-left px-4 py-2 font-medium">ลูกค้า</th>
              <th className="text-left px-4 py-2 font-medium">โทร</th>
              <th className="text-left px-4 py-2 font-medium">เซลล์</th>
              <th className="text-left px-4 py-2 font-medium">สถานะ</th>
              <th className="text-left px-4 py-2 font-medium">นัดติดตาม</th>
              <th className="text-center px-4 py-2 font-medium">รายงาน</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</td></tr>
            ) : !data?.sites?.length ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</td></tr>
            ) : (
              data.sites.map((site) => (
                <tr key={site.siteCode} className="border-b hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-2 font-mono text-xs">{site.siteCode}</td>
                  <td className="px-4 py-2">{site.customerName}</td>
                  <td className="px-4 py-2 text-muted-foreground">{site.phone}</td>
                  <td className="px-4 py-2 text-muted-foreground">{site.ownerName}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[site.status] || ''}`}>
                      {STATUS_LABELS[site.status] || site.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {site.nextFollowUpDate ? formatThaiDate(site.nextFollowUpDate) : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">{site.reportCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>ทั้งหมด {data.total} งาน</span>
          <div className="flex gap-2">
            <button
              disabled={data.page <= 1}
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="px-3 py-1">หน้า {data.page}</span>
            <button
              disabled={data.sites.length < data.limit}
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
