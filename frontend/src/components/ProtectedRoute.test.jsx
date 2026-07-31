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
          <Route path="/login" element={<h1>Sign in</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<h1>Private content</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  test('redirects to login when no session exists', async () => {
    renderRoute(false)

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  test('renders the private route for an authenticated session', () => {
    renderRoute(true)

    expect(screen.getByRole('heading', { name: 'Private content' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/private')
  })
})
