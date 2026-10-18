import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Search } from 'lucide-react'
import { formatThaiDate } from '@/lib/format-th'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSiteList } from '../hooks'
import type { SiteBrief, SiteListParams } from '../service'

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

const STAGE_LABELS: Record<string, string> = {
  new: 'ใหม่',
  quoting: 'เสนอราคา',
  negotiating: 'เจรจา',
}

const columnHelper = createColumnHelper<SiteBrief>()

const columns = [
  columnHelper.accessor('createdAt', {
    header: 'วันที่',
    cell: (info) => (
      <span className="num text-xs text-muted-foreground whitespace-nowrap">
        {formatThaiDate(info.getValue())}
      </span>
    ),
    size: 90,
  }),
  columnHelper.accessor('siteCode', {
    header: 'รหัส',
    cell: (info) => (
      <span className="num text-xs font-medium whitespace-nowrap">
        {info.getValue()}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor('customerName', {
    header: 'ลูกค้า',
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
    size: 140,
  }),
  columnHelper.accessor('phone', {
    header: 'โทร',
    cell: (info) => (
      <span className="num text-muted-foreground whitespace-nowrap">
        {info.getValue()}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor('ownerName', {
    header: 'เซลล์',
    size: 100,
  }),
  columnHelper.accessor('customerType', {
    header: 'ประเภท',
    cell: (info) => info.getValue() || '-',
    size: 80,
  }),
  columnHelper.accessor('amphoe', {
    header: 'อำเภอ',
    cell: (info) => info.getValue() || '-',
    size: 100,
  }),
  columnHelper.accessor('decisionMaker', {
    header: 'ผู้ตัดสินใจ',
    cell: (info) => info.getValue() || '-',
    size: 100,
  }),
  columnHelper.accessor('stage', {
    header: 'ขั้นตอน',
    cell: (info) => (
      <span className="text-muted-foreground">
        {STAGE_LABELS[info.getValue()] || info.getValue() || '-'}
      </span>
    ),
    size: 80,
  }),
  columnHelper.accessor('status', {
    header: 'สถานะ',
    cell: (info) => (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[info.getValue()] || ''}`}>
        {STATUS_LABELS[info.getValue()] || info.getValue()}
      </span>
    ),
    size: 100,
  }),
  columnHelper.accessor('nextFollowUpDate', {
    header: 'นัดติดตาม',
    cell: (info) => {
      const val = info.getValue()
      if (!val) return <span className="text-muted-foreground">-</span>
      return <span className="num text-xs whitespace-nowrap">{formatThaiDate(val)}</span>
    },
    size: 90,
  }),
  columnHelper.accessor('reportCount', {
    header: 'รายงาน',
    cell: (info) => (
      <span className="num text-center block">{info.getValue()}</span>
    ),
    size: 60,
  }),
]

export function SitesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<SiteListParams>({ page: 1, limit: 50 })
  const [searchInput, setSearchInput] = useState('')
  const { data, isLoading } = useSiteList(params)

  const table = useReactTable({
    data: data?.sites ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / data.limit) : 0,
  })

  function handleSearch() {
    setParams((p) => ({ ...p, q: searchInput || undefined, page: 1 }))
  }

  function handleStatusChange(status: string | null) {
    setParams((p) => ({ ...p, status: !status || status === 'all' ? undefined : status, page: 1 }))
  }

  const currentPage = params.page || 1
  const totalPages = data ? Math.ceil(data.total / (data.limit || 50)) : 0

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหา ชื่อ / เบอร์ / รหัส..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>
          ค้นหา
        </Button>

        <Select
          value={params.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="following">กำลังติดตาม</SelectItem>
            <SelectItem value="won">จบได้</SelectItem>
            <SelectItem value="lost">จบที่อื่น</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : !table.getRowModel().rows.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sites/${row.original.siteCode}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>ทั้งหมด <span className="num font-medium text-foreground">{data.total}</span> งาน</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setParams((p) => ({ ...p, page: currentPage - 1 }))}
            >
              ก่อนหน้า
            </Button>
            <span className="num px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setParams((p) => ({ ...p, page: currentPage + 1 }))}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
