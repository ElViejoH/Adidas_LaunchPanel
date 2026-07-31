import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../hooks/useI18n'
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
  const { t } = useI18n()
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

  useEffect(() => {
    const token = session?.token
    if (!token) return undefined
    let active = true

    const syncCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser(token)
        if (!active || !user) return
        setSession((current) => {
          if (current?.token !== token) return current
          const nextSession = { ...current, user }
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
          return nextSession
        })
      } catch {
        // Una falla de red conserva la sesión local. Los 401 ya disparan logout desde apiRequest.
      }
    }

    syncCurrentUser()
    window.addEventListener('focus', syncCurrentUser)
    return () => {
      active = false
      window.removeEventListener('focus', syncCurrentUser)
    }
  }, [session?.token])

  const login = useCallback(async (credentials) => {
    setIsLoggingIn(true)
    try {
      const nextSession = await authService.login(credentials)
      if (!nextSession?.token || !nextSession?.user) {
        const error = new Error(t('apiErrors.INVALID_SESSION'))
        error.code = 'INVALID_SESSION'
        throw error
      }
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
      return nextSession
    } finally {
      setIsLoggingIn(false)
    }
  }, [t])

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
