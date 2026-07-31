import { describe, expect, test } from 'vitest'
import { translate } from './translate'
import { tApiError, translateApiError } from './apiErrors'

describe('localized API errors', () => {
  test('maps stable error codes instead of raw backend messages', () => {
    const error = {
      code: 'INVALID_CREDENTIALS',
      message: 'Las credenciales no son válidas.',
    }

    expect(translateApiError('en', error)).toBe('The email or password is incorrect.')
    expect(tApiError(error, (key, values) => translate('es', key, values))).toBe(
      'El correo o la contraseña no son correctos.',
    )
  })

  test('uses a localized generic message for unknown codes', () => {
    expect(translateApiError('en', { code: 'UNKNOWN_CODE' })).toBe(
      'The request could not be completed.',
    )
  })
})
