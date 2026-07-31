import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { messages } from './messages'
import { translate } from './translate'

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name)
      ? [path]
      : []
  })
}

describe('translations', () => {
  test('keeps the Spanish and English catalogs in exact parity', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.es).sort())
  })

  test('keeps interpolation variables aligned across both catalogs', () => {
    const variables = (value) => [...value.matchAll(/\{\{(\w+)\}\}/g)]
      .map((match) => match[1])
      .sort()

    Object.keys(messages.es).forEach((key) => {
      expect(variables(messages.en[key])).toEqual(variables(messages.es[key]))
    })
  })

  test('translates, interpolates and pluralizes in both languages', () => {
    expect(translate('es', 'dashboard.greeting', { name: 'Maya' })).toBe('Hola, Maya')
    expect(translate('en', 'dashboard.greeting', { name: 'Maya' })).toBe('Hello, Maya')
    expect(translate('en', 'calendar.launchCount', { count: 0 })).toBe('0 launches')
    expect(translate('es', 'calendar.launchCount', { count: 1 })).toBe('1 lanzamiento')
  })

  test('does not leak Spanish when an English key is missing', () => {
    expect(translate('en', 'missing.key')).toBe('missing.key')
  })

  test('contains every statically referenced translation key', () => {
    const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
    const referencedKeys = new Set()
    const keyPattern = /\bt\(\s*['"]([^'"]+)['"]/g

    listSourceFiles(sourceRoot).forEach((path) => {
      const source = readFileSync(path, 'utf8')
      for (const match of source.matchAll(keyPattern)) referencedKeys.add(match[1])
    })

    const missingKeys = [...referencedKeys].filter(
      (key) => !(key in messages.es) && !(`${key}.other` in messages.es),
    )
    expect(missingKeys).toEqual([])
  })

  test('does not use em dash characters in visible copy', () => {
    Object.values(messages).forEach((dictionary) => {
      expect(Object.values(dictionary).join('\n')).not.toMatch(/[—–]/)
    })
  })
})
