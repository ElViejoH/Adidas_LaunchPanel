import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import {
  CONTENT_LIMITS,
  ensureObject,
  LAUNCH_STATUSES,
  parsePositiveId,
  requiredString,
  USER_ROLES,
  VALID_ASSET_TYPES,
  validateHttpUrl,
} from '../utils/validation.js'

function assertAssetPermission(actor, launch) {
  if (actor?.role !== USER_ROLES.CREATOR) {
    throw new AppError(
      'Only a CREATOR user can manage assets.',
      403,
      'FORBIDDEN',
    )
  }

  if (launch.creatorId !== actor.id) {
    throw new AppError(
      'Only the launch owner can manage its assets.',
      403,
      'NOT_LAUNCH_OWNER',
    )
  }

  const editableStatuses = [
    LAUNCH_STATUSES.DRAFT,
    LAUNCH_STATUSES.IN_REVIEW,
  ]

  if (!editableStatuses.includes(launch.status)) {
    throw new AppError(
      'Assets can only be changed while the launch is in DRAFT or IN_REVIEW.',
      409,
      'EDITABLE_STATUS_REQUIRED',
      { currentStatus: launch.status, allowedStatuses: editableStatuses },
    )
  }
}

export async function addAsset(rawLaunchId, payload, actor) {
  const launchId = parsePositiveId(rawLaunchId, 'launchId')
  const body = ensureObject(payload)
  const name = requiredString(body.name, 'name', CONTENT_LIMITS.assetName)
  const type = requiredString(body.type, 'type', 20)
  const url = validateHttpUrl(body.url)

  if (!VALID_ASSET_TYPES.includes(type)) {
    throw new AppError('The asset type is invalid.', 400, 'INVALID_ASSET_TYPE', {
      field: 'type',
      allowedValues: VALID_ASSET_TYPES,
    })
  }

  const launch = await prisma.launch.findUnique({
    where: { id: launchId },
    include: { _count: { select: { assets: true } } },
  })

  if (!launch) {
    throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertAssetPermission(actor, launch)

  if (launch._count.assets >= CONTENT_LIMITS.assetsPerLaunch) {
    throw new AppError(
      `Each launch supports up to ${CONTENT_LIMITS.assetsPerLaunch} assets.`,
      409,
      'ASSET_LIMIT_REACHED',
      { maxAssets: CONTENT_LIMITS.assetsPerLaunch },
    )
  }

  return prisma.asset.create({
    data: {
      launchId,
      name,
      type,
      url,
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
