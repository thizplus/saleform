import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { ADMIN_ROUTES } from '@/constants/api-routes'

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
  const [editingId, setEditingId] = useState<string | null>(null)
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
      setEditingId(null)
    },
  })

  function startEdit(rep: SalesRep) {
    setEditingId(rep.id)
    setEditNickname(rep.nickname)
    setEditArea(rep.area)
  }

  function saveEdit(id: string) {
    updateMutation.mutate({ id, data: { nickname: editNickname, area: editArea } })
  }

  function toggleStatus(rep: SalesRep) {
    const newStatus = rep.status === 'active' ? 'inactive' : 'active'
    updateMutation.mutate({ id: rep.id, data: { status: newStatus } })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">จัดการเซลล์</h1>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">รูป</th>
              <th className="text-left px-4 py-2 font-medium">ชื่อ LINE</th>
              <th className="text-left px-4 py-2 font-medium">ชื่อเล่น</th>
              <th className="text-left px-4 py-2 font-medium">พื้นที่</th>
              <th className="text-left px-4 py-2 font-medium">สถานะ</th>
              <th className="text-center px-4 py-2 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">กำลังโหลด...</td></tr>
            ) : !reps?.length ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">ยังไม่มีเซลล์</td></tr>
            ) : (
              reps.map((rep) => (
                <tr key={rep.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2">
                    {rep.pictureUrl ? (
                      <img src={rep.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted" />
                    )}
                  </td>
                  <td className="px-4 py-2">{rep.displayName}</td>
                  <td className="px-4 py-2">
                    {editingId === rep.id ? (
                      <input
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="rounded border border-input px-2 py-1 text-sm w-28"
                      />
                    ) : (
                      <span className="text-muted-foreground">{rep.nickname || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === rep.id ? (
                      <input
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="rounded border border-input px-2 py-1 text-sm w-28"
                      />
                    ) : (
                      <span className="text-muted-foreground">{rep.area || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleStatus(rep)}
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        rep.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rep.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {editingId === rep.id ? (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => saveEdit(rep.id)} className="text-xs text-primary">บันทึก</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground">ยกเลิก</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(rep)} className="text-xs text-primary">แก้ไข</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
