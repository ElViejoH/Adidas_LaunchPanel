import { expect, test } from '@playwright/test'

const profiles = [
  { label: 'Creator', email: 'creator.e2e@adidas.test' },
  { label: 'Approver', email: 'approver.e2e@adidas.test' },
  { label: 'Administrator', email: 'admin.e2e@adidas.test' },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

test('all profiles always start on the overview', async ({ page }) => {
  for (const profile of profiles) {
    await test.step(profile.label, async () => {
      await page.goto('/calendar')
      await expect(page).toHaveURL(/\/login$/)

      await page.getByLabel('Corporate email').fill(profile.email)
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: 'Enter the panel' }).click()

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: 'Sign out' }).click()
      await expect(page).toHaveURL(/\/login$/)
    })
  }
})
