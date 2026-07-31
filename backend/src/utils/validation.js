import { AppError } from './AppError.js'

export const USER_ROLES = Object.freeze({
  CREATOR: 'CREATOR',
  APPROVER: 'APPROVER',
  ADMIN: 'ADMIN',
})

export const VALID_USER_ROLES = Object.freeze(Object.values(USER_ROLES))

export const LAUNCH_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
})

export const VALID_LAUNCH_STATUSES = Object.freeze(Object.values(LAUNCH_STATUSES))

export const ASSET_TYPES = Object.freeze({
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  COPY: 'COPY',
  OTHER: 'OTHER',
})

export const VALID_ASSET_TYPES = Object.freeze(Object.values(ASSET_TYPES))

export const CONTENT_LIMITS = Object.freeze({
  launchName: 120,
  launchDescription: 2000,
  market: 80,
  assetName: 120,
  assetsPerLaunch: 10,
})

export function ensureObject(value, label = 'El cuerpo de la solicitud') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${label} debe ser un objeto JSON.`, 400, 'VALIDATION_ERROR')
  }

  return value
}

export function parsePositiveId(value, label = 'id') {
  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new AppError(`${label} debe ser un entero positivo.`, 400, 'INVALID_ID', {
      field: label,
    })
  }

  return parsed
}

export function requiredString(value, field, maxLength = 255) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${field} es obligatorio.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo ${field} no puede superar ${maxLength} caracteres.`,
      400,
      'VALIDATION_ERROR',
      { field, maxLength },
    )
  }

  return normalized
}

export function optionalString(value, field, maxLength = 1000, fallback = '') {
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'string') {
    throw new AppError(`El campo ${field} debe ser texto.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo ${field} no puede superar ${maxLength} caracteres.`,
      400,
      'VALIDATION_ERROR',
      { field, maxLength },
    )
  }

  return normalized
}

function parseDateOnly(value, endOfDay) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const [, yearString, monthString, dayString] = match
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)
  const hour = endOfDay ? 23 : 0
  const minute = endOfDay ? 59 : 0
  const second = endOfDay ? 59 : 0
  const millisecond = endOfDay ? 999 : 0
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return new Date(Number.NaN)
  }

  return date
}

export function parseDateValue(value, field, { endOfDay = false, dateOnlyAtNoon = false } = {}) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new AppError(`El campo ${field} debe contener una fecha válida.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  let date
  if (typeof value === 'string') {
    const normalized = value.trim()
    date = parseDateOnly(normalized, endOfDay)

    if (date && dateOnlyAtNoon && !endOfDay && !Number.isNaN(date.getTime())) {
      date.setUTCHours(12, 0, 0, 0)
    }

    if (!date) date = new Date(normalized)
  } else {
    date = new Date(value.getTime())
  }

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`El campo ${field} debe contener una fecha válida.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  return date
}

export function validateHttpUrl(value, field = 'url') {
  const normalized = requiredString(value, field, 2048)

  try {
    const url = new URL(normalized)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol')
  } catch {
    throw new AppError(
      `El campo ${field} debe ser una URL HTTP o HTTPS válida.`,
      400,
      'VALIDATION_ERROR',
      { field },
    )
  }

  return normalized
}
