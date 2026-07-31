import { apiRequest } from './api'

export const authService = {
  async login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials,
      token: null,
    })
    return response?.data ?? response
  },

  async getCurrentUser(token) {
    const response = await apiRequest('/auth/me', { token })
    return response?.data ?? response
  },
}
