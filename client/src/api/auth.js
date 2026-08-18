import apiClient from '../services/apiClient'

/**
 * Auth API module.
 * Thin wrappers around the shared axios client.
 */
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (payload) => apiClient.post('/auth/register', payload),
  getCurrentUser: () => apiClient.get('/auth/profile'),
}

export default authApi
