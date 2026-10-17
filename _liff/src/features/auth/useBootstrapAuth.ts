import { useEffect, useRef, useState } from 'react'
import liff from '@line/liff'
import { useAuthStore } from '@/stores/auth'
import { authService } from './service'

export type BootstrapStatus =
  | 'loading'       // กำลัง init / auth
  | 'not-in-line'   // เปิดนอกแอป LINE
  | 'register'      // ใหม่ ยังไม่ลงทะเบียน
  | 'pending'       // ลงทะเบียนแล้ว รออนุมัติ
  | 'inactive'      // ถูกปิดบัญชี
  | 'ready'         // เข้าหน้าหลักได้
  | 'error'         // เกิดข้อผิดพลาด
  | 'slow'          // เชื่อมต่อช้า (> 8 วินาที)

interface BootstrapResult {
  status: BootstrapStatus
  retry: () => void
}

/**
 * Auth bootstrap hook — ใช้ useRef กัน double-call จาก StrictMode
 * - ไม่ใช้ liff.login() ในแอป LINE (LIFF auto-login)
 * - ตรวจ ID token หมดอายุก่อนส่ง
 */
export function useBootstrapAuth(): BootstrapResult {
  const [status, setStatus] = useState<BootstrapStatus>('loading')
  const authingRef = useRef(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const existingToken = useAuthStore((s) => s.token)

  async function doAuth() {
    if (authingRef.current) return
    authingRef.current = true
    setStatus('loading')

    // ตั้ง timeout 8 วินาที แสดง "เชื่อมต่อช้า"
    const slowTimer = setTimeout(() => setStatus('slow'), 8000)

    try {
      // เปิดนอก LINE → บอกให้เปิดจากกลุ่ม
      if (!liff.isInClient()) {
        // ถ้ามี token เดิมอยู่แล้ว (dev mode ใน browser) ลอง refresh profile
        if (existingToken) {
          try {
            const data = await authService.refreshProfile()
            updateProfile(data.profile)
            const resolved = resolveStatus(data.profile)
            setStatus(resolved)
            return
          } catch {
            // token เก่าใช้ไม่ได้ → ไป not-in-line
          }
        }
        setStatus('not-in-line')
        return
      }

      // ใน LINE — ต้อง isLoggedIn (LIFF Full ทำให้อัตโนมัติ)
      if (!liff.isLoggedIn()) {
        // ไม่เรียก liff.login() ใน LINE app — ถ้า Full mode ควร logged in เสมอ
        setStatus('error')
        return
      }

      // ดึง ID token
      const idToken = liff.getIDToken()
      if (!idToken) {
        setStatus('error')
        return
      }

      // ถ้ามี JWT token เก่าอยู่แล้ว → ลอง refresh profile ก่อน (เร็วกว่า)
      if (existingToken) {
        try {
          const data = await authService.refreshProfile()
          updateProfile(data.profile)
          const resolved = resolveStatus(data.profile)
          setStatus(resolved)
          return
        } catch {
          // token หมดอายุ → ไป auth ด้วย idToken ข้างล่าง
        }
      }

      // ส่ง ID token ไป backend
      const data = await authService.liffAuth({ idToken })
      if (data.token) {
        setAuth(data.token, data.profile)
        setStatus('ready')
      } else {
        // ไม่ได้ token กลับมา → ดูสถานะ profile
        const resolved = resolveStatus(data.profile)
        setStatus(resolved)
      }
    } catch {
      setStatus('error')
    } finally {
      clearTimeout(slowTimer)
      authingRef.current = false
    }
  }

  useEffect(() => {
    doAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status,
    retry: () => {
      authingRef.current = false
      doAuth()
    },
  }
}

function resolveStatus(profile: { status: string; registered: boolean }): BootstrapStatus {
  if (profile.status === 'active') return 'ready'
  if (profile.status === 'inactive') return 'inactive'
  // pending
  if (profile.registered) return 'pending'
  return 'register'
}
