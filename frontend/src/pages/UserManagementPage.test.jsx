import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { userService } from '../services/userService'
import { USER_ROLES } from '../utils/constants'
import { UserManagementPage } from './UserManagementPage'

vi.mock('../services/userService', () => ({
  userService: {
    getAll: vi.fn(),
    updateRole: vi.fn(),
  },
}))

const admin = {
  id: 1,
  name: 'Alex Admin',
  email: 'admin@adidas.com',
  role: USER_ROLES.ADMIN,
}
const creator = {
  id: 2,
  name: 'Camila Creator',
  email: 'creator@adidas.com',
  role: USER_ROLES.CREATOR,
}

function renderPage() {
  return render(
    <AuthContext.Provider value={{ user: admin, role: admin.role }}>
      <MemoryRouter>
        <UserManagementPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('UserManagementPage', () => {
  beforeEach(() => {
    userService.getAll.mockResolvedValue([admin, creator])
    userService.updateRole.mockResolvedValue({ ...creator, role: USER_ROLES.APPROVER })
  })

  test('lista usuarios y protege el rol de la cuenta actual', async () => {
    renderPage()

    expect((await screen.findAllByText('creator@adidas.com')).length).toBeGreaterThan(0)
    screen
      .getAllByRole('combobox', { name: 'Rol de admin@adidas.com' })
      .forEach((select) => expect(select).toBeDisabled())
    screen
      .getAllByRole('combobox', { name: 'Rol de creator@adidas.com' })
      .forEach((select) => expect(select).toBeEnabled())
  })

  test('solicita confirmación antes de actualizar un rol', async () => {
    const user = userEvent.setup()
    renderPage()
    const [roleSelect] = await screen.findAllByRole('combobox', { name: 'Rol de creator@adidas.com' })

    await user.selectOptions(roleSelect, USER_ROLES.APPROVER)
    expect(userService.updateRole).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar rol' }))
    expect(userService.updateRole).toHaveBeenCalledWith(creator.id, USER_ROLES.APPROVER)
    expect(await screen.findByText(/ahora tiene el rol Aprobador/)).toBeInTheDocument()
  })
})
