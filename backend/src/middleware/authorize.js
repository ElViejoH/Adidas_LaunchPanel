import { AppError } from '../utils/AppError.js'

export function authorize(...allowedRoles) {
  return function authorizeRole(req, _res, next) {
    if (!req.user) {
      return next(new AppError('Debes iniciar sesión para continuar.', 401, 'AUTH_REQUIRED'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Tu rol no tiene permiso para realizar esta acción.',
          403,
          'FORBIDDEN',
          { allowedRoles },
        ),
      )
    }

    return next()
  }
}

export default authorize
