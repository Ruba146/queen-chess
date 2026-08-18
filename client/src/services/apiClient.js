import axios from 'axios'

/**
 * Configured Axios instance for the Queen Chess API.
 * Base URL is driven by Vite env vars.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach auth token when present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('qc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Centralized error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('qc_token')
      localStorage.removeItem('qc_user')
      window.location.href = '/login'
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed'
    const normalized = new Error(message)
    normalized.status = error.response?.status
    normalized.details = error.response?.data
    return Promise.reject(normalized)
  },
)

export default apiClient
