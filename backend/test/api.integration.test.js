import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import bcrypt from 'bcryptjs'
import request from 'supertest'

// Esta URL es relativa a prisma/schema.prisma. Mantiene la suite completamente
// aislada de prisma/dev.db y de cualquier información creada por el usuario.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:../test/.tmp/integration.db'
process.env.JWT_SECRET = 'integration-test-secret-with-more-than-32-characters'
process.env.JWT_EXPIRES_IN = '15m'

const [{ default: app }, prismaModule, prismaClientModule] = await Promise.all([
  import('../src/server.js'),
  import('@prisma/client'),
  import('../src/prisma/client.js'),
])

const prisma = prismaClientModule.default
const { LaunchStatus, Role } = prismaModule

const PASSWORD = 'password123'
const emails = Object.freeze({
  creator: 'integration.creator@adidas.test',
  otherCreator: 'integration.other@adidas.test',
  approver: 'integration.approver@adidas.test',
})

let passwordHash
let fixture

async function ensureTestSchema() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  const userTable = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'",
  )

  if (userTable.length > 0) return

  const migrationUrl = new URL(
    '../prisma/migrations/20260729000400_init/migration.sql',
    import.meta.url,
  )
  const migration = await readFile(migrationUrl, 'utf8')
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }
}

async function resetFixture() {
  await prisma.$transaction([
    prisma.statusHistory.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.launch.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const creator = await prisma.user.create({
    data: {
      name: 'Integration Creator',
      email: emails.creator,
      password: passwordHash,
      role: Role.CREATOR,
    },
  })
  const otherCreator = await prisma.user.create({
    data: {
      name: 'Other Creator',
      email: emails.otherCreator,
      password: passwordHash,
      role: Role.CREATOR,
    },
  })
  const approver = await prisma.user.create({
    data: {
      name: 'Integration Approver',
      email: emails.approver,
      password: passwordHash,
      role: Role.APPROVER,
    },
  })

  const draft = await prisma.launch.create({
    data: {
      name: 'Alpha Running Colombia',
      description: 'Borrador para validar búsqueda y permisos.',
      market: 'Colombia',
      launchDate: new Date('2030-01-10T12:00:00.000Z'),
      status: LaunchStatus.DRAFT,
      creatorId: creator.id,
      assets: {
        create: {
          name: 'Alpha brief',
          type: 'DOCUMENT',
          url: 'https://assets.example.test/alpha-brief.pdf',
        },
      },
    },
    include: { assets: true },
  })

  const inReview = await prisma.launch.create({
    data: {
      name: 'Beta Football Mexico',
      description: 'Lanzamiento enviado a revisión.',
      market: 'México',
      launchDate: new Date('2030-02-15T12:00:00.000Z'),
      status: LaunchStatus.IN_REVIEW,
      creatorId: creator.id,
      statusHistory: {
        create: {
          previousStatus: LaunchStatus.DRAFT,
          newStatus: LaunchStatus.IN_REVIEW,
          changedById: creator.id,
          comment: 'Listo para revisión.',
        },
      },
    },
  })

  const approved = await prisma.launch.create({
    data: {
      name: 'Gamma Originals Colombia',
      description: 'Campaña aprobada y pendiente de publicación.',
      market: 'Colombia',
      launchDate: new Date('2030-03-20T12:00:00.000Z'),
      status: LaunchStatus.APPROVED,
      creatorId: creator.id,
      statusHistory: {
        create: [
          {
            previousStatus: LaunchStatus.DRAFT,
            newStatus: LaunchStatus.IN_REVIEW,
            changedById: creator.id,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.APPROVED,
            changedById: approver.id,
          },
        ],
      },
    },
  })

  return { creator, otherCreator, approver, draft, inReview, approved }
}

async function loginAs(email) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: PASSWORD })

  assert.equal(response.status, 200, JSON.stringify(response.body))
  assert.equal(typeof response.body.data?.token, 'string')
  return response.body.data.token
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` }
}

before(async () => {
  await ensureTestSchema()
  passwordHash = await bcrypt.hash(PASSWORD, 4)
})

beforeEach(async () => {
  fixture = await resetFixture()
})

after(async () => {
  await prisma.$disconnect()
})

test('POST /api/auth/login autentica las credenciales semilla y no expone el hash', async () => {
  const success = await request(app)
    .post('/api/auth/login')
    .send({ email: emails.creator.toUpperCase(), password: PASSWORD })

  assert.equal(success.status, 200)
  assert.equal(success.body.data.user.email, emails.creator)
  assert.equal(success.body.data.user.role, Role.CREATOR)
  assert.equal(typeof success.body.data.token, 'string')
  assert.equal('password' in success.body.data.user, false)

  const failure = await request(app)
    .post('/api/auth/login')
    .send({ email: emails.creator, password: 'incorrecta' })

  assert.equal(failure.status, 401)
  assert.equal(failure.body.error.code, 'INVALID_CREDENTIALS')
})

test('GET /api/health comprueba la disponibilidad de la API y la base', async () => {
  const response = await request(app).get('/api/health')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok', database: 'reachable' })
})

test('las rutas de lanzamientos requieren un Bearer token válido', async () => {
  const missing = await request(app).get('/api/launches')
  assert.equal(missing.status, 401)
  assert.equal(missing.body.error.code, 'AUTH_REQUIRED')

  const malformed = await request(app)
    .get('/api/launches')
    .set('Authorization', 'Bearer token-invalido')
  assert.equal(malformed.status, 401)
  assert.equal(malformed.body.error.code, 'INVALID_TOKEN')
})

test('GET /api/launches combina búsqueda, mercado, estado, fechas y paginación', async () => {
  const token = await loginAs(emails.creator)
  const filtered = await request(app)
    .get('/api/launches')
    .set(bearer(token))
    .query({
      search: 'Alpha',
      market: 'Colombia',
      status: LaunchStatus.DRAFT,
      startDate: '2030-01-01',
      endDate: '2030-01-31',
      page: 1,
      limit: 10,
    })

  assert.equal(filtered.status, 200)
  assert.equal(filtered.body.data.length, 1)
  assert.equal(filtered.body.data[0].id, fixture.draft.id)
  assert.deepEqual(filtered.body.meta, {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  })

  const aliases = await request(app)
    .get('/api/launches')
    .set(bearer(token))
    .query({ from: '2030-02-01', to: '2030-02-28' })

  assert.equal(aliases.status, 200)
  assert.deepEqual(aliases.body.data.map(({ id }) => id), [fixture.inReview.id])
})

test('GET de detalle e historial devuelve relaciones públicas sin contraseñas', async () => {
  const token = await loginAs(emails.approver)
  const detail = await request(app)
    .get(`/api/launches/${fixture.draft.id}`)
    .set(bearer(token))

  assert.equal(detail.status, 200)
  assert.equal(detail.body.data.creator.email, emails.creator)
  assert.equal('password' in detail.body.data.creator, false)
  assert.equal(detail.body.data.assets.length, 1)

  const history = await request(app)
    .get(`/api/launches/${fixture.inReview.id}/history`)
    .set(bearer(token))

  assert.equal(history.status, 200)
  assert.equal(history.body.data.length, 1)
  assert.equal(history.body.data[0].previousStatus, LaunchStatus.DRAFT)
  assert.equal(history.body.data[0].newStatus, LaunchStatus.IN_REVIEW)
  assert.equal('password' in history.body.data[0].changedBy, false)
})

test('CREATOR puede crear, editar y eliminar su propio DRAFT sin mutar status ni creatorId', async () => {
  const token = await loginAs(emails.creator)
  const createResponse = await request(app)
    .post('/api/launches')
    .set(bearer(token))
    .send({
      name: 'Nuevo lanzamiento',
      description: 'Descripción inicial.',
      market: 'Perú',
      launchDate: '2031-04-10T12:00:00.000Z',
      status: LaunchStatus.PUBLISHED,
      creatorId: fixture.approver.id,
    })

  assert.equal(createResponse.status, 201)
  assert.equal(createResponse.body.data.status, LaunchStatus.DRAFT)
  assert.equal(createResponse.body.data.creatorId, fixture.creator.id)

  const launchId = createResponse.body.data.id
  const updateResponse = await request(app)
    .put(`/api/launches/${launchId}`)
    .set(bearer(token))
    .send({
      name: 'Lanzamiento actualizado',
      description: 'Descripción actualizada.',
      market: 'Ecuador',
      launchDate: '2031-05-11T12:00:00.000Z',
      status: LaunchStatus.PUBLISHED,
      creatorId: fixture.approver.id,
    })

  assert.equal(updateResponse.status, 200)
  assert.equal(updateResponse.body.data.name, 'Lanzamiento actualizado')
  assert.equal(updateResponse.body.data.status, LaunchStatus.DRAFT)
  assert.equal(updateResponse.body.data.creatorId, fixture.creator.id)

  const deleteResponse = await request(app)
    .delete(`/api/launches/${launchId}`)
    .set(bearer(token))
  assert.equal(deleteResponse.status, 200)

  const missing = await request(app)
    .get(`/api/launches/${launchId}`)
    .set(bearer(token))
  assert.equal(missing.status, 404)
})

test('roles, propiedad y estado DRAFT protegen creación, edición y eliminación', async () => {
  const [approverToken, otherToken, creatorToken] = await Promise.all([
    loginAs(emails.approver),
    loginAs(emails.otherCreator),
    loginAs(emails.creator),
  ])
  const validPayload = {
    name: 'Operación no permitida',
    description: 'Validación de permisos.',
    market: 'Chile',
    launchDate: '2031-06-01T12:00:00.000Z',
  }

  const approverCreate = await request(app)
    .post('/api/launches')
    .set(bearer(approverToken))
    .send(validPayload)
  assert.equal(approverCreate.status, 403)

  const otherUpdate = await request(app)
    .put(`/api/launches/${fixture.draft.id}`)
    .set(bearer(otherToken))
    .send(validPayload)
  assert.equal(otherUpdate.status, 403)
  assert.equal(otherUpdate.body.error.code, 'NOT_LAUNCH_OWNER')

  const nonDraftUpdate = await request(app)
    .put(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(creatorToken))
    .send(validPayload)
  assert.equal(nonDraftUpdate.status, 409)
  assert.equal(nonDraftUpdate.body.error.code, 'DRAFT_REQUIRED')

  const nonDraftDelete = await request(app)
    .delete(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(creatorToken))
  assert.equal(nonDraftDelete.status, 409)
  assert.equal(nonDraftDelete.body.error.code, 'DRAFT_REQUIRED')
})

test('CREATOR solo puede avanzar su DRAFT a IN_REVIEW y cada cambio crea historial', async () => {
  const creatorToken = await loginAs(emails.creator)
  const skipped = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.APPROVED })

  assert.equal(skipped.status, 409)
  assert.equal(skipped.body.error.code, 'INVALID_STATUS_TRANSITION')
  assert.equal(
    await prisma.statusHistory.count({ where: { launchId: fixture.draft.id } }),
    0,
  )

  const submitted = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.IN_REVIEW, comment: 'Enviar al comité.' })

  assert.equal(submitted.status, 200)
  assert.equal(submitted.body.data.status, LaunchStatus.IN_REVIEW)
  assert.equal(submitted.body.data.statusHistory.length, 1)
  assert.equal(submitted.body.data.statusHistory[0].comment, 'Enviar al comité.')

  const creatorCannotApprove = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.APPROVED })
  assert.equal(creatorCannotApprove.status, 403)
})

test('APPROVER aprueba y publica secuencialmente, pero no puede saltar estados', async () => {
  const approverToken = await loginAs(emails.approver)
  const skipped = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ newStatus: LaunchStatus.PUBLISHED })
  assert.equal(skipped.status, 409)
  assert.equal(skipped.body.error.code, 'INVALID_STATUS_TRANSITION')

  const approved = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ newStatus: LaunchStatus.APPROVED, comment: 'Aprobado.' })
  assert.equal(approved.status, 200)
  assert.equal(approved.body.data.status, LaunchStatus.APPROVED)

  const published = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.PUBLISHED, comment: 'Publicado.' })
  assert.equal(published.status, 200)
  assert.equal(published.body.data.status, LaunchStatus.PUBLISHED)

  const history = await request(app)
    .get(`/api/launches/${fixture.inReview.id}/history`)
    .set(bearer(approverToken))
  assert.equal(history.status, 200)
  assert.equal(history.body.data.length, 3)
  assert.deepEqual(
    new Set(history.body.data.map(({ newStatus }) => newStatus)),
    new Set([
      LaunchStatus.IN_REVIEW,
      LaunchStatus.APPROVED,
      LaunchStatus.PUBLISHED,
    ]),
  )
})

test('APPROVER no puede enviar un DRAFT a revisión', async () => {
  const token = await loginAs(emails.approver)
  const response = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(token))
    .send({ status: LaunchStatus.IN_REVIEW })

  assert.equal(response.status, 403)
  assert.equal(response.body.error.code, 'FORBIDDEN')
})

test('APPROVER solicita cambios con comentario y el CREATOR propietario reabre el borrador', async () => {
  const [creatorToken, otherToken, approverToken] = await Promise.all([
    loginAs(emails.creator),
    loginAs(emails.otherCreator),
    loginAs(emails.approver),
  ])

  const missingComment = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.CHANGES_REQUESTED })
  assert.equal(missingComment.status, 400)
  assert.equal(missingComment.body.error.code, 'COMMENT_REQUIRED')

  const requested = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({
      status: LaunchStatus.CHANGES_REQUESTED,
      comment: 'Ajustar el claim y reemplazar el key visual.',
    })
  assert.equal(requested.status, 200)
  assert.equal(requested.body.data.status, LaunchStatus.CHANGES_REQUESTED)
  assert.equal(
    requested.body.data.statusHistory[0].comment,
    'Ajustar el claim y reemplazar el key visual.',
  )

  const otherCannotReopen = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(otherToken))
    .send({ status: LaunchStatus.DRAFT })
  assert.equal(otherCannotReopen.status, 403)
  assert.equal(otherCannotReopen.body.error.code, 'NOT_LAUNCH_OWNER')

  const reopened = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.DRAFT, comment: 'Retomo los ajustes solicitados.' })
  assert.equal(reopened.status, 200)
  assert.equal(reopened.body.data.status, LaunchStatus.DRAFT)
  assert.equal(reopened.body.data.statusHistory.length, 3)

  const editableAgain = await request(app)
    .put(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(creatorToken))
    .send({
      name: 'Campaña corregida',
      description: 'Descripción ajustada después del feedback.',
      market: 'México',
      launchDate: '2031-06-01T12:00:00.000Z',
    })
  assert.equal(editableAgain.status, 200)
  assert.equal(editableAgain.body.data.name, 'Campaña corregida')
})

test('APPROVER rechaza con motivo y REJECTED queda como estado terminal', async () => {
  const approverToken = await loginAs(emails.approver)

  for (const status of [LaunchStatus.CHANGES_REQUESTED, LaunchStatus.REJECTED]) {
    const response = await request(app)
      .patch(`/api/launches/${fixture.inReview.id}/status`)
      .set(bearer(approverToken))
      .send({ status })
    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, 'COMMENT_REQUIRED')
  }

  const rejected = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.REJECTED, comment: 'La propuesta no cumple el brief.' })
  assert.equal(rejected.status, 200)
  assert.equal(rejected.body.data.status, LaunchStatus.REJECTED)
  assert.equal(rejected.body.data.statusHistory[0].comment, 'La propuesta no cumple el brief.')

  const cannotResume = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.APPROVED })
  assert.equal(cannotResume.status, 409)
  assert.equal(cannotResume.body.error.code, 'INVALID_STATUS_TRANSITION')
  assert.deepEqual(cannotResume.body.error.details.allowedStatuses, [])
})

test('assets solo pueden agregarse y eliminarse por el CREATOR propietario de un DRAFT', async () => {
  const [creatorToken, otherToken, approverToken] = await Promise.all([
    loginAs(emails.creator),
    loginAs(emails.otherCreator),
    loginAs(emails.approver),
  ])

  const addResponse = await request(app)
    .post(`/api/launches/${fixture.draft.id}/assets`)
    .set(bearer(creatorToken))
    .send({
      name: 'Key visual',
      type: 'IMAGE',
      url: 'https://assets.example.test/key-visual.jpg',
    })
  assert.equal(addResponse.status, 201)

  const otherDelete = await request(app)
    .delete(`/api/assets/${addResponse.body.data.id}`)
    .set(bearer(otherToken))
  assert.equal(otherDelete.status, 403)
  assert.equal(otherDelete.body.error.code, 'NOT_LAUNCH_OWNER')

  const deleteResponse = await request(app)
    .delete(`/api/assets/${addResponse.body.data.id}`)
    .set(bearer(creatorToken))
  assert.equal(deleteResponse.status, 200)

  const addToReview = await request(app)
    .post(`/api/launches/${fixture.inReview.id}/assets`)
    .set(bearer(creatorToken))
    .send({
      name: 'Asset tardío',
      type: 'IMAGE',
      url: 'https://assets.example.test/late.jpg',
    })
  assert.equal(addToReview.status, 409)
  assert.equal(addToReview.body.error.code, 'DRAFT_REQUIRED')

  const approverAdd = await request(app)
    .post(`/api/launches/${fixture.draft.id}/assets`)
    .set(bearer(approverToken))
    .send({
      name: 'Asset del aprobador',
      type: 'IMAGE',
      url: 'https://assets.example.test/approver.jpg',
    })
  assert.equal(approverAdd.status, 403)
})
