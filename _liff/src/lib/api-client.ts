import axios from 'axios'

export const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear token on 401, don't redirect (let the UI handle it)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    // Extract Thai error message จาก backend response
    const backendMsg = error.response?.data?.error?.message
    if (backendMsg) {
      return Promise.reject(new Error(backendMsg))
    }
    return Promise.reject(error)
  }
)
