import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { USER_ROLES } from '../utils/constants'
import { RoleRoute } from './RoleRoute'

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderRoleRoute(role) {
  render(
    <AuthContext.Provider value={{ role }}>
      <MemoryRouter initialEntries={['/users']}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<h1>Resumen</h1>} />
          <Route element={<RoleRoute roles={USER_ROLES.ADMIN} />}>
            <Route path="/users" element={<h1>Usuarios y permisos</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RoleRoute', () => {
  test('permite el acceso al rol autorizado', () => {
    renderRoleRoute(USER_ROLES.ADMIN)
    expect(screen.getByRole('heading', { name: 'Usuarios y permisos' })).toBeInTheDocument()
  })

  test('redirige a un usuario con otro rol', async () => {
    renderRoleRoute(USER_ROLES.CREATOR)
    expect(await screen.findByRole('heading', { name: 'Resumen' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
