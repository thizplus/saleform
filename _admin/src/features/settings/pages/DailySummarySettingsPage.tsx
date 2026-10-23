import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

interface DailySummaryConfig {
  enabled: boolean
  time: string
  groupId: string
}

function useDailySummaryConfig() {
  return useQuery({
    queryKey: ['daily-summary-config'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DailySummaryConfig }>(ADMIN_ROUTES.DAILY_SUMMARY)
      return res.data.data
    },
  })
}

export function DailySummarySettingsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useDailySummaryConfig()

  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('18:00')
  const [groupId, setGroupId] = useState('')

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled)
      setTime(data.time || '18:00')
      setGroupId(data.groupId || '')
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(ADMIN_ROUTES.DAILY_SUMMARY, { enabled, time, groupId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-summary-config'] })
      toast.success('บันทึกสำเร็จ')
    },
    onError: () => toast.error('บันทึกไม่สำเร็จ'),
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ data: { sent: boolean } }>(ADMIN_ROUTES.DAILY_SUMMARY_TEST)
      return res.data.data
    },
    onSuccess: () => toast.success('ส่งทดสอบสำเร็จ! ดูในกลุ่ม LINE'),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'ส่งไม่สำเร็จ'),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-12">กำลังโหลด...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">สรุปประจำวัน</h1>
        <p className="text-sm text-muted-foreground">ตั้งค่าส่งสรุปข้อมูลรายวันเข้ากลุ่ม LINE อัตโนมัติ</p>
      </div>

      <div className="max-w-lg space-y-5">
        {/* เปิด/ปิด */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-bold">เปิดส่งอัตโนมัติ</p>
            <p className="text-xs text-muted-foreground">ส่งสรุปรายวันเข้ากลุ่มตามเวลาที่กำหนด</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* เวลา */}
        <div className="space-y-1.5">
          <Label>เวลาส่ง</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-40"
          />
          <p className="text-xs text-muted-foreground">ส่งทุกวันตามเวลานี้ (เวลาไทย)</p>
        </div>

        {/* Group ID */}
        <div className="space-y-1.5">
          <Label>LINE Group ID</Label>
          <Input
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Group ID ของกลุ่ม LINE ที่ต้องการส่ง (ดูได้จากหน้าจัดการกลุ่ม)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || !groupId}
          >
            {testMutation.isPending ? 'กำลังส่ง...' : 'ส่งทดสอบ'}
          </Button>
        </div>
      </div>
    </div>
  )
}
