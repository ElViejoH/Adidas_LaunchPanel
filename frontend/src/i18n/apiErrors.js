import { translate } from './translate'

const KNOWN_API_ERROR_CODES = new Set([
  'NETWORK_ERROR',
  'REQUEST_FAILED',
  'INTERNAL_ERROR',
  'INVALID_SESSION',
  'AUTH_REQUIRED',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_LAUNCH_OWNER',
  'SELF_APPROVAL_FORBIDDEN',
  'SELF_ROLE_CHANGE_NOT_ALLOWED',
  'VALIDATION_ERROR',
  'INVALID_ID',
  'INVALID_JSON',
  'INVALID_DATE_RANGE',
  'INVALID_ASSET_TYPE',
  'COMMENT_REQUIRED',
  'LAUNCH_NOT_FOUND',
  'EDITABLE_STATUS_REQUIRED',
  'INVALID_STATUS_TRANSITION',
  'CONCURRENT_MODIFICATION',
  'ASSET_NOT_FOUND',
  'ASSET_LIMIT_REACHED',
  'USER_NOT_FOUND',
  'DUPLICATE_RESOURCE',
  'RELATION_CONFLICT',
  'RESOURCE_NOT_FOUND',
  'ROUTE_NOT_FOUND',
])

function getErrorCode(error) {
  return KNOWN_API_ERROR_CODES.has(error?.code) ? error.code : 'REQUEST_FAILED'
}

export function tApiError(error, t) {
  return t(`apiErrors.${getErrorCode(error)}`, error?.details || {})
}

export function translateApiError(language, error) {
  return translate(language, `apiErrors.${getErrorCode(error)}`, error?.details || {})
}
