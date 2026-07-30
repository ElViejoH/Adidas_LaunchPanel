import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import {
  ensureObject,
  LAUNCH_STATUSES,
  parsePositiveId,
  requiredString,
  USER_ROLES,
  validateHttpUrl,
} from '../utils/validation.js'

function assertAssetPermission(actor, launch) {
  if (actor?.role !== USER_ROLES.CREATOR) {
    throw new AppError(
      'Solo un usuario CREATOR puede gestionar assets.',
      403,
      'FORBIDDEN',
    )
  }

  if (launch.creatorId !== actor.id) {
    throw new AppError(
      'Solo el creador propietario puede gestionar los assets de este lanzamiento.',
      403,
      'NOT_LAUNCH_OWNER',
    )
  }

  if (launch.status !== LAUNCH_STATUSES.DRAFT) {
    throw new AppError(
      'Los assets solo pueden modificarse mientras el lanzamiento está en DRAFT.',
      409,
      'DRAFT_REQUIRED',
      { currentStatus: launch.status },
    )
  }
}

export async function addAsset(rawLaunchId, payload, actor) {
  const launchId = parsePositiveId(rawLaunchId, 'launchId')
  const body = ensureObject(payload)
  const launch = await prisma.launch.findUnique({ where: { id: launchId } })

  if (!launch) {
    throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertAssetPermission(actor, launch)

  return prisma.asset.create({
    data: {
      launchId,
      name: requiredString(body.name, 'name', 160),
      type: requiredString(body.type, 'type', 80),
      url: validateHttpUrl(body.url),
    },
  })
}

export async function deleteAsset(rawId, actor) {
  const id = parsePositiveId(rawId, 'id')
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { launch: true },
  })

  if (!asset) {
    throw new AppError('El asset solicitado no existe.', 404, 'ASSET_NOT_FOUND')
  }

  assertAssetPermission(actor, asset.launch)
  await prisma.asset.delete({ where: { id } })

  return { id }
}
