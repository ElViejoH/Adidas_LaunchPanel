import { expect, test } from '@playwright/test'

const launchName = 'E2E Adizero Bogota'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

async function login(page, email) {
  await page.getByLabel('Corporate email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Enter the panel' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

async function confirmTransition(page, label, comment, { assertRequired = false } = {}) {
  await page.getByRole('button', { name: label, exact: true }).click()
  const dialog = page.getByRole('dialog')
  const commentField = dialog.getByRole('textbox', { name: /comment/i })
  if (assertRequired) {
    await dialog.getByRole('button', { name: label, exact: true }).click()
    await expect(dialog.getByRole('alert')).toContainText('Explain the reason')
  }
  await commentField.fill(comment)
  await dialog.getByRole('button', { name: label, exact: true }).click()
  await expect(dialog).not.toBeVisible()
}

test('creator and approver complete the critical publication workflow', async ({ page }) => {
  await page.goto('/launches')
  await expect(page).toHaveURL(/\/login$/)

  await login(page, 'creator.e2e@adidas.test')
  await expect(page).toHaveURL('/')

  await page.getByRole('link', { name: 'Create launch' }).click()
  await page.getByLabel('Launch name').fill(launchName)
  await page.getByLabel('Description').fill('Complete workflow validated by Playwright.')
  await page.getByLabel('Market').fill('Colombia')
  await page.getByLabel('Launch date').fill('2031-08-15')
  await page.getByRole('button', { name: 'Create draft' }).click()

  await expect(page.getByRole('heading', { name: launchName })).toBeVisible()
  const detailUrl = page.url()
  expect(detailUrl).toMatch(/\/launches\/\d+$/)

  await page.getByLabel('Name', { exact: true }).fill('E2E key visual')
  await page.getByLabel('Type').selectOption('IMAGE')
  await page.getByLabel('URL').fill('https://assets.example.test/e2e-key-visual.jpg')
  await page.getByRole('button', { name: 'Add asset' }).click()
  await expect(page.getByText('E2E key visual')).toBeVisible()

  await confirmTransition(page, 'Submit for review', 'Materials are ready for E2E approval.')
  await expect(page.getByText('In review', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await login(page, 'approver.e2e@adidas.test')

  await page.goto(detailUrl)
  await expect(page.getByRole('heading', { name: launchName })).toBeVisible()
  await confirmTransition(
    page,
    'Request changes',
    'Replace the key visual before approval.',
    { assertRequired: true },
  )
  await expect(page.getByText('Changes requested', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Replace the key visual before approval.')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await login(page, 'creator.e2e@adidas.test')
  await page.goto(detailUrl)
  await confirmTransition(page, 'Reopen as draft', 'I will apply the approver feedback.')
  await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByLabel('Description').fill('Workflow corrected after a change request.')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Workflow corrected after a change request.')).toBeVisible()
  await confirmTransition(page, 'Submit for review', 'Changes applied and ready for another review.')

  await page.getByRole('button', { name: 'Sign out' }).click()
  await login(page, 'approver.e2e@adidas.test')
  await page.goto(detailUrl)
  await confirmTransition(page, 'Approve launch', 'Approved by the E2E scenario.')
  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()

  await confirmTransition(page, 'Publish launch', 'Publication verified from end to end.')
  await expect(page.getByText('Published', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Publication verified from end to end.')).toBeVisible()
})
