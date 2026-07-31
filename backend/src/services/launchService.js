import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import {
  CONTENT_LIMITS,
  ensureObject,
  LAUNCH_STATUSES,
  optionalString,
  parseDateValue,
  parsePositiveId,
  requiredString,
  USER_ROLES,
  VALID_LAUNCH_STATUSES,
} from '../utils/validation.js'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
}

const launchListInclude = {
  creator: { select: publicUserSelect },
  _count: { select: { assets: true } },
}

const launchDetailInclude = {
  creator: { select: publicUserSelect },
  assets: { orderBy: { createdAt: 'desc' } },
  statusHistory: {
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: publicUserSelect } },
  },
}

const allowedStatusesByCurrent = Object.freeze({
  [LAUNCH_STATUSES.DRAFT]: [LAUNCH_STATUSES.IN_REVIEW],
  [LAUNCH_STATUSES.IN_REVIEW]: [
    LAUNCH_STATUSES.APPROVED,
    LAUNCH_STATUSES.CHANGES_REQUESTED,
    LAUNCH_STATUSES.REJECTED,
  ],
  [LAUNCH_STATUSES.CHANGES_REQUESTED]: [LAUNCH_STATUSES.DRAFT],
  [LAUNCH_STATUSES.APPROVED]: [LAUNCH_STATUSES.PUBLISHED],
})

const statusesRequiringComment = new Set([
  LAUNCH_STATUSES.CHANGES_REQUESTED,
  LAUNCH_STATUSES.REJECTED,
])

const editableStatuses = Object.freeze([
  LAUNCH_STATUSES.DRAFT,
  LAUNCH_STATUSES.IN_REVIEW,
])

