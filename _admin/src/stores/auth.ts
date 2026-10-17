import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminProfile {
  id: string
  email: string
  displayName: string
  role: string
}

interface AuthState {
  token: string | null
  user: AdminProfile | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AdminProfile) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('admin-token', token)
        set({ token, user, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('admin-token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'admin-auth' }
  )
)
