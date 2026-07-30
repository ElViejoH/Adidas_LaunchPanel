import prisma from '../prisma/client.js'
import { AppError } from '../utils/AppError.js'
import {
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

const nextStatusByCurrent = Object.freeze({
  [LAUNCH_STATUSES.DRAFT]: LAUNCH_STATUSES.IN_REVIEW,
  [LAUNCH_STATUSES.IN_REVIEW]: LAUNCH_STATUSES.APPROVED,
  [LAUNCH_STATUSES.APPROVED]: LAUNCH_STATUSES.PUBLISHED,
})

function parsePaginationValue(value, field, fallback) {
  if (value === undefined || value === null || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new AppError(`El parámetro ${field} debe ser un entero positivo.`, 400, 'VALIDATION_ERROR', {
      field,
    })
  }

  return parsed
}

function buildLaunchData(payload) {
  const body = ensureObject(payload)

  return {
    name: requiredString(body.name, 'name', 160),
    description: optionalString(body.description, 'description', 3000, ''),
    market: requiredString(body.market, 'market', 100),
    launchDate: parseDateValue(body.launchDate, 'launchDate', { dateOnlyAtNoon: true }),
  }
}

function assertCreator(actor) {
  if (actor?.role !== USER_ROLES.CREATOR) {
    throw new AppError(
      'Solo un usuario CREATOR puede realizar esta acción.',
      403,
      'FORBIDDEN',
    )
  }
}

function assertOwner(actor, launch) {
  assertCreator(actor)

  if (launch.creatorId !== actor.id) {
    throw new AppError(
      'Solo el creador propietario puede modificar este lanzamiento.',
      403,
      'NOT_LAUNCH_OWNER',
    )
  }
}

function assertDraft(launch) {
  if (launch.status !== LAUNCH_STATUSES.DRAFT) {
    throw new AppError(
      'Esta acción solo está disponible mientras el lanzamiento está en DRAFT.',
      409,
      'DRAFT_REQUIRED',
      { currentStatus: launch.status },
    )
  }
}

function assertTransitionPermission(actor, launch) {
  if (launch.status === LAUNCH_STATUSES.DRAFT) {
    assertOwner(actor, launch)
    return
  }

  if (
    [LAUNCH_STATUSES.IN_REVIEW, LAUNCH_STATUSES.APPROVED].includes(launch.status) &&
    actor?.role !== USER_ROLES.APPROVER
  ) {
    throw new AppError(
      'Solo un usuario APPROVER puede aprobar o publicar lanzamientos.',
      403,
      'FORBIDDEN',
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
    throw new AppError('El parámetro limit no puede superar 100.', 400, 'VALIDATION_ERROR', {
      field: 'limit',
      max: 100,
    })
  }

  if (status && !VALID_LAUNCH_STATUSES.includes(status)) {
    throw new AppError('El filtro status no es válido.', 400, 'VALIDATION_ERROR', {
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
      'startDate no puede ser posterior a endDate.',
      400,
      'INVALID_DATE_RANGE',
      { from: startDateInput, to: endDateInput },
    )
  }

  const allowedSortFields = ['launchDate', 'createdAt', 'updatedAt', 'name', 'market', 'status']
  if (!allowedSortFields.includes(sortBy)) {
    throw new AppError('El parámetro sortBy no es válido.', 400, 'VALIDATION_ERROR', {
      field: 'sortBy',
      allowedValues: allowedSortFields,
    })
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    throw new AppError('El parámetro sortOrder debe ser asc o desc.', 400, 'VALIDATION_ERROR', {
      field: 'sortOrder',
      allowedValues: ['asc', 'desc'],
    })
  }

  return { search, market, status, startDate, endDate, page, limit, sortBy, sortOrder }
}

export async function listLaunches(query = {}) {
  const { search, market, status, startDate, endDate, page, limit, sortBy, sortOrder } =
    parseListFilters(query)
  const where = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { market: { contains: search } },
    ]
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

export async function getLaunchById(rawId) {
  const id = parsePositiveId(rawId, 'id')
  const launch = await prisma.launch.findUnique({
    where: { id },
    include: launchDetailInclude,
  })

  if (!launch) {
    throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
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
    throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertOwner(actor, current)
  assertDraft(current)
  const data = buildLaunchData(payload)

  const result = await prisma.launch.updateMany({
    where: {
      id,
      creatorId: actor.id,
      status: LAUNCH_STATUSES.DRAFT,
    },
    data,
  })

  if (result.count !== 1) {
    throw new AppError(
      'El lanzamiento cambió mientras se intentaba editar. Recarga la información.',
      409,
      'CONCURRENT_MODIFICATION',
    )
  }

  return getLaunchById(id)
}

export async function deleteLaunch(rawId, actor) {
  const id = parsePositiveId(rawId, 'id')
  const current = await prisma.launch.findUnique({ where: { id } })

  if (!current) {
    throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
  }

  assertOwner(actor, current)
  assertDraft(current)

  const result = await prisma.launch.deleteMany({
    where: {
      id,
      creatorId: actor.id,
      status: LAUNCH_STATUSES.DRAFT,
    },
  })

  if (result.count !== 1) {
    throw new AppError(
      'El lanzamiento cambió mientras se intentaba eliminar. Recarga la información.',
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
    throw new AppError('El estado solicitado no es válido.', 400, 'VALIDATION_ERROR', {
      field: 'newStatus',
      allowedValues: VALID_LAUNCH_STATUSES,
    })
  }

  const comment = optionalString(body.comment, 'comment', 500, '') || null

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.launch.findUnique({ where: { id } })

    if (!current) {
      throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
    }

    const expectedStatus = nextStatusByCurrent[current.status]
    if (!expectedStatus || newStatus !== expectedStatus) {
      throw new AppError(
        'La transición de estado solicitada no está permitida.',
        409,
        'INVALID_STATUS_TRANSITION',
        {
          currentStatus: current.status,
          requestedStatus: newStatus,
          allowedStatus: expectedStatus ?? null,
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
        'El estado cambió mientras se procesaba la solicitud. Recarga la información.',
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

export async function getLaunchHistory(rawId) {
  const id = parsePositiveId(rawId, 'id')
  const exists = await prisma.launch.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!exists) {
    throw new AppError('El lanzamiento solicitado no existe.', 404, 'LAUNCH_NOT_FOUND')
  }

  return prisma.statusHistory.findMany({
    where: { launchId: id },
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: publicUserSelect } },
  })
}
