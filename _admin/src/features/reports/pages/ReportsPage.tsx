import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { formatThaiDate } from '@/lib/format-th'
import { useByRep, useByArea, useLostReasons, useActivity } from '../hooks'
import type { RepAnalytics } from '../service'

export function ReportsPage() {
  const [selectedRep, setSelectedRep] = useState<RepAnalytics | null>(null)

  return (
    <div className="space-y-4">
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">ทีม</TabsTrigger>
          <TabsTrigger value="individual">รายบุคคล</TabsTrigger>
          <TabsTrigger value="area">พื้นที่</TabsTrigger>
          <TabsTrigger value="lost">สาเหตุจบที่อื่น</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <TeamTab onSelectRep={setSelectedRep} />
        </TabsContent>
        <TabsContent value="individual" className="mt-4">
          <IndividualTab rep={selectedRep} onBack={() => setSelectedRep(null)} />
        </TabsContent>
        <TabsContent value="area" className="mt-4">
          <AreaTab />
        </TabsContent>
        <TabsContent value="lost" className="mt-4">
          <LostTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** Tab 1: ทีม — ตาราง scoreboard */
function TeamTab({ onSelectRep }: { onSelectRep: (rep: RepAnalytics) => void }) {
  const { data: reps, isLoading } = useByRep()

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
  if (!reps?.length) return <p className="text-sm text-muted-foreground text-center py-12">ยังไม่มีข้อมูล</p>

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>เซลล์</TableHead>
                <TableHead className="text-center">วิ่งงาน</TableHead>
                <TableHead className="text-center">ใหม่</TableHead>
                <TableHead className="text-center">ติดตาม</TableHead>
                <TableHead className="w-48">ผลลัพธ์</TableHead>
                <TableHead className="text-center">ปิดได้%</TableHead>
                <TableHead className="text-center">เลยกำหนด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reps.map((rep) => {
                const total = rep.won + rep.lost + rep.following
                const wonPct = total > 0 ? (rep.won / total) * 100 : 0
                const followPct = total > 0 ? (rep.following / total) * 100 : 0
                const lostPct = total > 0 ? (rep.lost / total) * 100 : 0

                return (
                  <TableRow
                    key={rep.repId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectRep(rep)}
                  >
                    <TableCell>
                      <Avatar className="size-7">
                        {rep.pictureUrl && <AvatarImage src={rep.pictureUrl} alt="" />}
                        <AvatarFallback className="text-[10px]">{(rep.nickname || '?').slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{rep.nickname || rep.repId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{rep.area || '-'}</p>
                    </TableCell>
                    <TableCell className="text-center num font-medium">{rep.visits}</TableCell>
                    <TableCell className="text-center num">{rep.newSites}</TableCell>
                    <TableCell className="text-center num">{rep.followUps}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full overflow-hidden flex bg-muted">
                          {wonPct > 0 && <div className="bg-success h-full" style={{ width: `${wonPct}%` }} />}
                          {followPct > 0 && <div className="bg-muted-foreground/30 h-full" style={{ width: `${followPct}%` }} />}
                          {lostPct > 0 && <div className="bg-danger h-full" style={{ width: `${lostPct}%` }} />}
                        </div>
                        <span className="text-[10px] text-muted-foreground num whitespace-nowrap">
                          {rep.won}/{rep.following}/{rep.lost}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`num font-bold ${rep.winRate >= 50 ? 'text-success' : rep.winRate > 0 ? 'text-warning' : ''}`}>
                        {rep.winRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {rep.overdue > 0 ? (
                        <span className="num font-medium text-danger">{rep.overdue}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Tab 2: รายบุคคล */
function IndividualTab({ rep, onBack }: { rep: RepAnalytics | null; onBack: () => void }) {
  const { data: reps } = useByRep()
  const [selected, setSelected] = useState<RepAnalytics | null>(rep)
  const current = selected || rep

  const { data: activity } = useActivity(undefined, undefined, current?.repId)

  if (!current) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">เลือกเซลล์เพื่อดูรายละเอียด</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {reps?.map((r) => (
            <button
              key={r.repId}
              onClick={() => setSelected(r)}
              className="border rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  {r.pictureUrl && <AvatarImage src={r.pictureUrl} alt="" />}
                  <AvatarFallback className="text-xs">{(r.nickname || '?').slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{r.nickname || r.repId.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{r.area || '-'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button onClick={() => { setSelected(null); onBack() }} className="text-sm text-primary hover:underline">
        &larr; กลับ
      </button>

      {/* Rep header */}
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {current.pictureUrl && <AvatarImage src={current.pictureUrl} alt="" />}
          <AvatarFallback>{(current.nickname || '?').slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold">{current.nickname || current.repId.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">{current.area || '-'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatMini label="วิ่งงาน" value={current.visits} />
        <StatMini label="งานใหม่" value={current.newSites} />
        <StatMini label="จบได้" value={current.won} className="text-success" />
        <StatMini label="ปิดได้%" value={`${current.winRate}%`} className={current.winRate >= 50 ? 'text-success' : ''} />
      </div>

      {/* Activity heatmap (simple grid) */}
      {activity && activity.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">กิจกรรมรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {activity.map((a) => (
                <div
                  key={a.date}
                  title={`${formatThaiDate(a.date)}: ${a.count} รายงาน`}
                  className="size-4 rounded-sm"
                  style={{
                    backgroundColor: a.count === 0 ? 'var(--muted)' :
                      a.count <= 2 ? 'var(--success-soft)' :
                      a.count <= 5 ? 'var(--success)' : '#15803d',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <span>น้อย</span>
              <div className="size-3 rounded-sm" style={{ backgroundColor: 'var(--success-soft)' }} />
              <div className="size-3 rounded-sm" style={{ backgroundColor: 'var(--success)' }} />
              <div className="size-3 rounded-sm" style={{ backgroundColor: '#15803d' }} />
              <span>มาก</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/** Tab 3: พื้นที่ */
function AreaTab() {
  const { data: areas, isLoading } = useByArea()

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
  if (!areas?.length) return <p className="text-sm text-muted-foreground text-center py-12">ยังไม่มีข้อมูลพื้นที่</p>

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>อำเภอ</TableHead>
                <TableHead className="text-center">งานทั้งหมด</TableHead>
                <TableHead className="text-center">จบได้</TableHead>
                <TableHead className="text-center">จบที่อื่น</TableHead>
                <TableHead className="text-center">ตามต่อ</TableHead>
                <TableHead className="text-center">ปิดได้%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((a) => (
                <TableRow key={a.amphoe || 'unknown'}>
                  <TableCell className="font-medium">{a.amphoe || 'ไม่ระบุ'}</TableCell>
                  <TableCell className="text-center num">{a.visits}</TableCell>
                  <TableCell className="text-center num text-success">{a.won}</TableCell>
                  <TableCell className="text-center num text-danger">{a.lost}</TableCell>
                  <TableCell className="text-center num">{a.following}</TableCell>
                  <TableCell className="text-center num font-medium">{a.winRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Tab 4: สาเหตุจบที่อื่น */
function LostTab() {
  const { data, isLoading } = useLostReasons()

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
  if (!data) return <p className="text-sm text-muted-foreground text-center py-12">ยังไม่มีข้อมูล</p>

  const maxReasonCount = Math.max(...(data.reasons.map((r) => r.count) || [1]), 1)
  const maxCompCount = Math.max(...(data.competitors.map((c) => c.count) || [1]), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Reasons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">สาเหตุ</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.reasons.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {data.reasons.map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{r.reason}</span>
                    <span className="num font-medium">{r.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-danger rounded-full" style={{ width: `${(r.count / maxReasonCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">คู่แข่ง</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.competitors.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {data.competitors.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="num font-medium">{c.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${(c.count / maxCompCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatMini({ label, value, className = '' }: { label: string; value: number | string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-black num leading-tight ${className}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
