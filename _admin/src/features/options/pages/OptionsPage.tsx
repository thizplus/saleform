import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

interface Options {
  customerTypes: string[]
  decisionMakers: string[]
  stages: string[]
  lostReasons: string[]
  competitors: string[]
}

export function OptionsPage() {
  const queryClient = useQueryClient()
  const [options, setOptions] = useState<Options>({
    customerTypes: [],
    decisionMakers: [],
    stages: [],
    lostReasons: [],
    competitors: [],
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-options'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Options }>(ADMIN_ROUTES.OPTIONS)
      return res.data.data
    },
  })

  useEffect(() => {
    if (data) setOptions(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put(ADMIN_ROUTES.OPTIONS, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] })
      alert('บันทึกสำเร็จ')
    },
  })

  function updateList(key: keyof Options, value: string) {
    setOptions((prev) => ({ ...prev, [key]: value.split('\n').filter(Boolean) }))
  }

  if (isLoading) return <div className="text-muted-foreground">กำลังโหลด...</div>

  const fields: { key: keyof Options; label: string }[] = [
    { key: 'customerTypes', label: 'ประเภทลูกค้า' },
    { key: 'decisionMakers', label: 'ผู้มีอำนาจตัดสินใจ' },
    { key: 'stages', label: 'ขั้นตอน' },
    { key: 'lostReasons', label: 'สาเหตุจบที่อื่น' },
    { key: 'competitors', label: 'คู่แข่ง' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">ตั้งค่าตัวเลือก Dropdown</h1>
      <p className="text-sm text-muted-foreground">แก้ไขรายการตัวเลือกที่เซลล์จะเห็นในฟอร์ม (บรรทัดละ 1 ตัวเลือก)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            <textarea
              rows={5}
              value={options[key].join('\n')}
              onChange={(e) => updateList(key, e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </div>
  )
}
