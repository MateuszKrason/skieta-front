import { Outlet } from 'react-router-dom'
import SubTabs from '../../../components/SubTabs'
import { useLanguage } from '../../../i18n/LanguageContext'

export default function KryptoLayout() {
  const { t } = useLanguage()
  return (
    <div>
      <SubTabs
        tabs={[
          { to: '/gielda/krypto/portfel', label: t('Portfel') },
          { to: '/gielda/krypto/analiza', label: t('Analiza') },
        ]}
      />
      <Outlet />
    </div>
  )
}
