import { useCallback, useEffect, useMemo, useState } from 'react'
import { enUS, es } from 'date-fns/locale'
import {
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  translate,
} from '../i18n/translate'
import { I18nContext } from './I18nContext'

const DATE_LOCALES = { es, en: enUS }

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage)

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage))
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      translate(language, 'meta.description'),
    )

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // The interface still works when storage is unavailable.
    }
  }, [language])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguageState(normalizeLanguage(event.newValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const t = useCallback(
    (key, values) => translate(language, key, values),
    [language],
  )

  const value = useMemo(
    () => ({ language, dateLocale: DATE_LOCALES[language], setLanguage, t }),
    [language, setLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
