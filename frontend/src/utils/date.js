import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

export function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : parseISO(value)
  return isValid(date) ? date : null
}

export function formatLaunchDate(value, fallback = 'Fecha pendiente') {
  const date = toDate(value)
  return date ? format(date, 'd MMM yyyy', { locale: es }) : fallback
}

export function formatLongDate(value, fallback = 'Sin fecha') {
  const date = toDate(value)
  return date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : fallback
}

export function formatDateTime(value, fallback = 'Sin registro') {
  const date = toDate(value)
  return date ? format(date, "d MMM yyyy, HH:mm", { locale: es }) : fallback
}

export function formatRelativeDate(value) {
  const date = toDate(value)
  if (!date) return 'Sin registro'
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

export function toInputDate(value) {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM-dd') : ''
}

export function startOfToday() {
  return startOfDay(new Date())
}
