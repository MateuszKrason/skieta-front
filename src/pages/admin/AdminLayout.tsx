import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AdminLayout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isStaff = !!user?.is_staff
  const canViewStats = isStaff || (user?.profile.permissions.includes('stats.view') ?? false)
  const canManageInvites = isStaff || (user?.profile.permissions.includes('invites.manage') ?? false)

  const tabs = [
    ...(isStaff ? [{ to: '/admin/uzytkownicy', label: t('Użytkownicy') }] : []),
    ...(isStaff ? [{ to: '/admin/prosby-o-dostep', label: t('Prośby o dostęp') }] : []),
    ...(canManageInvites ? [{ to: '/admin/zaproszenia-grupowe', label: t('Zaproszenia grupowe') }] : []),
    ...(isStaff ? [{ to: '/admin/feedback', label: t('Feedback') }] : []),
    ...(canViewStats ? [{ to: '/admin/statystyki', label: t('Statystyki') }] : []),
    ...(isStaff ? [{ to: '/admin/role', label: t('Role') }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Panel administratora')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('Użytkownicy aplikacji i ich aktywność')}</p>
      </div>
      <SubTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
