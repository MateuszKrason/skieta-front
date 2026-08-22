import { Outlet } from 'react-router-dom'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AnalysisLayout() {
  const { t } = useLanguage()
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/budzet/bilans', label: t('Bilans') },
          { to: '/budzet/przychody', label: t('Przychody') },
          { to: '/budzet/wydatki', label: t('Wydatki') },
          { to: '/budzet/kategorie', label: t('Kategorie') },
        ]}
      />
      <Outlet />
    </div>
  )
}
