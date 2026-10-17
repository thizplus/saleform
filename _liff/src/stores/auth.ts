import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RepProfile {
  id: string
  displayName: string
  pictureUrl: string
  nickname: string
  areas: string[]
  phone: string
  status: 'pending' | 'active' | 'inactive'
  registered: boolean
  counts: {
    dueToday: number
    overdue: number
    following: number
    total: number
  }
}

interface AuthState {
  token: string | null
  profile: RepProfile | null
  /** คำนวณจาก token !== null — ไม่ persist */
  isAuthenticated: boolean
  setAuth: (token: string, profile: RepProfile) => void
  updateProfile: (profile: RepProfile) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      isAuthenticated: false,
      setAuth: (token, profile) => {
        localStorage.setItem('token', token)
        set({ token, profile, isAuthenticated: true })
      },
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => {
        localStorage.removeItem('token')
        set({ token: null, profile: null, isAuthenticated: false })
      },
    }),
    {
      name: 'liff-auth',
      // persist เฉพาะ token + profile — isAuthenticated คำนวณตอน rehydrate
      partialize: (state) => ({
        token: state.token,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token) {
          state.isAuthenticated = true
        }
      },
    }
  )
)
