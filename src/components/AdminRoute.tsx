import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  // Staff always get in; a non-staff user with at least one custom-role
  // permission (see the Role/Permission panel) gets in too, but only sees
  // the specific tabs their permissions grant — AdminLayout hides the rest.
  const hasAnyPermission = (user?.profile.permissions.length ?? 0) > 0
  if (!user?.is_staff && !hasAnyPermission) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
