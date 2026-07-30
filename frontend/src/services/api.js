import { SESSION_STORAGE_KEY } from '../utils/constants'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function getStoredToken() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY))
    return session?.token || null
  } catch {
    return null
  }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function apiRequest(path, options = {}) {
  const { body, headers, token = getStoredToken(), ...requestOptions } = options
  const requestHeaders = new Headers(headers)

  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('No fue posible conectar con la API. Verifica que el backend esté activo.', {
      code: 'NETWORK_ERROR',
    })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('alp:unauthorized'))
    }

    throw new ApiError(
      payload?.error?.message || payload?.message || 'La solicitud no pudo completarse.',
      {
        status: response.status,
        code: payload?.error?.code || 'REQUEST_FAILED',
        details: payload?.error?.details || null,
      },
    )
  }

  return payload
}
