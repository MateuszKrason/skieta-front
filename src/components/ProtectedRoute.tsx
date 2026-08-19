import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
