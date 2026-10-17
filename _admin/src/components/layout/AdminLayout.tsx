import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

const navItems = [
  { to: '/', label: 'งานทั้งหมด' },
  { to: '/reps', label: 'จัดการเซลล์' },
  { to: '/options', label: 'ตั้งค่าตัวเลือก' },
]

export function AdminLayout() {
  const { user, clearAuth } = useAuthStore()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">UP Steel Admin</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.displayName}</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={clearAuth}
            className="w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted text-left"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
