import { apiRequest, buildQuery } from './api'

export const userService = {
  async getAll(filters = {}, options = {}) {
    const response = await apiRequest(`/users${buildQuery(filters)}`, options)
    return Array.isArray(response?.data) ? response.data : []
  },

  async updateRole(id, role) {
    const response = await apiRequest(`/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    })
    return response?.data ?? response
  },
}
