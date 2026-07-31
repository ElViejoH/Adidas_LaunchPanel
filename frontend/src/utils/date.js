import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { DEFAULT_LANGUAGE, normalizeLanguage, translate } from '../i18n/translate'

const DATE_LOCALES = { es, en: enUS }

export function getDateLocale(language = DEFAULT_LANGUAGE) {
  return DATE_LOCALES[normalizeLanguage(language)]
}

export function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : parseISO(value)
  return isValid(date) ? date : null
}

export function formatLaunchDate(value, language = DEFAULT_LANGUAGE, fallback) {
  const date = toDate(value)
  const normalizedLanguage = normalizeLanguage(language)
  const pattern = normalizedLanguage === 'en' ? 'MMM d, yyyy' : 'd MMM yyyy'
  return date
    ? format(date, pattern, { locale: getDateLocale(normalizedLanguage) })
    : fallback ?? translate(normalizedLanguage, 'dates.pending')
}

export function formatLongDate(value, language = DEFAULT_LANGUAGE, fallback) {
  const date = toDate(value)
  const normalizedLanguage = normalizeLanguage(language)
  const pattern = normalizedLanguage === 'en'
    ? 'EEEE, MMMM d, yyyy'
    : "EEEE, d 'de' MMMM 'de' yyyy"
  return date
    ? format(date, pattern, { locale: getDateLocale(normalizedLanguage) })
    : fallback ?? translate(normalizedLanguage, 'dates.none')
}

export function formatDateTime(value, language = DEFAULT_LANGUAGE, fallback) {
  const date = toDate(value)
  const normalizedLanguage = normalizeLanguage(language)
  const pattern = normalizedLanguage === 'en' ? 'MMM d, yyyy, h:mm a' : 'd MMM yyyy, HH:mm'
  return date
    ? format(date, pattern, { locale: getDateLocale(normalizedLanguage) })
    : fallback ?? translate(normalizedLanguage, 'dates.noRecord')
}

export function formatRelativeDate(value, language = DEFAULT_LANGUAGE) {
  const date = toDate(value)
  const normalizedLanguage = normalizeLanguage(language)
  if (!date) return translate(normalizedLanguage, 'dates.noRecord')
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: getDateLocale(normalizedLanguage),
  })
}

export function toInputDate(value) {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM-dd') : ''
}

export function startOfToday() {
  return startOfDay(new Date())
}
