import { useQuery } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

interface AdminNotificationCounts {
  pending_access_requests: number
  new_feedback: number
}

export default function AdminLayout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isStaff = !!user?.is_staff
  const canViewStats = isStaff || (user?.profile.permissions.includes('stats.view') ?? false)
  const canManageInvites = isStaff || (user?.profile.permissions.includes('invites.manage') ?? false)

  const { data: counts } = useQuery({
    queryKey: ['admin-notification-counts'],
    queryFn: async () => (await api.get<AdminNotificationCounts>('/auth/admin/notification-counts/')).data,
    enabled: isStaff,
    refetchInterval: 60_000,
  })

  const tabs = [
    ...(isStaff ? [{ to: '/admin/uzytkownicy', label: t('Użytkownicy') }] : []),
    ...(isStaff
      ? [{ to: '/admin/prosby-o-dostep', label: t('Prośby o dostęp'), badge: counts?.pending_access_requests }]
      : []),
    ...(canManageInvites ? [{ to: '/admin/zaproszenia-grupowe', label: t('Zaproszenia grupowe') }] : []),
    ...(canManageInvites ? [{ to: '/admin/promocja-startowa', label: t('Promocja na stronie') }] : []),
    ...(isStaff ? [{ to: '/admin/feedback', label: t('Feedback'), badge: counts?.new_feedback }] : []),
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
