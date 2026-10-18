import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Shield, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatThaiDate } from '@/lib/format-th'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUsers, userKeys } from '../hooks'
import { userService } from '../service'

export function UsersPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useUsers()
  const [addOpen, setAddOpen] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('อัปเดตแล้ว')
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">ผู้ใช้ระบบ</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-1" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>สิทธิ์</TableHead>
              <TableHead>สร้างเมื่อ</TableHead>
              <TableHead className="text-center">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">กำลังโหลด...</TableCell>
              </TableRow>
            ) : !users?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">ยังไม่มีผู้ใช้</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs gap-1">
                      {user.role === 'admin' ? <Shield className="size-3" /> : <Eye className="size-3" />}
                      {user.role === 'admin' ? 'แอดมิน' : 'ผู้ดู'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs num">
                    {formatThaiDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      disabled={toggleMutation.isPending}
                    >
                      {user.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}

function AddUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('viewer')

  const createMutation = useMutation({
    mutationFn: () => userService.create({ email, password, displayName, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('เพิ่มผู้ใช้แล้ว')
      onOpenChange(false)
      setEmail('')
      setPassword('')
      setDisplayName('')
      setRole('viewer')
    },
    onError: () => {
      toast.error('ไม่สามารถเพิ่มผู้ใช้ได้')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ใช้</DialogTitle>
          <DialogDescription className="sr-only">เพิ่มผู้ใช้ระบบแอดมิน</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>ชื่อ</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ชื่อแสดง" />
          </div>
          <div className="space-y-1.5">
            <Label>อีเมล</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>รหัสผ่าน</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" />
          </div>
          <div className="space-y-1.5">
            <Label>สิทธิ์</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">แอดมิน (แก้ไขได้ทุกอย่าง)</SelectItem>
                <SelectItem value="viewer">ผู้ดู (ดูอย่างเดียว)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            ยกเลิก
          </DialogClose>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!email || !password || !displayName || createMutation.isPending}
          >
            เพิ่มผู้ใช้
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
