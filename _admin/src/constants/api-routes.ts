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
  // Analytics
  ANALYTICS_SUMMARY: `${API_BASE}/admin/analytics/summary`,
  ANALYTICS_BY_REP: `${API_BASE}/admin/analytics/by-rep`,
  ANALYTICS_TREND: `${API_BASE}/admin/analytics/trend`,
  ANALYTICS_BY_AREA: `${API_BASE}/admin/analytics/by-area`,
  ANALYTICS_LOST_REASONS: `${API_BASE}/admin/analytics/lost-reasons`,
  ANALYTICS_ACTIVITY: `${API_BASE}/admin/analytics/activity`,
  ANALYTICS_RECENT: `${API_BASE}/admin/analytics/recent-activity`,
  // Check-ins
  CHECK_INS: `${API_BASE}/admin/check-ins`,
  CHECK_INS_SUMMARY: `${API_BASE}/admin/check-ins/summary`,
  CHECK_INS_REP: (repId: string) => `${API_BASE}/admin/check-ins/summary/${repId}`,
} as const
