const API_BASE = import.meta.env.VITE_API_URL

export const AUTH_ROUTES = {
  LIFF_AUTH: `${API_BASE}/liff/auth`,
  REGISTER: `${API_BASE}/liff/auth/register`,
  ME: `${API_BASE}/liff/me`,
  ME_STATS: `${API_BASE}/liff/me/stats`,
} as const

export const LIFF_ROUTES = {
  OPTIONS: `${API_BASE}/liff/options`,
  SITES: `${API_BASE}/liff/sites`,
  SITE_BY_CODE: (code: string) => `${API_BASE}/liff/sites/${code}`,
  SITE_FOLLOW_UP: (code: string) => `${API_BASE}/liff/sites/${code}/follow-ups`,
  CHECK_DUPLICATE: `${API_BASE}/liff/sites/check-duplicate`,
  UPLOADS: `${API_BASE}/liff/uploads`,
  CHECK_IN: `${API_BASE}/liff/check-in`,
  CHECK_IN_STATUS: `${API_BASE}/liff/check-in/status`,
} as const
