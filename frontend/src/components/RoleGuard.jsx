import { useAuth } from '../hooks/useAuth'

export function RoleGuard({ roles, condition = true, fallback = null, children }) {
  const { role } = useAuth()
  const acceptedRoles = Array.isArray(roles) ? roles : roles ? [roles] : []
  const hasRole = acceptedRoles.length === 0 || acceptedRoles.includes(role)

  return hasRole && condition ? children : fallback
}
