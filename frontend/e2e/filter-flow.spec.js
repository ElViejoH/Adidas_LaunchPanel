import { expect, test } from '@playwright/test'

const apiUrl = 'http://127.0.0.1:4100/api'
const creatorCredentials = {
  email: 'creator.e2e@adidas.test',
  password: 'password123',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

async function authenticateCreator(request) {
  const response = await request.post(`${apiUrl}/auth/login`, {
    data: creatorCredentials,
  })

  expect(response).toBeOK()
  const payload = await response.json()
  return payload.data.token
}

async function createLaunch(request, token, data) {
  const response = await request.post(`${apiUrl}/launches`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  })

  expect(response).toBeOK()
  const payload = await response.json()
  return payload.data
}

async function moveToReview(request, token, launchId) {
  const response = await request.patch(`${apiUrl}/launches/${launchId}/status`, {
    data: {
      newStatus: 'IN_REVIEW',
      comment: 'Ready to validate the status filter.',
    },
    headers: { Authorization: `Bearer ${token}` },
  })

  expect(response).toBeOK()
}

async function login(page) {
  await page.goto('/launches')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Corporate email').fill(creatorCredentials.email)
  await page.getByLabel('Password').fill(creatorCredentials.password)
  await page.getByRole('button', { name: 'Enter the panel' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/launches')
}

test('filters launches by text, market, status, and date range', async ({
  page,
  request,
}, testInfo) => {
  const runId = `${Date.now()}-${testInfo.workerIndex}`
  const sharedPrefix = `Filters ${runId}`
  const launches = {
    textMatch: {
      name: `${sharedPrefix} Solar Runner`,
      description: 'Exclusive match for the E2E search.',
      market: 'Colombia',
      launchDate: '2032-03-12T12:00:00.000Z',
    },
    marketMismatch: {
      name: `${sharedPrefix} Mexico Rival`,
      description: 'Control record for the market filter.',
      market: 'Mexico',
      launchDate: '2032-03-18T12:00:00.000Z',
    },
    reviewMatch: {
      name: `${sharedPrefix} Review Candidate`,
      description: 'Control record for the status filter.',
      market: 'Colombia',
      launchDate: '2032-04-10T12:00:00.000Z',
    },
    dateMismatch: {
      name: `${sharedPrefix} Future Control`,
      description: 'Control record outside the date range.',
      market: 'Colombia',
      launchDate: '2033-01-05T12:00:00.000Z',
    },
  }

  const token = await authenticateCreator(request)
  const created = {}
  for (const [key, launch] of Object.entries(launches)) {
    created[key] = await createLaunch(request, token, launch)
  }
  await moveToReview(request, token, created.reviewMatch.id)

  await login(page)

  const search = page.getByRole('searchbox', { name: 'Search' })
  const market = page.getByLabel('Market').first()
  const status = page.getByLabel('Status').first()
  const from = page.getByLabel('From', { exact: true })
  const to = page.getByLabel('To', { exact: true })
  const launchLink = (name) => page.getByRole('link', { name, exact: true })

  await search.fill(`${sharedPrefix} Solar`)
  await expect(page).toHaveURL(new RegExp(`search=Filters(?:\\+|%20)${runId}`))
  await expect(launchLink(launches.textMatch.name)).toBeVisible()
  await expect(launchLink(launches.marketMismatch.name)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(search).toHaveValue('')
  await expect(page).toHaveURL(/\/launches$/)

  await market.fill('Colombia')
  await expect(page).toHaveURL(/market=Colombia/)
  await expect(launchLink(launches.textMatch.name)).toBeVisible()
  await expect(launchLink(launches.marketMismatch.name)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(market).toHaveValue('')
  await expect(page).toHaveURL(/\/launches$/)

  await status.selectOption('IN_REVIEW')
  await expect(page).toHaveURL(/status=IN_REVIEW/)
  await expect(launchLink(launches.reviewMatch.name)).toBeVisible()
  await expect(launchLink(launches.textMatch.name)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(status).toHaveValue('')

  await from.fill('2032-03-01')
  await to.fill('2032-03-31')
  await expect(page).toHaveURL(/from=2032-03-01/)
  await expect(page).toHaveURL(/to=2032-03-31/)
  await expect(launchLink(launches.textMatch.name)).toBeVisible()
  await expect(launchLink(launches.marketMismatch.name)).toBeVisible()
  await expect(launchLink(launches.reviewMatch.name)).toHaveCount(0)
  await expect(launchLink(launches.dateMismatch.name)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(from).toHaveValue('')
  await expect(to).toHaveValue('')
  await expect(page).toHaveURL(/\/launches$/)
  await expect(launchLink(launches.textMatch.name)).toBeVisible()

  await search.fill(`${sharedPrefix} no matches`)
  await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()
  await expect(launchLink(launches.textMatch.name)).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(search).toHaveValue('')
  await expect(page).toHaveURL(/\/launches$/)
  await expect(launchLink(launches.textMatch.name)).toBeVisible()
})
