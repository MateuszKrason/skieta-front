import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</div>
  }

  if (!user) {
    // The app root doubles as a marketing landing page for logged-out
    // visitors instead of bouncing them straight to the login form; any
    // other deep link still goes to /login as before.
    return <Navigate to={location.pathname === '/' ? '/witaj' : '/login'} replace />
  }

  return <Outlet />
}
