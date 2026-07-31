import { createContext } from 'react'
import { es } from 'date-fns/locale'
import { DEFAULT_LANGUAGE, translate } from '../i18n/translate'

export const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  dateLocale: es,
  setLanguage: () => {},
  t: (key, values) => translate(DEFAULT_LANGUAGE, key, values),
})
