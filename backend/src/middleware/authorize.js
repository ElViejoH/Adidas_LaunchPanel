import { AppError } from '../utils/AppError.js'

export function authorize(...allowedRoles) {
  return function authorizeRole(req, _res, next) {
    if (!req.user) {
      return next(new AppError('You must sign in to continue.', 401, 'AUTH_REQUIRED'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Your role does not have permission to perform this action.',
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
