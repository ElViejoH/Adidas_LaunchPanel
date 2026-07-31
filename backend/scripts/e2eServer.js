import { mkdir, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

process.env.NODE_ENV = 'test'
process.env.PORT = '4100'
process.env.DATABASE_URL = 'file:../test/.tmp/e2e.db'
process.env.JWT_SECRET = 'e2e-test-secret-with-more-than-32-characters'
process.env.JWT_EXPIRES_IN = '15m'
process.env.CORS_ORIGIN = 'http://127.0.0.1:4173'

const databasePath = fileURLToPath(new URL('../test/.tmp/e2e.db', import.meta.url))
const tempDirectory = fileURLToPath(new URL('../test/.tmp/', import.meta.url))

async function createSchema(prisma) {
  const migrationUrl = new URL(
    '../prisma/migrations/20260729000400_init/migration.sql',
    import.meta.url,
  )
  const migration = await readFile(migrationUrl, 'utf8')
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }
}

async function main() {
  await mkdir(tempDirectory, { recursive: true })
  await rm(databasePath, { force: true })

  const [{ default: bcrypt }, { Role }, prismaModule] = await Promise.all([
    import('bcryptjs'),
    import('@prisma/client'),
    import('../src/prisma/client.js'),
  ])
  const prisma = prismaModule.default
  await createSchema(prisma)

  const password = await bcrypt.hash('password123', 4)
  await prisma.user.createMany({
    data: [
      {
        name: 'E2E Creator',
        email: 'creator.e2e@adidas.test',
        password,
        role: Role.CREATOR,
      },
      {
        name: 'E2E Approver',
        email: 'approver.e2e@adidas.test',
        password,
        role: Role.APPROVER,
      },
      {
        name: 'E2E Admin',
        email: 'admin.e2e@adidas.test',
        password,
        role: Role.ADMIN,
      },
      {
        name: 'E2E Managed User',
        email: 'managed.e2e@adidas.test',
        password,
        role: Role.CREATOR,
      },
    ],
  })

  const { default: app } = await import('../src/server.js')
  const server = app.listen(4100, '127.0.0.1', () => {
    console.log('E2E API available at http://127.0.0.1:4100')
  })

  const shutdown = () => {
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error('The E2E API could not be started.', error)
  process.exit(1)
})
