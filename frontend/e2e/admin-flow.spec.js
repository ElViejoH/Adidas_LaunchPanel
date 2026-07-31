import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adidas-launch-panel.language', 'en')
  })
})

async function login(page, email) {
  await page.goto('/login')
  await page.getByLabel('Corporate email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Enter the panel' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

test('administrator changes an account role while protecting their own access', async ({ page }) => {
  await login(page, 'admin.e2e@adidas.test')
  await page.getByRole('link', { name: 'Users and permissions' }).click()
  await expect(page).toHaveURL(/\/users$/)

  await expect(page.getByRole('combobox', { name: 'Role for admin.e2e@adidas.test' })).toBeDisabled()
  await page
    .getByRole('combobox', { name: 'Role for managed.e2e@adidas.test' })
    .selectOption('APPROVER')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('managed.e2e@adidas.test')
  await dialog.getByRole('button', { name: 'Save role' }).click()
  await expect(page.getByRole('status')).toContainText('now has the Approver role')

  await page.getByRole('button', { name: 'Sign out' }).click()
  await login(page, 'managed.e2e@adidas.test')
  await expect(page.getByRole('banner').getByText('Approver')).toBeVisible()
  await expect(page.getByRole('banner').getByText('E2E Managed User')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Users and permissions' })).toHaveCount(0)
})
