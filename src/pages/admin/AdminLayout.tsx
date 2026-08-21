import { Outlet } from 'react-router-dom'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AdminLayout() {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Panel administratora')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('Użytkownicy aplikacji i ich aktywność')}</p>
      </div>
      <SubTabs
        tabs={[
          { to: '/admin/uzytkownicy', label: t('Użytkownicy') },
          { to: '/admin/feedback', label: t('Feedback') },
        ]}
      />
      <Outlet />
    </div>
  )
}
