import { expect, test } from '@playwright/test'

async function login(page, email) {
  await page.goto('/login')
  await page.getByLabel('Correo corporativo').fill(email)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar al panel' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

test('administrador cambia el rol de una cuenta y protege su propio acceso', async ({ page }) => {
  await login(page, 'admin.e2e@adidas.test')
  await page.getByRole('link', { name: 'Usuarios y permisos' }).click()
  await expect(page).toHaveURL(/\/users$/)

  await expect(page.getByRole('combobox', { name: 'Rol de admin.e2e@adidas.test' })).toBeDisabled()
  await page
    .getByRole('combobox', { name: 'Rol de managed.e2e@adidas.test' })
    .selectOption('APPROVER')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('managed.e2e@adidas.test')
  await dialog.getByRole('button', { name: 'Guardar rol' }).click()
  await expect(page.getByRole('status')).toContainText('ahora tiene el rol Aprobador')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await login(page, 'managed.e2e@adidas.test')
  await expect(page.getByRole('banner').getByText('Aprobador')).toBeVisible()
  await expect(page.getByRole('banner').getByText('E2E Managed User')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Usuarios y permisos' })).toHaveCount(0)
})
