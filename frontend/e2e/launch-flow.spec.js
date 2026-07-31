import { expect, test } from '@playwright/test'

const launchName = 'E2E Adizero Bogotá'

async function login(page, email) {
  await page.getByLabel('Correo corporativo').fill(email)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar al panel' }).click()
  await expect(page).not.toHaveURL(/\/login$/)
}

async function confirmTransition(page, label, comment, { assertRequired = false } = {}) {
  await page.getByRole('button', { name: label, exact: true }).click()
  const dialog = page.getByRole('dialog')
  const commentField = dialog.getByRole('textbox', { name: /Comentario/ })
  if (assertRequired) {
    await dialog.getByRole('button', { name: label, exact: true }).click()
    await expect(dialog.getByRole('alert')).toContainText('Explica el motivo')
  }
  await commentField.fill(comment)
  await dialog.getByRole('button', { name: label, exact: true }).click()
  await expect(dialog).not.toBeVisible()
}

test('creador y aprobador completan el flujo crítico de publicación', async ({ page }) => {
  await page.goto('/launches')
  await expect(page).toHaveURL(/\/login$/)

  await login(page, 'creator.e2e@adidas.test')
  await expect(page).toHaveURL('/')

  await page.getByRole('link', { name: 'Crear lanzamiento' }).click()
  await page.getByLabel('Nombre del lanzamiento').fill(launchName)
  await page.getByLabel('Descripción').fill('Flujo completo validado por Playwright.')
  await page.getByLabel('Mercado').fill('Colombia')
  await page.getByLabel('Fecha de lanzamiento').fill('2031-08-15')
  await page.getByRole('button', { name: 'Crear borrador' }).click()

  await expect(page.getByRole('heading', { name: launchName })).toBeVisible()
  const detailUrl = page.url()
  expect(detailUrl).toMatch(/\/launches\/\d+$/)

  await page.getByLabel('Nombre', { exact: true }).fill('Key visual E2E')
  await page.getByLabel('Tipo').selectOption('IMAGE')
  await page.getByLabel('URL').fill('https://assets.example.test/e2e-key-visual.jpg')
  await page.getByRole('button', { name: 'Agregar activo' }).click()
  await expect(page.getByText('Key visual E2E')).toBeVisible()

  await confirmTransition(page, 'Enviar a revisión', 'Materiales listos para aprobación E2E.')
  await expect(page.getByText('En revisión', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await login(page, 'approver.e2e@adidas.test')

  await page.goto(detailUrl)
  await expect(page.getByRole('heading', { name: launchName })).toBeVisible()
  await confirmTransition(
    page,
    'Solicitar cambios',
    'Reemplazar el key visual antes de aprobar.',
    { assertRequired: true },
  )
  await expect(page.getByText('Cambios solicitados', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Reemplazar el key visual antes de aprobar.')).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await login(page, 'creator.e2e@adidas.test')
  await page.goto(detailUrl)
  await confirmTransition(page, 'Reabrir como borrador', 'Aplicaré el feedback del aprobador.')
  await expect(page.getByText('Borrador', { exact: true }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Editar' }).click()
  await page.getByLabel('Descripción').fill('Flujo corregido después de una solicitud de cambios.')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Flujo corregido después de una solicitud de cambios.')).toBeVisible()
  await confirmTransition(page, 'Enviar a revisión', 'Cambios aplicados y listos para nueva revisión.')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await login(page, 'approver.e2e@adidas.test')
  await page.goto(detailUrl)
  await confirmTransition(page, 'Aprobar lanzamiento', 'Aprobado por el escenario E2E.')
  await expect(page.getByText('Aprobado', { exact: true }).first()).toBeVisible()

  await confirmTransition(page, 'Publicar lanzamiento', 'Publicación verificada de extremo a extremo.')
  await expect(page.getByText('Publicado', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Publicación verificada de extremo a extremo.')).toBeVisible()
})
