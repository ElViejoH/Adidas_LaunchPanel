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
    name: 'Adizero Nova Bogota',
    description: 'Regional running campaign with digital and retail assets.',
    market: 'Colombia',
    dateOffset: 0,
    targetStatus: 'DRAFT',
  },
  {
    name: 'Samba Studio Mexico',
    description: 'Originals activation for retail and social channels.',
    market: 'Mexico',
    dateOffset: 0,
    targetStatus: 'IN_REVIEW',
  },
  {
    name: 'Terrex Andes Peru',
    description: 'Outdoor launch with materials for local partners.',
    market: 'Peru',
    dateOffset: 1,
    targetStatus: 'APPROVED',
  },
  {
    name: 'Predator Pulse Argentina',
    description: 'Football product release with a multichannel rollout.',
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
        'Materials are ready for the demonstration.',
      )
    }
    if (['APPROVED', 'PUBLISHED'].includes(launch.targetStatus)) {
      await changeStatus(
        request,
        approverToken,
        created.id,
        'APPROVED',
        'Approved for the demonstration.',
      )
    }
    if (launch.targetStatus === 'PUBLISHED') {
      await changeStatus(
        request,
        approverToken,
        created.id,
        'PUBLISHED',
        'Published for the demonstration.',
      )
    }
  }

  return createdLaunches
}

async function login(page, email) {
  await page.getByLabel('Corporate email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Enter the panel' }).click()
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
  'Screenshots are regenerated only when CAPTURE_DEMO=1.',
)

test('generates the demo walkthrough screenshots', async ({ page, request }) => {
  await mkdir(screenshotsDirectory, { recursive: true })
  const launches = await prepareDemoData(request)
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await capture(page, '01-login.png')

  await login(page, 'creator.e2e@adidas.test')
  await expect(page.getByRole('heading', { name: 'Hello, E2E' })).toBeVisible()
  await expect(page.getByText('Adizero Nova Bogota')).toBeVisible()
  await capture(page, '02-creator-overview.png')

  await page.goto('/launches')
  await expect(page.getByRole('heading', { name: 'Launches' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Samba Studio Mexico', exact: true }),
  ).toBeVisible()
  await capture(page, '03-launch-list.png')

  await page.goto('/calendar')
  await expect(page.getByRole('heading', { name: 'Launch calendar' })).toBeVisible()
  await expect(page.getByTitle('Adizero Nova Bogota')).toBeVisible()
  await capture(page, '04-launch-calendar.png')

  await page.goto(`/launches/${launches[0].id}`)
  await expect(page.getByRole('heading', { name: 'Adizero Nova Bogota' })).toBeVisible()
  await capture(page, '05-launch-details.png')

  await page.getByRole('button', { name: 'Sign out' }).click()
  await login(page, 'admin.e2e@adidas.test')
  await page.goto('/users')
  await expect(page.getByRole('heading', { name: 'Users and permissions' })).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: 'Role for admin.e2e@adidas.test' }),
  ).toBeVisible()
  await capture(page, '06-users-permissions.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hello, E2E' })).toBeVisible()
  await capture(page, '07-mobile-admin-overview.png')

  expect(runtimeErrors).toEqual([])
})
