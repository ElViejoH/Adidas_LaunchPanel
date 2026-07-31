import { messages } from './messages'

export const SUPPORTED_LANGUAGES = Object.freeze(['es', 'en'])
export const DEFAULT_LANGUAGE = 'es'
export const LANGUAGE_STORAGE_KEY = 'adidas-launch-panel.language'

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE
}

export function getStoredLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function interpolate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key]
    return value === undefined || value === null ? match : String(value)
  })
}

function resolveMessage(language, key, values) {
  const dictionary = messages[language]
  const fallbackDictionary = language === DEFAULT_LANGUAGE ? messages[DEFAULT_LANGUAGE] : {}
  let resolvedKey = key

  if (Object.prototype.hasOwnProperty.call(values, 'count')) {
    const category = new Intl.PluralRules(language).select(Number(values.count))
    const pluralKey = `${key}.${category}`
    const otherKey = `${key}.other`

    if (dictionary[pluralKey] || fallbackDictionary[pluralKey]) resolvedKey = pluralKey
    else if (dictionary[otherKey] || fallbackDictionary[otherKey]) resolvedKey = otherKey
  }

  return dictionary[resolvedKey] ?? dictionary[key] ?? fallbackDictionary[resolvedKey] ?? fallbackDictionary[key] ?? key
}

export function translate(language, key, values = {}) {
  const normalizedLanguage = normalizeLanguage(language)
  return interpolate(resolveMessage(normalizedLanguage, key, values), values)
}
