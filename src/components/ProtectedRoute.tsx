import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageLoader } from './Loader'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/logowanie" replace />
  }

  return <Outlet />
}
