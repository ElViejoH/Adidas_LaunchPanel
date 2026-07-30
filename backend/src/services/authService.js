import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import { ensureObject, requiredString } from '../utils/validation.js'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
}

function getJwtConfiguration() {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'JWT_SECRET no está configurado en el entorno.',
      500,
      'CONFIGURATION_ERROR',
    )
  }

  return {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  }
}

export async function login(credentials) {
  const payload = ensureObject(credentials)
  const email = requiredString(payload.email, 'email', 320).toLowerCase()

  if (typeof payload.password !== 'string' || !payload.password) {
    throw new AppError('El campo password es obligatorio.', 400, 'VALIDATION_ERROR', {
      field: 'password',
    })
  }

  if (payload.password.length > 200) {
    throw new AppError(
      'El campo password no puede superar 200 caracteres.',
      400,
      'VALIDATION_ERROR',
      { field: 'password', maxLength: 200 },
    )
  }

  const userWithPassword = await prisma.user.findUnique({ where: { email } })
  const isPasswordValid = userWithPassword
    ? await bcrypt.compare(payload.password, userWithPassword.password)
    : false

  if (!userWithPassword || !isPasswordValid) {
    throw new AppError('Correo o contraseña incorrectos.', 401, 'INVALID_CREDENTIALS')
  }

  const { secret, expiresIn } = getJwtConfiguration()
  const token = jwt.sign(
    { role: userWithPassword.role },
    secret,
    { subject: String(userWithPassword.id), expiresIn },
  )

  const user = Object.fromEntries(
    Object.keys(publicUserSelect).map((field) => [field, userWithPassword[field]]),
  )

  return { token, user }
}
