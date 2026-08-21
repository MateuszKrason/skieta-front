import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageLoader } from './Loader'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    // The app root doubles as a marketing landing page for logged-out
    // visitors instead of bouncing them straight to the login form; any
    // other deep link still goes to /login as before.
    return <Navigate to={location.pathname === '/' ? '/witaj' : '/login'} replace />
  }

  return <Outlet />
}
