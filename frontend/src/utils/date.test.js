import { describe, expect, test } from 'vitest'
import { formatDateTime, formatLaunchDate, formatLongDate } from './date'

describe('localized dates', () => {
  const value = '2026-07-30T12:00:00.000Z'

  test('formats dates in Spanish and English', () => {
    expect(formatLaunchDate(value, 'es')).toContain('jul')
    expect(formatLaunchDate(value, 'en')).toContain('Jul')
    expect(formatLongDate(value, 'es')).toContain('julio')
    expect(formatLongDate(value, 'en')).toContain('July')
    expect(formatDateTime(value, 'en')).toMatch(/AM|PM/)
  })

  test('localizes missing-date fallbacks', () => {
    expect(formatLaunchDate(null, 'es')).toBe('Fecha pendiente')
    expect(formatLaunchDate(null, 'en')).toBe('Date pending')
    expect(formatLongDate(null, 'en')).toBe('No date')
  })
})
