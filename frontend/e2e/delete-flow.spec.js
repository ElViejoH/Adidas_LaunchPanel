import { expect, test } from '@playwright/test'

const deletableLaunchName = 'E2E draft for deletion'
const protectedLaunchName = 'E2E launch in review'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

async function loginAsCreator(page) {
  await page.goto('/launches')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Corporate email').fill('creator.e2e@adidas.test')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Enter the panel' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/launches')
}

async function createDraft(page, { name, date }) {
  await page.getByRole('link', { name: 'New launch' }).first().click()
  await page.getByLabel('Launch name').fill(name)
  await page.getByLabel('Description').fill('Isolated data used to validate deletion with Playwright.')
  await page.getByLabel('Market').fill('Colombia')
  await page.getByLabel('Launch date').fill(date)
  await page.getByRole('button', { name: 'Create draft' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()

  const match = page.url().match(/\/launches\/(\d+)$/)
  expect(match).not.toBeNull()
  return match[1]
}

test('creator confirms draft deletion and the launch disappears', async ({ page }) => {
  await loginAsCreator(page)
  const launchId = await createDraft(page, {
    name: deletableLaunchName,
    date: '2032-05-20',
  })

  const openDeleteDialog = page.getByRole('button', { name: 'Delete', exact: true })
  await openDeleteDialog.click()

  const dialog = page.getByRole('dialog', { name: 'Delete launch' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(`“${deletableLaunchName}” will be deleted`)
  await expect(dialog).toContainText('You can delete it while it is a draft or in review.')

  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: deletableLaunchName })).toBeVisible()

  await openDeleteDialog.click()
  const deleteResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'DELETE'
      && url.pathname === `/api/launches/${launchId}`
    )
  })
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()

  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.status()).toBe(200)
  await expect(page).toHaveURL(/\/launches$/)

  await page.getByRole('searchbox', { name: 'Search' }).fill(deletableLaunchName)
  await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()
  await expect(page.getByRole('link', { name: deletableLaunchName, exact: true })).toHaveCount(0)
})

test('creator can edit and delete an owned launch while it is in review', async ({
  page,
}) => {
  await loginAsCreator(page)
  const launchId = await createDraft(page, {
    name: protectedLaunchName,
    date: '2032-06-18',
  })

  await page.getByRole('button', { name: 'Submit for review', exact: true }).click()
  const reviewDialog = page.getByRole('dialog', { name: 'Submit for review' })
  await reviewDialog
    .getByRole('textbox', { name: 'Optional comment' })
    .fill('Launch ready for review.')
  await reviewDialog.getByRole('button', { name: 'Submit for review', exact: true }).click()

  await expect(reviewDialog).not.toBeVisible()
  await expect(page.getByText('In review', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible()

  const updatedName = `${protectedLaunchName} edited`
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await expect(page).toHaveURL(`/launches/${launchId}/edit`)
  await page.getByLabel('Launch name').fill(updatedName)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()

  await expect(page).toHaveURL(`/launches/${launchId}`)
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible()
  await expect(page.getByText('In review', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete launch' })
  await expect(dialog).toContainText('You can delete it while it is a draft or in review.')
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page).toHaveURL(/\/launches$/)

  await page.getByRole('searchbox', { name: 'Search' }).fill(updatedName)
  await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()
})