function parsePaginationValue(value, field, fallback) {
  if (value === undefined || value === null || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new AppError(`The ${field} parameter must be a positive integer.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  return parsed
}

function buildLaunchData(payload) {
  const body = ensureObject(payload)

  return {
    name: requiredString(body.name, 'name', CONTENT_LIMITS.launchName),
    description: optionalString(
      body.description,
      'description',
      CONTENT_LIMITS.launchDescription,
      '',
    ),
    market: requiredString(body.market, 'market', CONTENT_LIMITS.market),
    launchDate: parseDateValue(body.launchDate, 'launchDate', { dateOnlyAtNoon: true }),
  }
}

function assertCreator(actor) {
  if (actor?.role !== USER_ROLES.CREATOR) {
    throw new AppError(
      'Only a CREATOR user can perform this action.',
      403,
      'FORBIDDEN',
    )
  }
}

function assertOwner(actor, launch) {
  assertCreator(actor)

  if (launch.creatorId !== actor.id) {
    throw new AppError(
      'Only the launch owner can modify this launch.',
      403,
      'NOT_LAUNCH_OWNER',
    )
  }
}

function assertEditableStatus(launch) {
  if (!editableStatuses.includes(launch.status)) {
    throw new AppError(
      'This action is only available while the launch is in DRAFT or IN_REVIEW.',
      409,
      'EDITABLE_STATUS_REQUIRED',
      { currentStatus: launch.status, allowedStatuses: editableStatuses },
    )
  }
}

function draftVisibilityWhere(actor) {
  return {
    OR: [
      { status: { not: LAUNCH_STATUSES.DRAFT } },
      {
        status: LAUNCH_STATUSES.DRAFT,
        creatorId: actor?.id ?? -1,
      },
    ],
  }
}

function assertTransitionPermission(actor, launch) {
  if (
    [LAUNCH_STATUSES.DRAFT, LAUNCH_STATUSES.CHANGES_REQUESTED].includes(launch.status)
  ) {
    assertOwner(actor, launch)
    return
  }

  if (
    [LAUNCH_STATUSES.IN_REVIEW, LAUNCH_STATUSES.APPROVED].includes(launch.status) &&
    actor?.role !== USER_ROLES.APPROVER
  ) {
    throw new AppError(
      'Only an APPROVER user can decide on launches in review or publish them.',
      403,
      'FORBIDDEN',
    )
  }

  if (
    [LAUNCH_STATUSES.IN_REVIEW, LAUNCH_STATUSES.APPROVED].includes(launch.status) &&
    actor?.id === launch.creatorId
  ) {
    throw new AppError(
      'You cannot approve or publish a launch that you created.',
      403,
      'SELF_APPROVAL_FORBIDDEN',
    )
  }
}

function parseListFilters(query = {}) {
  const search = optionalString(query.search, 'search', 120, '')
  const market = optionalString(query.market, 'market', 100, '')
  const status = optionalString(query.status, 'status', 30, '')
  const sortBy = optionalString(query.sortBy, 'sortBy', 30, '') || 'launchDate'
  const sortOrder = optionalString(query.sortOrder, 'sortOrder', 10, '') || 'asc'
  const page = parsePaginationValue(query.page, 'page', 1)
  const limit = parsePaginationValue(query.limit, 'limit', 100)

  if (limit > 100) {
    throw new AppError('The limit parameter cannot exceed 100.', 400, 'VALIDATION_ERROR', {
      field: 'limit',
      max: 100,
    })
  }

  if (status && !VALID_LAUNCH_STATUSES.includes(status)) {
    throw new AppError('The status filter is invalid.', 400, 'VALIDATION_ERROR', {
      field: 'status',
      allowedValues: VALID_LAUNCH_STATUSES,
    })
  }

  const startDateInput = query.from ?? query.startDate
  const endDateInput = query.to ?? query.endDate
  const startDate = startDateInput
    ? parseDateValue(startDateInput, query.from !== undefined ? 'from' : 'startDate')
    : undefined
  const endDate = endDateInput
    ? parseDateValue(endDateInput, query.to !== undefined ? 'to' : 'endDate', { endOfDay: true })
    : undefined

  if (startDate && endDate && startDate > endDate) {
    throw new AppError(
      'startDate cannot be later than endDate.',
      400,
      'INVALID_DATE_RANGE',
      { from: startDateInput, to: endDateInput },
    )
  }

  const allowedSortFields = ['launchDate', 'createdAt', 'updatedAt', 'name', 'market', 'status']
  if (!allowedSortFields.includes(sortBy)) {
    throw new AppError('The sortBy parameter is invalid.', 400, 'VALIDATION_ERROR', {
      field: 'sortBy',
      allowedValues: allowedSortFields,
    })
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    throw new AppError('The sortOrder parameter must be asc or desc.', 400, 'VALIDATION_ERROR', {
      field: 'sortOrder',
      allowedValues: ['asc', 'desc'],
    })
  }

  return { search, market, status, startDate, endDate, page, limit, sortBy, sortOrder }
}

export async function listLaunches(query = {}, actor) {
  const { search, market, status, startDate, endDate, page, limit, sortBy, sortOrder } =
    parseListFilters(query)
  const where = {
    AND: [draftVisibilityWhere(actor)],
  }

  if (search) {
    where.AND.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { market: { contains: search } },
      ],
    })
  }
  if (market) where.market = market
  if (status) where.status = status
  if (startDate || endDate) {
    where.launchDate = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    }
  }

  const [launches, total] = await Promise.all([
    prisma.launch.findMany({
      where,
      include: launchListInclude,
      orderBy: [
        { [sortBy]: sortOrder },
        ...(sortBy === 'createdAt' ? [] : [{ createdAt: 'desc' }]),
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.launch.count({ where }),
  ])

  return {
    launches,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getLaunchById(rawId, actor) {
  const id = parsePositiveId(rawId, 'id')
  const launch = await prisma.launch.findFirst({
    where: {
      id,
      ...draftVisibilityWhere(actor),
    },
    include: launchDetailInclude,
  })

  if (!launch) {
    throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
  }

  return launch
}

export async function createLaunch(payload, actor) {
  assertCreator(actor)
  const data = buildLaunchData(payload)

  return prisma.launch.create({
    data: {
      ...data,
      status: LAUNCH_STATUSES.DRAFT,
      creatorId: actor.id,
    },
    include: launchDetailInclude,
  })
}

export async function updateLaunch(rawId, payload, actor) {
  const id = parsePositiveId(rawId, 'id')
  const current = await prisma.launch.findUnique({ where: { id } })

  if (!current) {
    throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertOwner(actor, current)
  assertEditableStatus(current)
  const data = buildLaunchData(payload)

  const result = await prisma.launch.updateMany({
    where: {
      id,
      creatorId: actor.id,
      status: { in: editableStatuses },
    },
    data,
  })

  if (result.count !== 1) {
    throw new AppError(
      'The launch changed while it was being edited. Reload the data.',
      409,
      'CONCURRENT_MODIFICATION',
    )
  }

  return getLaunchById(id, actor)
}

export async function deleteLaunch(rawId, actor) {
  const id = parsePositiveId(rawId, 'id')
  const current = await prisma.launch.findUnique({ where: { id } })

  if (!current) {
    throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertOwner(actor, current)
  assertEditableStatus(current)

  const result = await prisma.launch.deleteMany({
    where: {
      id,
      creatorId: actor.id,
      status: { in: editableStatuses },
    },
  })

  if (result.count !== 1) {
    throw new AppError(
      'The launch changed while it was being deleted. Reload the data.',
      409,
      'CONCURRENT_MODIFICATION',
    )
  }

  return { id }
}

export async function changeLaunchStatus(rawId, payload, actor) {
  const id = parsePositiveId(rawId, 'id')
  const body = ensureObject(payload)
  const newStatus = requiredString(body.newStatus ?? body.status, 'newStatus', 30)

  if (!VALID_LAUNCH_STATUSES.includes(newStatus)) {
    throw new AppError('The requested status is invalid.', 400, 'VALIDATION_ERROR', {
      field: 'newStatus',
      allowedValues: VALID_LAUNCH_STATUSES,
    })
  }

  const comment = optionalString(body.comment, 'comment', 500, '') || null

  if (statusesRequiringComment.has(newStatus) && !comment) {
    throw new AppError(
      'A comment is required when requesting changes or rejecting a launch.',
      400,
      'COMMENT_REQUIRED',
      { field: 'comment', requestedStatus: newStatus },
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.launch.findUnique({ where: { id } })

    if (!current) {
      throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
    }

    const allowedStatuses = allowedStatusesByCurrent[current.status] ?? []
    if (!allowedStatuses.includes(newStatus)) {
      throw new AppError(
        'The requested status transition is not allowed.',
        409,
        'INVALID_STATUS_TRANSITION',
        {
          currentStatus: current.status,
          requestedStatus: newStatus,
          allowedStatuses,
        },
      )
    }

    assertTransitionPermission(actor, current)

    const updateResult = await tx.launch.updateMany({
      where: { id, status: current.status },
      data: { status: newStatus },
    })

    if (updateResult.count !== 1) {
      throw new AppError(
        'The status changed while the request was being processed. Reload the data.',
        409,
        'CONCURRENT_MODIFICATION',
      )
    }

    await tx.statusHistory.create({
      data: {
        launchId: id,
        previousStatus: current.status,
        newStatus,
        changedById: actor.id,
        comment,
      },
    })

    return tx.launch.findUnique({
      where: { id },
      include: launchDetailInclude,
    })
  })

  return updated
}

export async function getLaunchHistory(rawId, actor) {
  const id = parsePositiveId(rawId, 'id')
  const exists = await prisma.launch.findFirst({
    where: {
      id,
      ...draftVisibilityWhere(actor),
    },
    select: { id: true },
  })

  if (!exists) {
    throw new AppError('The requested launch does not exist.', 404, 'LAUNCH_NOT_FOUND')
  }

  return prisma.statusHistory.findMany({
    where: { launchId: id },
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: publicUserSelect } },
  })
}
