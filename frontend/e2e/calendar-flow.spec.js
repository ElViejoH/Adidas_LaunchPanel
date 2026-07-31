import { expect, test } from '@playwright/test'
import { addMonths, format, setDate, startOfMonth } from 'date-fns'
import { enUS } from 'date-fns/locale'

const API_URL = 'http://127.0.0.1:4100/api'
const CREATOR_EMAIL = 'creator.e2e@adidas.test'
const PASSWORD = 'password123'

function calendarMonthLabel(date) {
  return format(date, 'MMMM yyyy', { locale: enUS })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

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
      comment: 'Ready to validate the calendar filter.',
    },
  })

  expect(response.ok()).toBeTruthy()
}

async function login(page) {
  await page.goto('/login')
  await page.getByLabel('Corporate email').fill(CREATOR_EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Enter the panel' }).click()
  await expect(page).toHaveURL('/')
}

test('locates launches by month, navigates, filters, and opens details', async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const currentMonth = startOfMonth(new Date())
  const nextMonth = addMonths(currentMonth, 1)
  const colombiaName = `Calendar Colombia ${suffix}`
  const reviewName = `Calendar Japan ${suffix}`
  const nextMonthName = `Next calendar ${suffix}`
  const token = await getCreatorToken(request)

  await createLaunch(request, token, {
    name: colombiaName,
    description: 'Test launch for the Colombian market.',
    market: 'Colombia',
    launchDate: format(setDate(currentMonth, 10), 'yyyy-MM-dd'),
  })
  const reviewLaunch = await createLaunch(request, token, {
    name: reviewName,
    description: 'Launch in review used to validate the status filter.',
    market: 'Japan',
    launchDate: format(setDate(currentMonth, 20), 'yyyy-MM-dd'),
  })
  await sendToReview(request, token, reviewLaunch.id)
  await createLaunch(request, token, {
    name: nextMonthName,
    description: 'Launch scheduled for the following month.',
    market: 'Global',
    launchDate: format(setDate(nextMonth, 12), 'yyyy-MM-dd'),
  })

  await login(page)
  await page.goto('/calendar')

  await expect(page.getByRole('heading', { name: 'Launch calendar' })).toBeVisible()
  await expect(
    page.getByRole('grid', {
      name: `Launches in ${calendarMonthLabel(currentMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toBeVisible()
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await expect(page.getByTitle(nextMonthName)).toHaveCount(0)

  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(
    page.getByRole('grid', {
      name: `Launches in ${calendarMonthLabel(nextMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(nextMonthName)).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toHaveCount(0)

  await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(
    page.getByRole('grid', {
      name: `Launches in ${calendarMonthLabel(currentMonth)}`,
    }),
  ).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toBeVisible()

  await page.getByLabel('Market').fill('Colombia')
  await expect(page.getByTitle(colombiaName)).toBeVisible()
  await expect(page.getByTitle(reviewName)).toHaveCount(0)

  await page.getByLabel('Market').fill('')
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await page.getByLabel('Status').selectOption('IN_REVIEW')
  await expect(page.getByTitle(reviewName)).toBeVisible()
  await expect(page.getByTitle(colombiaName)).toHaveCount(0)

  await page.getByTitle(reviewName).click()
  await expect(page).toHaveURL(new RegExp(`/launches/${reviewLaunch.id}$`))
  await expect(page.getByRole('heading', { name: reviewName })).toBeVisible()
})
