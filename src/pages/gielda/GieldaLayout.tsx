import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import SubTabs from '../../components/SubTabs'
import { useLanguage } from '../../i18n/LanguageContext'

export default function GieldaLayout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/gielda/portfel', label: t('Portfel') },
          { to: '/gielda/dywidendy', label: t('Dywidendy') },
          { to: '/gielda/statystyki', label: t('Statystyki portfela') },
          { to: '/gielda/analiza-spolek', label: t('Analiza spółek') },
          ...(user?.profile.interest_crypto ? [{ to: '/gielda/krypto', label: t('Krypto') }] : []),
        ]}
      />
      <Outlet />
    </div>
  )
}
