import { expect, test } from '@playwright/test'

test('cambia todo el panel entre español e inglés y conserva la preferencia', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()

  const languageGroup = page.getByRole('group', { name: 'Seleccionar idioma' })
  await expect(languageGroup).toBeVisible()
  await expect.poll(() => languageGroup.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.7')
  await languageGroup.hover()
  await expect.poll(() => languageGroup.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')

  await page.getByRole('button', { name: 'Cambiar a inglés' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Corporate email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page).toHaveTitle('Sign in | Adidas Launch Panel')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('group', { name: 'Select language' })).toBeVisible()

  await page.getByLabel('Corporate email').fill('creator.e2e@adidas.test')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Enter the panel' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Hello, E2E' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Launches', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Calendar', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Select language' })).toBeVisible()

  await page.getByRole('link', { name: 'Calendar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Launch calendar' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  await page.getByRole('button', { name: 'Switch to Spanish' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
})

test('mantiene el selector visible en una pantalla de 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const loginSwitcher = page.getByRole('group', { name: 'Seleccionar idioma' })
  await expect(loginSwitcher).toBeVisible()
  const loginBox = await loginSwitcher.boundingBox()
  expect(loginBox.x + loginBox.width).toBeLessThanOrEqual(320)

  await page.getByLabel('Correo corporativo').fill('creator.e2e@adidas.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar al panel' }).click()

  const panelSwitcher = page.getByRole('group', { name: 'Seleccionar idioma' })
  await expect(panelSwitcher).toBeVisible()
  await expect.poll(async () => {
    const panelBox = await panelSwitcher.boundingBox()
    return panelBox ? panelBox.x + panelBox.width <= 320 : false
  }).toBe(true)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
