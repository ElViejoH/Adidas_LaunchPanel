import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { I18nProvider } from '../context/I18nProvider'
import { LANGUAGE_STORAGE_KEY } from '../i18n/translate'
import { LanguageSwitcher } from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'es'
  })

  test('switches language, persists it and updates the document', async () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>,
    )

    const group = screen.getByRole('group', { name: 'Seleccionar idioma' })
    expect(group).toHaveClass('opacity-70', 'hover:opacity-100', 'focus-within:opacity-100')
    expect(screen.getByRole('button', { name: 'Cambiar a español' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a inglés' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'en')
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
    })
    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to English' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('uses a persisted English preference on first render', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')

    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>,
    )

    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
    await waitFor(() => expect(document.documentElement).toHaveAttribute('lang', 'en'))
  })
})
