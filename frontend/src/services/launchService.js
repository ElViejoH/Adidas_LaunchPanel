import { apiRequest, buildQuery } from './api'

export const launchService = {
  async getAll(filters = {}, options = {}) {
    const response = await apiRequest(`/launches${buildQuery(filters)}`, options)
    return {
      launches: Array.isArray(response?.data) ? response.data : [],
      meta: response?.meta ?? null,
    }
  },

  async getById(id, options = {}) {
    const response = await apiRequest(`/launches/${id}`, options)
    return response?.data ?? response
  },

  async create(payload) {
    const response = await apiRequest('/launches', { method: 'POST', body: payload })
    return response?.data ?? response
  },

  async update(id, payload) {
    const response = await apiRequest(`/launches/${id}`, { method: 'PUT', body: payload })
    return response?.data ?? response
  },

  async remove(id) {
    return apiRequest(`/launches/${id}`, { method: 'DELETE' })
  },

  async changeStatus(id, payload) {
    const response = await apiRequest(`/launches/${id}/status`, {
      method: 'PATCH',
      body: payload,
    })
    return response?.data ?? response
  },

  async getHistory(id, options = {}) {
    const response = await apiRequest(`/launches/${id}/history`, options)
    return Array.isArray(response?.data) ? response.data : []
  },

  async addAsset(id, payload) {
    const response = await apiRequest(`/launches/${id}/assets`, {
      method: 'POST',
      body: payload,
    })
    return response?.data ?? response
  },

  async deleteAsset(id) {
    return apiRequest(`/assets/${id}`, { method: 'DELETE' })
  },
}
