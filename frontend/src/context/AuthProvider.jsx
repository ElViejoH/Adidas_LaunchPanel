import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { SESSION_STORAGE_KEY } from '../utils/constants'
import { AuthContext } from './AuthContext'

function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY))
    if (!stored?.token || !stored?.user) return null
    return stored
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('alp:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('alp:unauthorized', handleUnauthorized)
  }, [logout])

  const login = useCallback(async (credentials) => {
    setIsLoggingIn(true)
    try {
      const nextSession = await authService.login(credentials)
      if (!nextSession?.token || !nextSession?.user) {
        throw new Error('La API no devolvió una sesión válida.')
      }
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
      return nextSession
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      role: session?.user?.role ?? null,
      isAuthenticated: Boolean(session?.token && session?.user),
      isLoggingIn,
      login,
      logout,
    }),
    [isLoggingIn, login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
