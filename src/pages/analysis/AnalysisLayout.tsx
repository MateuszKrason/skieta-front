import { Outlet } from 'react-router-dom'
import SubTabs from '../../components/SubTabs'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AnalysisLayout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  // A car costs money like anything else, so it belongs inside the budget
  // rather than beside it. On for everyone by default; the toggle in account
  // settings is there for people with no car to track, not the other way
  // round.
  const showVehicles = user?.profile.interest_vehicles ?? true
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/budzet/bilans', label: t('Bilans') },
          { to: '/budzet/przychody', label: t('Przychody') },
          { to: '/budzet/wydatki', label: t('Wydatki') },
          { to: '/budzet/kategorie', label: t('Kategorie') },
          { to: '/budzet/statystyki', label: t('Statystyki') },
          ...(showVehicles ? [{ to: '/budzet/samochod', label: t('Samochód') }] : []),
        ]}
      />
      <Outlet />
    </div>
  )
}
