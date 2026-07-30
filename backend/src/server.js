import 'dotenv/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import prisma from './prisma/client.js'
import apiRoutes from './routes/index.js'

function getCorsOptions() {
  const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
  }
}

export const app = express()

app.disable('x-powered-by')
app.use(cors(getCorsOptions()))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', database: 'reachable' })
  } catch (error) {
    next(error)
  }
})
app.use('/api', apiRoutes)

if (process.env.SERVE_FRONTEND === 'true') {
  const frontendDist = resolve(
    process.env.FRONTEND_DIST_PATH ||
      fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
  )
  const frontendIndex = resolve(frontendDist, 'index.html')

  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(frontendIndex, (error) => {
      if (error) next(error)
    })
  })
}

app.use(notFoundHandler)
app.use(errorHandler)

const isEntryPoint =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isEntryPoint) {
  const port = Number(process.env.PORT) || 4000
  app.listen(port, () => {
    console.log(`Adidas Launch Panel API disponible en http://localhost:${port}`)
  })
}

export default app
