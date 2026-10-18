import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Pencil, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'

interface SalesRep {
  id: string
  lineUserId: string
  displayName: string
  pictureUrl: string
  nickname: string
  area: string
  status: string
}

export function RepsPage() {
  const queryClient = useQueryClient()
  const [editRep, setEditRep] = useState<SalesRep | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editArea, setEditArea] = useState('')

  const { data: reps, isLoading } = useQuery({
    queryKey: ['admin-reps'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SalesRep[] }>(ADMIN_ROUTES.REPS)
      return res.data.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      apiClient.patch(ADMIN_ROUTES.REP_BY_ID(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reps'] })
      setEditRep(null)
    },
  })

  function approve(rep: SalesRep) {
    updateMutation.mutate(
      { id: rep.id, data: { status: 'active' } },
      { onSuccess: () => toast.success(`อนุมัติ ${rep.displayName} แล้ว`) },
    )
  }

  function reject(rep: SalesRep) {
    updateMutation.mutate(
      { id: rep.id, data: { status: 'inactive' } },
      { onSuccess: () => toast.info(`ปฏิเสธ ${rep.displayName} แล้ว`) },
    )
  }

  function deactivate(rep: SalesRep) {
    updateMutation.mutate(
      { id: rep.id, data: { status: 'inactive' } },
      { onSuccess: () => toast.info(`ปิดใช้งาน ${rep.nickname || rep.displayName} แล้ว`) },
    )
  }

  function reactivate(rep: SalesRep) {
    updateMutation.mutate(
      { id: rep.id, data: { status: 'active' } },
      { onSuccess: () => toast.success(`เปิดใช้งาน ${rep.nickname || rep.displayName} แล้ว`) },
    )
  }

  function openEdit(rep: SalesRep) {
    setEditRep(rep)
    setEditNickname(rep.nickname)
    setEditArea(rep.area)
  }

  function saveEdit() {
    if (!editRep) return
    updateMutation.mutate(
      { id: editRep.id, data: { nickname: editNickname, area: editArea } },
      { onSuccess: () => toast.success('บันทึกแล้ว') },
    )
  }

  const pending = reps?.filter((r) => r.status === 'pending') ?? []
  const active = reps?.filter((r) => r.status === 'active') ?? []
  const inactive = reps?.filter((r) => r.status === 'inactive') ?? []

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            รออนุมัติ {pending.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">ใช้งาน ({active.length})</TabsTrigger>
          <TabsTrigger value="inactive">ปิดใช้งาน ({inactive.length})</TabsTrigger>
        </TabsList>

        {/* Pending */}
        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
          ) : !pending.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">ไม่มีเซลล์รออนุมัติ</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((rep) => (
                <div key={rep.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      {rep.pictureUrl && <AvatarImage src={rep.pictureUrl} alt="" />}
                      <AvatarFallback>{rep.displayName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{rep.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{rep.lineUserId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => approve(rep)}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="size-4 mr-1" />
                      อนุมัติ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => reject(rep)}
                      disabled={updateMutation.isPending}
                    >
                      <X className="size-4 mr-1" />
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active */}
        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
          ) : !active.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีเซลล์</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>ชื่อ LINE</TableHead>
                    <TableHead>ชื่อเล่น</TableHead>
                    <TableHead>พื้นที่</TableHead>
                    <TableHead className="text-center w-32">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell>
                        <Avatar className="size-8">
                          {rep.pictureUrl && <AvatarImage src={rep.pictureUrl} alt="" />}
                          <AvatarFallback className="text-xs">{rep.displayName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{rep.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">{rep.nickname || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{rep.area || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(rep)} title="แก้ไข">
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => deactivate(rep)} title="ปิดใช้งาน">
                            <UserX />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Inactive */}
        <TabsContent value="inactive" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
          ) : !inactive.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">ไม่มีเซลล์ที่ปิดใช้งาน</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>ชื่อ LINE</TableHead>
                    <TableHead>ชื่อเล่น</TableHead>
                    <TableHead>พื้นที่</TableHead>
                    <TableHead className="text-center w-24">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactive.map((rep) => (
                    <TableRow key={rep.id} className="opacity-60">
                      <TableCell>
                        <Avatar className="size-8">
                          {rep.pictureUrl && <AvatarImage src={rep.pictureUrl} alt="" />}
                          <AvatarFallback className="text-xs">{rep.displayName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{rep.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">{rep.nickname || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{rep.area || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon-xs" onClick={() => reactivate(rep)} title="เปิดใช้งาน">
                          <UserCheck />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editRep} onOpenChange={(open) => !open && setEditRep(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>แก้ไขเซลล์</DialogTitle>
            <DialogDescription className="sr-only">แก้ไขชื่อเล่นและพื้นที่ของเซลล์</DialogDescription>
          </DialogHeader>
          {editRep && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  {editRep.pictureUrl && <AvatarImage src={editRep.pictureUrl} alt="" />}
                  <AvatarFallback>{editRep.displayName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{editRep.displayName}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">ชื่อเล่น</Label>
                <Input
                  id="nickname"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="ชื่อเล่นเซลล์"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">พื้นที่</Label>
                <Input
                  id="area"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder="พื้นที่รับผิดชอบ"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              ยกเลิก
            </DialogClose>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
