import { AppError } from '../utils/AppError.js'

export function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      `No existe la ruta ${req.method} ${req.originalUrl}.`,
      404,
      'ROUTE_NOT_FOUND',
    ),
  )
}

function normalizeError(error) {
  if (error instanceof AppError) return error

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new AppError('El cuerpo JSON de la solicitud no es válido.', 400, 'INVALID_JSON')
  }

  if (error?.code === 'P2002') {
    return new AppError('Ya existe un registro con esos datos únicos.', 409, 'DUPLICATE_RESOURCE', {
      fields: error.meta?.target,
    })
  }

  if (error?.code === 'P2003') {
    return new AppError(
      'La operación entra en conflicto con registros relacionados.',
      409,
      'RELATION_CONFLICT',
    )
  }

  if (error?.code === 'P2025') {
    return new AppError('El recurso solicitado no existe.', 404, 'RESOURCE_NOT_FOUND')
  }

  if (error?.name === 'PrismaClientValidationError') {
    return new AppError('Los datos enviados no son válidos.', 400, 'VALIDATION_ERROR')
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
        ? 'Ocurrió un error interno. Inténtalo nuevamente.'
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
