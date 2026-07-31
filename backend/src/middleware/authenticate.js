import jwt from 'jsonwebtoken'
import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parsePositiveId } from '../utils/validation.js'

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'JWT_SECRET is not configured in the environment.',
      500,
      'CONFIGURATION_ERROR',
    )
  }

  return process.env.JWT_SECRET
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization')

  if (!authorization) {
    throw new AppError('You must sign in to continue.', 401, 'AUTH_REQUIRED')
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    throw new AppError(
      'The Authorization header must use the Bearer <token> format.',
      401,
      'INVALID_TOKEN',
    )
  }

  let payload
  try {
    payload = jwt.verify(token, getJwtSecret())
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new AppError('Your session expired. Sign in again.', 401, 'TOKEN_EXPIRED')
    }

    throw new AppError('The access token is invalid.', 401, 'INVALID_TOKEN')
  }

  if (!payload || typeof payload !== 'object' || !payload.sub) {
    throw new AppError('The access token is invalid.', 401, 'INVALID_TOKEN')
  }

  let userId
  try {
    userId = parsePositiveId(payload.sub, 'sub')
  } catch {
    throw new AppError('The access token is invalid.', 401, 'INVALID_TOKEN')
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
    throw new AppError('The user associated with this session no longer exists.', 401, 'INVALID_TOKEN')
  }

  req.user = user
  next()
})

export default authenticate
