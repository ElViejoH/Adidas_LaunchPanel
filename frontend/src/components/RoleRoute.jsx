import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function RoleRoute({ roles }) {
  const { role } = useAuth()
  const acceptedRoles = Array.isArray(roles) ? roles : [roles]

  if (!acceptedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
