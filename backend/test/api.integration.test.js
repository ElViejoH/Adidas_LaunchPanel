import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import bcrypt from 'bcryptjs'
import request from 'supertest'

// This URL is relative to prisma/schema.prisma. It keeps the suite fully
// isolated from prisma/dev.db and any user-created data.
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
  admin: 'integration.admin@adidas.test',
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
  const admin = await prisma.user.create({
    data: {
      name: 'Integration Admin',
      email: emails.admin,
      password: passwordHash,
      role: Role.ADMIN,
    },
  })

  const draft = await prisma.launch.create({
    data: {
      name: 'Alpha Running Colombia',
      description: 'Draft used to validate search and permissions.',
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

  const privateDraft = await prisma.launch.create({
    data: {
      name: 'Private Basketball Peru',
      description: 'Private draft owned by another creator.',
      market: 'Peru',
      launchDate: new Date('2030-01-25T12:00:00.000Z'),
      status: LaunchStatus.DRAFT,
      creatorId: otherCreator.id,
    },
  })

  const inReview = await prisma.launch.create({
    data: {
      name: 'Beta Football Mexico',
      description: 'Launch submitted for review.',
      market: 'Mexico',
      launchDate: new Date('2030-02-15T12:00:00.000Z'),
      status: LaunchStatus.IN_REVIEW,
      creatorId: creator.id,
      statusHistory: {
        create: {
          previousStatus: LaunchStatus.DRAFT,
          newStatus: LaunchStatus.IN_REVIEW,
          changedById: creator.id,
          comment: 'Ready for review.',
        },
      },
    },
  })

  const approved = await prisma.launch.create({
    data: {
      name: 'Gamma Originals Colombia',
      description: 'Approved campaign awaiting publication.',
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

  return {
    creator,
    otherCreator,
    approver,
    admin,
    draft,
    privateDraft,
    inReview,
    approved,
  }
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

test('POST /api/auth/login authenticates seed credentials without exposing the hash', async () => {
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

test('GET /api/auth/me returns the effective session role', async () => {
  const token = await loginAs(emails.admin)
  const response = await request(app).get('/api/auth/me').set(bearer(token))

  assert.equal(response.status, 200)
  assert.equal(response.body.data.email, emails.admin)
  assert.equal(response.body.data.role, Role.ADMIN)
  assert.equal('password' in response.body.data, false)
})

test('only ADMIN can list users and passwords are never returned', async () => {
  const [adminToken, creatorToken, approverToken] = await Promise.all([
    loginAs(emails.admin),
    loginAs(emails.creator),
    loginAs(emails.approver),
  ])

  const unauthenticated = await request(app).get('/api/users')
  assert.equal(unauthenticated.status, 401)

  for (const token of [creatorToken, approverToken]) {
    const forbidden = await request(app).get('/api/users').set(bearer(token))
    assert.equal(forbidden.status, 403)
  }

  const response = await request(app)
    .get('/api/users')
    .set(bearer(adminToken))
    .query({ search: 'integration', role: Role.CREATOR })

  assert.equal(response.status, 200)
  assert.equal(response.body.data.length, 2)
  assert.equal(response.body.data.every(({ role }) => role === Role.CREATOR), true)
  assert.equal(response.body.data.some((user) => 'password' in user), false)
})

test('ADMIN changes roles with validation and permissions apply to existing tokens', async () => {
  const [adminToken, creatorToken] = await Promise.all([
    loginAs(emails.admin),
    loginAs(emails.creator),
  ])

  const invalidRole = await request(app)
    .patch(`/api/users/${fixture.otherCreator.id}/role`)
    .set(bearer(adminToken))
    .send({ role: 'SUPER_ADMIN' })
  assert.equal(invalidRole.status, 400)

  const updated = await request(app)
    .patch(`/api/users/${fixture.creator.id}/role`)
    .set(bearer(adminToken))
    .send({ role: Role.APPROVER })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.data.role, Role.APPROVER)
  assert.equal('password' in updated.body.data, false)

  const currentUser = await request(app).get('/api/auth/me').set(bearer(creatorToken))
  assert.equal(currentUser.status, 200)
  assert.equal(currentUser.body.data.role, Role.APPROVER)

  const cannotCreate = await request(app)
    .post('/api/launches')
    .set(bearer(creatorToken))
    .send({
      name: 'Previous permission',
      market: 'Colombia',
      launchDate: '2031-09-10',
    })
  assert.equal(cannotCreate.status, 403)

  const cannotApproveOwnLaunch = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.APPROVED })
  assert.equal(cannotApproveOwnLaunch.status, 403)
  assert.equal(cannotApproveOwnLaunch.body.error.code, 'SELF_APPROVAL_FORBIDDEN')

  assert.equal(
    await prisma.launch.count({ where: { creatorId: fixture.creator.id } }),
    3,
  )
})

test('ADMIN cannot change their own role or modify users that do not exist', async () => {
  const token = await loginAs(emails.admin)

  const noOp = await request(app)
    .patch(`/api/users/${fixture.admin.id}/role`)
    .set(bearer(token))
    .send({ role: Role.ADMIN })
  assert.equal(noOp.status, 200)

  const selfChange = await request(app)
    .patch(`/api/users/${fixture.admin.id}/role`)
    .set(bearer(token))
    .send({ role: Role.CREATOR })
  assert.equal(selfChange.status, 409)
  assert.equal(selfChange.body.error.code, 'SELF_ROLE_CHANGE_NOT_ALLOWED')

  const missing = await request(app)
    .patch('/api/users/999999/role')
    .set(bearer(token))
    .send({ role: Role.CREATOR })
  assert.equal(missing.status, 404)
  assert.equal(missing.body.error.code, 'USER_NOT_FOUND')
})

test('GET /api/health verifies API and database availability', async () => {
  const response = await request(app).get('/api/health')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok', database: 'reachable' })
})

test('launch routes require a valid Bearer token', async () => {
  const missing = await request(app).get('/api/launches')
  assert.equal(missing.status, 401)
  assert.equal(missing.body.error.code, 'AUTH_REQUIRED')

  const malformed = await request(app)
    .get('/api/launches')
    .set('Authorization', 'Bearer token-invalido')
  assert.equal(malformed.status, 401)
  assert.equal(malformed.body.error.code, 'INVALID_TOKEN')
})

test('GET /api/launches combines search, market, status, dates, and pagination', async () => {
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

test('drafts are visible only to the person who created them', async () => {
  const [creatorToken, otherToken, approverToken, adminToken] = await Promise.all([
    loginAs(emails.creator),
    loginAs(emails.otherCreator),
    loginAs(emails.approver),
    loginAs(emails.admin),
  ])

  const cases = [
    {
      token: creatorToken,
      visibleDraftId: fixture.draft.id,
      hiddenDraftId: fixture.privateDraft.id,
    },
    {
      token: otherToken,
      visibleDraftId: fixture.privateDraft.id,
      hiddenDraftId: fixture.draft.id,
    },
    {
      token: approverToken,
      hiddenDraftId: fixture.draft.id,
    },
    {
      token: adminToken,
      hiddenDraftId: fixture.draft.id,
    },
  ]

  for (const { token, visibleDraftId, hiddenDraftId } of cases) {
    const list = await request(app)
      .get('/api/launches')
      .set(bearer(token))
      .query({ status: LaunchStatus.DRAFT })

    assert.equal(list.status, 200)
    const listedIds = list.body.data.map(({ id }) => id)
    if (visibleDraftId) {
      assert.deepEqual(listedIds, [visibleDraftId])
      const visibleDetail = await request(app)
        .get(`/api/launches/${visibleDraftId}`)
        .set(bearer(token))
      assert.equal(visibleDetail.status, 200)
    } else {
      assert.deepEqual(listedIds, [])
    }
    assert.equal(listedIds.includes(hiddenDraftId), false)

    const hiddenDetail = await request(app)
      .get(`/api/launches/${hiddenDraftId}`)
      .set(bearer(token))
    assert.equal(hiddenDetail.status, 404)
    assert.equal(hiddenDetail.body.error.code, 'LAUNCH_NOT_FOUND')

    const hiddenHistory = await request(app)
      .get(`/api/launches/${hiddenDraftId}/history`)
      .set(bearer(token))
    assert.equal(hiddenHistory.status, 404)
    assert.equal(hiddenHistory.body.error.code, 'LAUNCH_NOT_FOUND')
  }
})

test('detail and history endpoints return public relationships without passwords', async () => {
  const [creatorToken, approverToken] = await Promise.all([
    loginAs(emails.creator),
    loginAs(emails.approver),
  ])
  const detail = await request(app)
    .get(`/api/launches/${fixture.draft.id}`)
    .set(bearer(creatorToken))

  assert.equal(detail.status, 200)
  assert.equal(detail.body.data.creator.email, emails.creator)
  assert.equal('password' in detail.body.data.creator, false)
  assert.equal(detail.body.data.assets.length, 1)

  const history = await request(app)
    .get(`/api/launches/${fixture.inReview.id}/history`)
    .set(bearer(approverToken))

  assert.equal(history.status, 200)
  assert.equal(history.body.data.length, 1)
  assert.equal(history.body.data[0].previousStatus, LaunchStatus.DRAFT)
  assert.equal(history.body.data[0].newStatus, LaunchStatus.IN_REVIEW)
  assert.equal('password' in history.body.data[0].changedBy, false)
})

test('CREATOR can create, edit, and delete an owned DRAFT without mutating status or creatorId', async () => {
  const token = await loginAs(emails.creator)
  const createResponse = await request(app)
    .post('/api/launches')
    .set(bearer(token))
    .send({
      name: 'New launch',
      description: 'Initial description.',
      market: 'Peru',
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
      name: 'Updated launch',
      description: 'Updated description.',
      market: 'Ecuador',
      launchDate: '2031-05-11T12:00:00.000Z',
      status: LaunchStatus.PUBLISHED,
      creatorId: fixture.approver.id,
    })

  assert.equal(updateResponse.status, 200)
  assert.equal(updateResponse.body.data.name, 'Updated launch')
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

test('roles, ownership, and editable statuses protect create, update, and delete operations', async () => {
  const [approverToken, otherToken, creatorToken] = await Promise.all([
    loginAs(emails.approver),
    loginAs(emails.otherCreator),
    loginAs(emails.creator),
  ])
  const validPayload = {
    name: 'Forbidden operation',
    description: 'Permission validation.',
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

  const otherReviewUpdate = await request(app)
    .put(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(otherToken))
    .send(validPayload)
  assert.equal(otherReviewUpdate.status, 403)
  assert.equal(otherReviewUpdate.body.error.code, 'NOT_LAUNCH_OWNER')

  const reviewUpdate = await request(app)
    .put(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(creatorToken))
    .send(validPayload)
  assert.equal(reviewUpdate.status, 200)
  assert.equal(reviewUpdate.body.data.status, LaunchStatus.IN_REVIEW)
  assert.equal(reviewUpdate.body.data.name, validPayload.name)

  const approvedUpdate = await request(app)
    .put(`/api/launches/${fixture.approved.id}`)
    .set(bearer(creatorToken))
    .send(validPayload)
  assert.equal(approvedUpdate.status, 409)
  assert.equal(approvedUpdate.body.error.code, 'EDITABLE_STATUS_REQUIRED')

  const reviewDelete = await request(app)
    .delete(`/api/launches/${fixture.inReview.id}`)
    .set(bearer(creatorToken))
  assert.equal(reviewDelete.status, 200)

  const approvedDelete = await request(app)
    .delete(`/api/launches/${fixture.approved.id}`)
    .set(bearer(creatorToken))
  assert.equal(approvedDelete.status, 409)
  assert.equal(approvedDelete.body.error.code, 'EDITABLE_STATUS_REQUIRED')
})

test('CREATOR can only move an owned DRAFT to IN_REVIEW and each change creates history', async () => {
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
    .send({ status: LaunchStatus.IN_REVIEW, comment: 'Submit to the committee.' })

  assert.equal(submitted.status, 200)
  assert.equal(submitted.body.data.status, LaunchStatus.IN_REVIEW)
  assert.equal(submitted.body.data.statusHistory.length, 1)
  assert.equal(submitted.body.data.statusHistory[0].comment, 'Submit to the committee.')

  const creatorCannotApprove = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(creatorToken))
    .send({ status: LaunchStatus.APPROVED })
  assert.equal(creatorCannotApprove.status, 403)
})

test('APPROVER approves and publishes sequentially but cannot skip statuses', async () => {
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
    .send({ newStatus: LaunchStatus.APPROVED, comment: 'Approved.' })
  assert.equal(approved.status, 200)
  assert.equal(approved.body.data.status, LaunchStatus.APPROVED)

  const published = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.PUBLISHED, comment: 'Published.' })
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

test('APPROVER cannot submit a DRAFT for review', async () => {
  const token = await loginAs(emails.approver)
  const response = await request(app)
    .patch(`/api/launches/${fixture.draft.id}/status`)
    .set(bearer(token))
    .send({ status: LaunchStatus.IN_REVIEW })

  assert.equal(response.status, 403)
  assert.equal(response.body.error.code, 'FORBIDDEN')
})

test('APPROVER requests changes with a comment and the owning CREATOR reopens the draft', async () => {
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
      name: 'Corrected campaign',
      description: 'Description adjusted after feedback.',
      market: 'Mexico',
      launchDate: '2031-06-01T12:00:00.000Z',
    })
  assert.equal(editableAgain.status, 200)
  assert.equal(editableAgain.body.data.name, 'Corrected campaign')
})

test('APPROVER rejects with a reason and REJECTED remains a terminal status', async () => {
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
    .send({ status: LaunchStatus.REJECTED, comment: 'The proposal does not meet the brief.' })
  assert.equal(rejected.status, 200)
  assert.equal(rejected.body.data.status, LaunchStatus.REJECTED)
  assert.equal(rejected.body.data.statusHistory[0].comment, 'The proposal does not meet the brief.')

  const cannotResume = await request(app)
    .patch(`/api/launches/${fixture.inReview.id}/status`)
    .set(bearer(approverToken))
    .send({ status: LaunchStatus.APPROVED })
  assert.equal(cannotResume.status, 409)
  assert.equal(cannotResume.body.error.code, 'INVALID_STATUS_TRANSITION')
  assert.deepEqual(cannotResume.body.error.details.allowedStatuses, [])
})

test('assets can only be managed by the owning CREATOR in DRAFT or IN_REVIEW', async () => {
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
      name: 'Late asset',
      type: 'IMAGE',
      url: 'https://assets.example.test/late.jpg',
    })
  assert.equal(addToReview.status, 201)

  const deleteFromReview = await request(app)
    .delete(`/api/assets/${addToReview.body.data.id}`)
    .set(bearer(creatorToken))
  assert.equal(deleteFromReview.status, 200)

  const approverAdd = await request(app)
    .post(`/api/launches/${fixture.draft.id}/assets`)
    .set(bearer(approverToken))
    .send({
      name: 'Approver asset',
      type: 'IMAGE',
      url: 'https://assets.example.test/approver.jpg',
    })
  assert.equal(approverAdd.status, 403)
})

test('assets enforce the allowed types and the limit of 10 per launch', async () => {
  const token = await loginAs(emails.creator)

  const invalidType = await request(app)
    .post(`/api/launches/${fixture.draft.id}/assets`)
    .set(bearer(token))
    .send({
      name: 'Invalid type',
      type: 'EXECUTABLE',
      url: 'https://assets.example.test/invalid.exe',
    })

  assert.equal(invalidType.status, 400)
  assert.equal(invalidType.body.error.code, 'INVALID_ASSET_TYPE')

  for (let index = 1; index <= 9; index += 1) {
    const response = await request(app)
      .post(`/api/launches/${fixture.draft.id}/assets`)
      .set(bearer(token))
      .send({
        name: `Asset ${index}`,
        type: 'IMAGE',
        url: `https://assets.example.test/asset-${index}.jpg`,
      })
    assert.equal(response.status, 201)
  }

  const overflow = await request(app)
    .post(`/api/launches/${fixture.draft.id}/assets`)
    .set(bearer(token))
    .send({
      name: 'Asset adicional',
      type: 'IMAGE',
      url: 'https://assets.example.test/overflow.jpg',
    })

  assert.equal(overflow.status, 409)
  assert.equal(overflow.body.error.code, 'ASSET_LIMIT_REACHED')
  assert.equal(
    await prisma.asset.count({ where: { launchId: fixture.draft.id } }),
    10,
  )
})
