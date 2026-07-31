import { AppError } from '../utils/AppError.js'

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      `The route ${req.method} ${req.originalUrl} does not exist.`,
      404,
      'ROUTE_NOT_FOUND',
    ),
  )
}

function normalizeError(error) {
  if (error instanceof AppError) return error

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new AppError('The JSON request body is invalid.', 400, 'INVALID_JSON')
  }

  if (error?.code === 'P2002') {
    return new AppError('A record with that unique data already exists.', 409, 'DUPLICATE_RESOURCE', {
      fields: error.meta?.target,
    })
  }

  if (error?.code === 'P2003') {
    return new AppError(
      'The operation conflicts with related records.',
      409,
      'RELATION_CONFLICT',
    )
  }

  if (error?.code === 'P2025') {
    return new AppError('The requested resource does not exist.', 404, 'RESOURCE_NOT_FOUND')
  }

  if (error?.name === 'PrismaClientValidationError') {
    return new AppError('The submitted data is invalid.', 400, 'VALIDATION_ERROR')
  }

  return error
}

export function errorHandler(error, _req, res, _next) {
  const normalized = normalizeError(error)
  const statusCode = normalized.statusCode || 500
  const isServerError = statusCode >= 500

  if (isServerError) {
    console.error(normalized)
  }

  const body = {
    error: {
      message: isServerError
        ? 'An internal error occurred. Please try again.'
        : normalized.message,
      code: isServerError ? 'INTERNAL_ERROR' : normalized.code || 'REQUEST_FAILED',
    },
  }

  if (!isServerError && normalized.details !== undefined) {
    body.error.details = normalized.details
  }

  res.status(statusCode).json(body)
}

export default errorHandler
