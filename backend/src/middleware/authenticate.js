import jwt from 'jsonwebtoken'
import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parsePositiveId } from '../utils/validation.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'JWT_SECRET no está configurado en el entorno.',
      500,
      'CONFIGURATION_ERROR',
    )
  }

  return process.env.JWT_SECRET
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization')

  if (!authorization) {
    throw new AppError('Debes iniciar sesión para continuar.', 401, 'AUTH_REQUIRED')
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    throw new AppError(
      'La cabecera Authorization debe usar el formato Bearer <token>.',
      401,
      'INVALID_TOKEN',
    )
  }

  let payload
  try {
    payload = jwt.verify(token, getJwtSecret())
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new AppError('La sesión expiró. Inicia sesión nuevamente.', 401, 'TOKEN_EXPIRED')
    }

    throw new AppError('El token de acceso no es válido.', 401, 'INVALID_TOKEN')
  }

  if (!payload || typeof payload !== 'object' || !payload.sub) {
    throw new AppError('El token de acceso no es válido.', 401, 'INVALID_TOKEN')
  }

  let userId
  try {
    userId = parsePositiveId(payload.sub, 'sub')
  } catch {
    throw new AppError('El token de acceso no es válido.', 401, 'INVALID_TOKEN')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError('El usuario asociado a la sesión ya no existe.', 401, 'INVALID_TOKEN')
  }

  req.user = user
  next()
})

export default authenticate
