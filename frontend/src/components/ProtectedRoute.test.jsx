import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderRoute(isAuthenticated) {
  render(
    <AuthContext.Provider value={{ isAuthenticated }}>
      <MemoryRouter initialEntries={['/private']}>
        <LocationProbe />
        <Routes>
          <Route path="/login" element={<h1>Inicio de sesión</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<h1>Contenido privado</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  test('redirige al login cuando no existe una sesión', async () => {
    renderRoute(false)

    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  test('renderiza la ruta privada para una sesión autenticada', () => {
    renderRoute(true)

    expect(screen.getByRole('heading', { name: 'Contenido privado' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/private')
  })
})
