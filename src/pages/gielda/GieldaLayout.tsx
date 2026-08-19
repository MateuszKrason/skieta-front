import { Outlet } from 'react-router-dom'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function GieldaLayout() {
  const { t } = useLanguage()
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/gielda/portfel', label: t('Portfel') },
          { to: '/gielda/dywidendy', label: t('Dywidendy') },
          { to: '/gielda/analiza-spolek', label: t('Analiza spółek') },
        ]}
      />
      <Outlet />
    </div>
  )
}
