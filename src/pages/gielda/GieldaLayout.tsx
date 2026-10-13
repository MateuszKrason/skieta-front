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
          { to: '/gielda/wiadomosci', label: t('Wiadomości') },
          // A Polish tax form: offered to accounts settled in Poland, which is also what a blank residency means.
          ...(['', 'PL'].includes(user?.profile.residency_country ?? '') ? [{ to: '/gielda/pit-38', label: 'PIT-38' }] : []),
          ...(user?.profile.interest_crypto ? [{ to: '/gielda/krypto', label: t('Krypto') }] : []),
        ]}
      />
      <Outlet />
    </div>
  )
}
