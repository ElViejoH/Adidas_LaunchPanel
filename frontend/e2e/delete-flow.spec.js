import { expect, test } from '@playwright/test'

const deletableLaunchName = 'E2E Borrador para eliminar'
const protectedLaunchName = 'E2E Lanzamiento en revisión'

async function loginAsCreator(page) {
  await page.goto('/launches')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Correo corporativo').fill('creator.e2e@adidas.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar al panel' }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/launches')
}

async function createDraft(page, { name, date }) {
  await page.getByRole('link', { name: 'Nuevo lanzamiento' }).first().click()
  await page.getByLabel('Nombre del lanzamiento').fill(name)
  await page.getByLabel('Descripción').fill('Datos aislados para validar la eliminación con Playwright.')
  await page.getByLabel('Mercado').fill('Colombia')
  await page.getByLabel('Fecha de lanzamiento').fill(date)
  await page.getByRole('button', { name: 'Crear borrador' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()

  const match = page.url().match(/\/launches\/(\d+)$/)
  expect(match).not.toBeNull()
  return match[1]
}

test('el creador confirma la eliminación de su borrador y este desaparece', async ({ page }) => {
  await loginAsCreator(page)
  const launchId = await createDraft(page, {
    name: deletableLaunchName,
    date: '2032-05-20',
  })

  const openDeleteDialog = page.getByRole('button', { name: 'Eliminar', exact: true })
  await openDeleteDialog.click()

  const dialog = page.getByRole('dialog', { name: 'Eliminar lanzamiento' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(`Se eliminará “${deletableLaunchName}”`)
  await expect(dialog).toContainText('Puedes eliminarlo mientras sea borrador o esté en revisión.')

  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
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
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()

  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.status()).toBe(200)
  await expect(page).toHaveURL(/\/launches$/)

  await page.getByRole('searchbox', { name: 'Búsqueda' }).fill(deletableLaunchName)
  await expect(page.getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible()
  await expect(page.getByRole('link', { name: deletableLaunchName, exact: true })).toHaveCount(0)
})

test('el creador puede editar y eliminar su lanzamiento mientras está en revisión', async ({
  page,
}) => {
  await loginAsCreator(page)
  const launchId = await createDraft(page, {
    name: protectedLaunchName,
    date: '2032-06-18',
  })

  await page.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
  const reviewDialog = page.getByRole('dialog', { name: 'Enviar a revisión' })
  await reviewDialog
    .getByRole('textbox', { name: 'Comentario opcional' })
    .fill('Lanzamiento listo para revisar.')
  await reviewDialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()

  await expect(reviewDialog).not.toBeVisible()
  await expect(page.getByText('En revisión', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Editar', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toBeVisible()

  const updatedName = `${protectedLaunchName} editado`
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await expect(page).toHaveURL(`/launches/${launchId}/edit`)
  await page.getByLabel('Nombre del lanzamiento').fill(updatedName)
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click()

  await expect(page).toHaveURL(`/launches/${launchId}`)
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible()
  await expect(page.getByText('En revisión', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar lanzamiento' })
  await expect(dialog).toContainText('Puedes eliminarlo mientras sea borrador o esté en revisión.')
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page).toHaveURL(/\/launches$/)

  await page.getByRole('searchbox', { name: 'Búsqueda' }).fill(updatedName)
  await expect(page.getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible()
})
