import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import {
  ensureObject,
  optionalString,
  parsePositiveId,
  requiredString,
  USER_ROLES,
  VALID_USER_ROLES,
} from '../utils/validation.js'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
}

function assertAdmin(actor) {
  if (actor?.role !== USER_ROLES.ADMIN) {
    throw new AppError(
      'Only an ADMIN user can manage permissions.',
      403,
      'FORBIDDEN',
    )
  }
}

export async function listUsers(query = {}, actor) {
  assertAdmin(actor)
  const search = optionalString(query.search, 'search', 120, '')
  const role = optionalString(query.role, 'role', 20, '')

  if (role && !VALID_USER_ROLES.includes(role)) {
    throw new AppError('The role filter is invalid.', 400, 'VALIDATION_ERROR', {
      field: 'role',
      allowedValues: VALID_USER_ROLES,
    })
  }

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
  }

  return prisma.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
}

export async function updateUserRole(rawId, payload, actor) {
  assertAdmin(actor)
  const id = parsePositiveId(rawId, 'id')
  const body = ensureObject(payload)
  const role = requiredString(body.role, 'role', 20)

  if (!VALID_USER_ROLES.includes(role)) {
    throw new AppError('The requested role is invalid.', 400, 'VALIDATION_ERROR', {
      field: 'role',
      allowedValues: VALID_USER_ROLES,
    })
  }

  const current = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  })

  if (!current) {
    throw new AppError('The requested user does not exist.', 404, 'USER_NOT_FOUND')
  }

  if (current.role === role) return current

  if (id === actor.id) {
    throw new AppError(
      'No puedes modificar el rol de tu propia cuenta.',
      409,
      'SELF_ROLE_CHANGE_NOT_ALLOWED',
    )
  }

  const result = await prisma.user.updateMany({
    where: { id, role: current.role },
    data: { role },
  })

  if (result.count !== 1) {
    throw new AppError(
      'The role changed while the request was being processed. Reload the data.',
      409,
      'CONCURRENT_MODIFICATION',
    )
  }

  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  })
}
