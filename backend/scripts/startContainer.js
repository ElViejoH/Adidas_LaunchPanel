import { spawnSync } from 'node:child_process'
import { mkdir, open } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const backendDirectory = fileURLToPath(new URL('../', import.meta.url))

async function ensureSqliteDatabaseFile() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl?.startsWith('file:')) return

  const configuredPath = decodeURIComponent(databaseUrl.slice('file:'.length).split('?')[0])
  const databasePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(backendDirectory, 'prisma', configuredPath)

  await mkdir(path.dirname(databasePath), { recursive: true })
  const handle = await open(databasePath, 'a')
  await handle.close()
}

function runNodeScript(args, label) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendDirectory,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error || result.status !== 0) {
    console.error(`${label} no pudo completarse.`)
    process.exit(result.status || 1)
  }
}

await ensureSqliteDatabaseFile()

runNodeScript(
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  'La migración de base de datos',
)

if (process.env.SEED_DATABASE === 'true') {
  runNodeScript(['prisma/seed.js'], 'La carga de datos semilla')
}

const [{ default: app }, { default: prisma }] = await Promise.all([
  import('../src/server.js'),
  import('../src/prisma/client.js'),
])

const port = Number(process.env.PORT) || 4000
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Adidas Launch Panel disponible en el puerto ${port}`)
})

function shutdown(signal) {
  console.log(`Señal ${signal} recibida. Cerrando el servidor.`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
