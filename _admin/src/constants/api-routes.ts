const API_BASE = import.meta.env.VITE_API_URL

export const AUTH_ROUTES = {
  LOGIN: `${API_BASE}/admin/auth`,
} as const

export const ADMIN_ROUTES = {
  SITES: `${API_BASE}/admin/sites`,
  SITE_BY_CODE: (code: string) => `${API_BASE}/admin/sites/${code}`,
  REPS: `${API_BASE}/admin/reps`,
  REP_BY_ID: (id: string) => `${API_BASE}/admin/reps/${id}`,
  GROUPS: `${API_BASE}/admin/groups`,
  GROUP_BY_ID: (id: string) => `${API_BASE}/admin/groups/${id}`,
  OPTIONS: `${API_BASE}/admin/options`,
  USERS: `${API_BASE}/admin/users`,
  USER_BY_ID: (id: string) => `${API_BASE}/admin/users/${id}`,
  EXPORT_SITES: `${API_BASE}/admin/export/sites`,
} as const
