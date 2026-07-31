import { expect, test } from '@playwright/test'
import { addMonths, format, setDate, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const API_URL = 'http://127.0.0.1:4100/api'
const CREATOR_EMAIL = 'creator.e2e@adidas.test'
const PASSWORD = 'password123'

function calendarMonthLabel(date) {
  return format(date, 'MMMM yyyy', { locale: es })
}

async function getCreatorToken(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: CREATOR_EMAIL,
      password: PASSWORD,
    },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.data?.token).toEqual(expect.any(String))
  return body.data.token
}

async function createLaunch(request, token, data) {
  const response = await request.post(`${API_URL}/launches`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })

  expect(response.status()).toBe(201)
  return (await response.json()).data
}

async function sendToReview(request, token, launchId) {
  const response = await request.patch(`${API_URL}/launches/${launchId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      status: 'IN_REVIEW',
      comment: 'Preparado para validar el filtro del calendario.',
    },
  })

  expect(response.ok()).toBeTruthy()
}

async function login(page) {
  await page.goto('/login')
  await page.getByLabel('Correo corporativo').fill(CREATOR_EMAIL)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar al panel' }).click()
  await expect(page).toHaveURL('/')
}

test('ubica lanzamientos por mes, navega, filtra y abre el detalle', async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const currentMonth = startOfMonth(new Date())
  const nextMonth = addMonths(currentMonth, 1)
  const colombiaName = `Calendario Colombia ${suffix}`
  const reviewName = `Calendario Japón ${suffix}`
  const nextMonthName = `Calendario siguiente ${suffix}`
  const token = await getCreatorToken(request)

  await createLaunch(request, token, {
    name: colombiaName,
    description: 'Lanzamiento de prueba para el mercado colombiano.',
    market: 'Colombia',
    launchDate: format(setDate(currentMonth, 10), 'yyyy-MM-dd'),
  })
  const reviewLaunch = await createLaunch(request, token, {
    name: reviewName,
    description: 'Lanzamiento en revisión para validar el filtro por estado.',
    market: 'Japón',
    launchDate: format(setDate(currentMonth, 20), 'yyyy-MM-dd'),
  })
  await sendToReview(request, token, reviewLaunch.id)
  await createLaunch(request, token, {
    name: nextMonthName,
    description: 'Lanzamiento ubicado en el mes siguiente.',
    market: 'Global',
    launchDate: format(setDate(nextMonth, 12), 'yyyy-MM-dd'),
  })

  await login(page)
  await page.goto('/calendar')

  await expect(page.getByRole('heading', { name: 'Calendario de lanzamientos' })).toBeVisible()
  await expect(
    page.getByRole('grid', {
      name: `Lanzamientos de ${calendarMonthLabel(currentMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toBeVisible()
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await expect(page.getByTitle(nextMonthName)).toHaveCount(0)

  await page.getByRole('button', { name: 'Mes siguiente' }).click()
  await expect(
    page.getByRole('grid', {
      name: `Lanzamientos de ${calendarMonthLabel(nextMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(nextMonthName)).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toHaveCount(0)

  await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(
    page.getByRole('grid', {
      name: `Lanzamientos de ${calendarMonthLabel(currentMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toBeVisible()

  await page.getByLabel('Mercado').fill('Colombia')
  await expect(page.getByTitle(colombiaName)).toBeVisible()
  await expect(page.getByTitle(reviewName)).toHaveCount(0)

  await page.getByLabel('Mercado').fill('')
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await page.getByLabel('Estado').selectOption('IN_REVIEW')
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toHaveCount(0)

  await page.getByTitle(reviewName).click()
  await expect(page).toHaveURL(new RegExp(`/launches/${reviewLaunch.id}$`))
  await expect(page.getByRole('heading', { name: reviewName })).toBeVisible()
})
