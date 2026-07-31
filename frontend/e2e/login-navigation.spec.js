import { expect, test } from '@playwright/test'

const profiles = [
  { label: 'Creador', email: 'creator.e2e@adidas.test' },
  { label: 'Aprobador', email: 'approver.e2e@adidas.test' },
  { label: 'Administrador', email: 'admin.e2e@adidas.test' },
]

test('todos los perfiles inician siempre en el menú principal', async ({ page }) => {
  for (const profile of profiles) {
    await test.step(profile.label, async () => {
      await page.goto('/calendar')
      await expect(page).toHaveURL(/\/login$/)

      await page.getByLabel('Correo corporativo').fill(profile.email)
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Entrar al panel' }).click()

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: 'Cerrar sesión' }).click()
      await expect(page).toHaveURL(/\/login$/)
    })
  }
})
