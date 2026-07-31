import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const apiUrl = 'http://127.0.0.1:4100/api'
const screenshotsDirectory = fileURLToPath(
  new URL('../../docs/screenshots/', import.meta.url),
)

const demoLaunches = [
  {
    name: 'Adizero Nova Bogotá',
    description: 'Campaña regional de running con piezas digitales y retail.',
    market: 'Colombia',
    dateOffset: 0,
    targetStatus: 'DRAFT',
  },
  {
    name: 'Samba Studio México',
    description: 'Activación de Originals para tiendas y canales sociales.',
    market: 'México',
    dateOffset: 0,
    targetStatus: 'IN_REVIEW',
  },
  {
    name: 'Terrex Andes Perú',
    description: 'Lanzamiento outdoor con materiales para socios locales.',
    market: 'Perú',
    dateOffset: 1,
    targetStatus: 'APPROVED',
  },
  {
    name: 'Predator Pulse Argentina',
    description: 'Salida de producto para fútbol con ejecución multicanal.',
    market: 'Argentina',
    dateOffset: 2,
    targetStatus: 'PUBLISHED',
  },
]

function dateInRelativeMonth(offset, day) {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  date.setDate(day)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dateDay = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${dateDay}`
}

async function apiLogin(request, email) {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: { email, password: 'password123' },
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  return body.data.token
}

async function createLaunch(request, token, launch, index) {
  const response = await request.post(`${apiUrl}/launches`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: launch.name,
      description: launch.description,
      market: launch.market,
      launchDate: dateInRelativeMonth(launch.dateOffset, 8 + index * 5),
    },
  })
  expect(response.ok()).toBeTruthy()
  return (await response.json()).data
}

async function changeStatus(request, token, launchId, status, comment) {
  const response = await request.patch(`${apiUrl}/launches/${launchId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status, comment },
  })
  expect(response.ok()).toBeTruthy()
}

async function prepareDemoData(request) {
  const creatorToken = await apiLogin(request, 'creator.e2e@adidas.test')
  const approverToken = await apiLogin(request, 'approver.e2e@adidas.test')
  const createdLaunches = []

  for (const [index, launch] of demoLaunches.entries()) {
    const created = await createLaunch(request, creatorToken, launch, index)
    createdLaunches.push(created)

    if (launch.targetStatus !== 'DRAFT') {
      await changeStatus(
        request,
        creatorToken,
        created.id,
        'IN_REVIEW',
        'Materiales listos para la demostración.',
      )
    }
    if (['APPROVED', 'PUBLISHED'].includes(launch.targetStatus)) {
      await changeStatus(
        request,
        approverToken,
        created.id,
        'APPROVED',
        'Aprobado para la demostración.',
      )
    }
    if (launch.targetStatus === 'PUBLISHED') {
      await changeStatus(
        request,
        approverToken,
        created.id,
        'PUBLISHED',
        'Publicado para la demostración.',
      )
    }
  }

  return createdLaunches
}

async function login(page, email) {
  await page.getByLabel('Correo corporativo').fill(email)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar al panel' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

async function capture(page, filename) {
  await page.evaluate(() => document.fonts.ready)
  const visualState = await page.evaluate(() => ({
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  }))
  expect(visualState.hasHorizontalOverflow).toBe(false)
  expect(visualState.brokenImages).toEqual([])

  await page.screenshot({
    path: join(screenshotsDirectory, filename),
    fullPage: true,
    animations: 'disabled',
  })
}

test.skip(
  process.env.CAPTURE_DEMO !== '1',
  'Las capturas se regeneran sólo con CAPTURE_DEMO=1.',
)

test('genera las capturas del recorrido de demostración', async ({ page, request }) => {
  await mkdir(screenshotsDirectory, { recursive: true })
  const launches = await prepareDemoData(request)
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await capture(page, '01-login.png')

  await login(page, 'creator.e2e@adidas.test')
  await expect(page.getByRole('heading', { name: 'Hola, E2E' })).toBeVisible()
  await expect(page.getByText('Adizero Nova Bogotá')).toBeVisible()
  await capture(page, '02-dashboard-creador.png')

  await page.goto('/launches')
  await expect(page.getByRole('heading', { name: 'Lanzamientos' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Samba Studio México', exact: true }),
  ).toBeVisible()
  await capture(page, '03-listado-lanzamientos.png')

  await page.goto('/calendar')
  await expect(page.getByRole('heading', { name: 'Calendario de lanzamientos' })).toBeVisible()
  await expect(page.getByTitle('Adizero Nova Bogotá')).toBeVisible()
  await capture(page, '04-calendario.png')

  await page.goto(`/launches/${launches[0].id}`)
  await expect(page.getByRole('heading', { name: 'Adizero Nova Bogotá' })).toBeVisible()
  await capture(page, '05-detalle-lanzamiento.png')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await login(page, 'admin.e2e@adidas.test')
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Usuarios y permisos' })).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: 'Rol de admin.e2e@adidas.test' }),
  ).toBeVisible()
  await capture(page, '06-usuarios-permisos.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hola, E2E' })).toBeVisible()
  await capture(page, '07-dashboard-admin-movil.png')

  expect(runtimeErrors).toEqual([])
})
