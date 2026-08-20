import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  if (!user?.is_staff) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
