import { SESSION_STORAGE_KEY } from '../utils/constants'
import { translateApiError } from '../i18n/apiErrors'
import { getStoredLanguage } from '../i18n/translate'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', details = null, rawMessage = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.rawMessage = rawMessage
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
  const language = getStoredLanguage()

  requestHeaders.set('Accept', 'application/json')
  requestHeaders.set('Accept-Language', language)
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
    throw new ApiError(translateApiError(language, { code: 'NETWORK_ERROR' }), {
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

    const code = payload?.error?.code || 'REQUEST_FAILED'
    const details = payload?.error?.details || null
    const rawMessage = payload?.error?.message || payload?.message || null

    throw new ApiError(translateApiError(language, { code, details }), {
      status: response.status,
      code,
      details,
      rawMessage,
    })
  }

  return payload
}
