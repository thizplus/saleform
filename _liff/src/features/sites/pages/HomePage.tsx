import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { isInLiff, getIDToken, isLoggedIn, liffLogin, closeLiff } from '@/lib/liff-helpers'
import { useLIFFAuth } from '@/features/auth'
import { SITE_STATUS_LABELS, SITE_STATUS_STYLES, TAB_OPTIONS } from '@/constants/enums'
import { formatThaiDate } from '@/lib/thai-date'
import { useSiteList } from '../hooks'
import { SiteDetailSheet } from '../components/SiteDetailSheet'
import type { SiteListParams } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, profile, clearAuth } = useAuthStore()
  const liffAuth = useLIFFAuth()
  const [activeTab, setActiveTab] = useState('due_today')
  const [params, setParams] = useState<SiteListParams>({ tab: 'due_today', page: 1, limit: 20 })
  const [selectedSiteCode, setSelectedSiteCode] = useState<string | null>(null)

  // Auto-login once when LIFF is ready
  const [loginAttempted, setLoginAttempted] = useState(false)

  useEffect(() => {
    if (isAuthenticated || loginAttempted) return

    async function autoLogin() {
      setLoginAttempted(true)

      if (!isLoggedIn()) {
        if (isInLiff()) {
          liffLogin()
        }
        return
      }

      const idToken = await getIDToken()
      if (idToken) {
        liffAuth.mutate({ idToken })
      }
    }
    autoLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading } = useSiteList(params, isAuthenticated)

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setParams((prev) => ({ ...prev, tab, page: 1 }))
  }

  // Registration form state
  const [regNickname, setRegNickname] = useState('')
  const [regArea, setRegArea] = useState('')
  const [regSubmitting, setRegSubmitting] = useState(false)

  const authData = liffAuth.data
  const notActive = liffAuth.isSuccess && !authData?.token && authData?.profile

  async function handleRegister() {
    if (!regNickname.trim()) return
    setRegSubmitting(true)
    const idToken = await getIDToken()
    if (idToken) {
      liffAuth.mutate({ idToken, nickname: regNickname, area: regArea })
    }
    setRegSubmitting(false)
  }

  // Not active states
  if (notActive) {
    const p = authData.profile

    // Inactive (disabled by admin)
    if (p.status === 'inactive') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-4xl">🚫</div>
              <h2 className="text-lg font-semibold">บัญชีถูกปิดใช้งาน</h2>
              <p className="text-sm text-muted-foreground">กรุณาติดต่อแอดมิน</p>
              <Button variant="outline" onClick={() => closeLiff()} className="w-full">ปิด</Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Pending + already registered → waiting for approval
    if (p.registered) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center space-y-4">
              {p.pictureUrl && <img src={p.pictureUrl} alt="" className="w-16 h-16 rounded-full mx-auto" />}
              <h2 className="text-lg font-semibold">{p.displayName}</h2>
              <p className="text-sm text-muted-foreground">ชื่อเล่น: {p.nickname} · พื้นที่: {p.area || '-'}</p>
              <div className="text-4xl">🕐</div>
              <p className="text-base font-medium">รอแอดมินอนุมัติ</p>
              <p className="text-sm text-muted-foreground">ข้อมูลของคุณถูกส่งแล้ว กรุณารอแอดมินตรวจสอบและอนุมัติ</p>
              <Button variant="outline" onClick={() => closeLiff()} className="w-full">ปิด</Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Pending + not registered → show registration form
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              {p.pictureUrl && <img src={p.pictureUrl} alt="" className="w-16 h-16 rounded-full mx-auto" />}
              <h2 className="text-lg font-semibold mt-2">{p.displayName}</h2>
              <p className="text-sm text-muted-foreground">กรอกข้อมูลเพื่อลงทะเบียน</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">ชื่อเล่น *</label>
              <input
                type="text"
                placeholder="ชื่อเล่นที่ใช้ในทีม"
                value={regNickname}
                onChange={(e) => setRegNickname(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">พื้นที่รับผิดชอบ</label>
              <input
                type="text"
                placeholder="เช่น อ.เมือง จ.ขอนแก่น"
                value={regArea}
                onChange={(e) => setRegArea(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button
              onClick={handleRegister}
              disabled={regSubmitting || !regNickname.trim()}
              className="w-full"
            >
              {regSubmitting ? 'กำลังส่ง...' : 'ลงทะเบียน'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading / Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">📋</div>
            <h2 className="text-lg font-semibold">ระบบรายงานเซลล์</h2>
            <p className="text-sm text-muted-foreground">UP Steel Sales Report</p>
            {liffAuth.isPending ? (
              <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบ...</p>
            ) : liffAuth.isError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">เข้าสู่ระบบไม่สำเร็จ</p>
                <Button onClick={() => liffLogin()} size="sm">
                  ลองใหม่
                </Button>
              </div>
            ) : (
              <Button onClick={() => liffLogin()} className="w-full">
                เข้าสู่ระบบด้วย LINE
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/test')}
              className="text-xs text-muted-foreground"
            >
              LIFF Test Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-sm">{profile?.displayName}</div>
              <div className="text-xs text-muted-foreground">{profile?.area || 'ไม่ระบุพื้นที่'}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAuth}>
            ออก
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mt-2 text-xs">
          <Badge variant="destructive" className="text-xs">
            เลยกำหนด {profile?.counts.overdue ?? 0}
          </Badge>
          <Badge variant="default" className="text-xs">
            วันนี้ {profile?.counts.dueToday ?? 0}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ติดตาม {profile?.counts.following ?? 0}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground'
            }`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Site list */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลด...</div>
        ) : !data?.sites?.length ? (
          <div className="text-center py-8 space-y-2">
            <div className="text-3xl">📭</div>
            <p className="text-sm text-muted-foreground">ยังไม่มีงาน</p>
          </div>
        ) : (
          data.sites.map((site) => (
            <Card
              key={site.siteCode}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedSiteCode(site.siteCode)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{site.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      #{site.siteCode} · {site.phone}
                    </div>
                    {site.nextFollowUpDate && (
                      <div className="text-xs text-muted-foreground">
                        นัดติดตาม: {formatThaiDate(site.nextFollowUpDate)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={SITE_STATUS_STYLES[site.status] || ''}>
                      {SITE_STATUS_LABELS[site.status] || site.status}
                    </Badge>
                    {!site.isMine && (
                      <span className="text-xs text-muted-foreground">{site.ownerName}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* FAB - New Report */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
        onClick={() => navigate('/new')}
      >
        +
      </button>

      {/* Site Detail Bottom Sheet */}
      <SiteDetailSheet
        code={selectedSiteCode}
        onClose={() => setSelectedSiteCode(null)}
      />
    </div>
  )
}
