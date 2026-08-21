import { Outlet } from 'react-router-dom'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function AnalysisLayout() {
  const { t } = useLanguage()
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/analiza/bilans', label: t('Bilans') },
          { to: '/analiza/przychody', label: t('Przychody') },
          { to: '/analiza/wydatki', label: t('Wydatki') },
          { to: '/analiza/kategorie', label: t('Kategorie') },
        ]}
      />
      <Outlet />
    </div>
  )
}
