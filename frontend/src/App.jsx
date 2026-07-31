import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { CalendarPage } from './pages/CalendarPage'
import { DashboardPage } from './pages/DashboardPage'
import { LaunchDetailPage } from './pages/LaunchDetailPage'
import { LaunchFormPage } from './pages/LaunchFormPage'
import { LaunchListPage } from './pages/LaunchListPage'
import { LoginPage } from './pages/LoginPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { USER_ROLES } from './utils/constants'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="launches" element={<LaunchListPage />} />
          <Route path="launches/new" element={<LaunchFormPage />} />
          <Route path="launches/:id" element={<LaunchDetailPage />} />
          <Route path="launches/:id/edit" element={<LaunchFormPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route element={<RoleRoute roles={USER_ROLES.ADMIN} />}>
            <Route path="users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
