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
}
