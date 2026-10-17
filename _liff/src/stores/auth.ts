import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RepProfile {
  id: string
  displayName: string
  pictureUrl: string
  nickname: string
  area: string
  status: string
  counts: {
    dueToday: number
    overdue: number
    following: number
  }
}

interface AuthState {
  token: string | null
  profile: RepProfile | null
  isAuthenticated: boolean
  setAuth: (token: string, profile: RepProfile) => void
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
      clearAuth: () => {
        localStorage.removeItem('token')
        set({ token: null, profile: null, isAuthenticated: false })
      },
    }),
    {
      name: 'liff-auth',
      partialize: (state) => ({
        token: state.token,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
