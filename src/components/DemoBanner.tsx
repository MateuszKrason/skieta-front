import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_READ_ONLY_EVENT } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'

const BLOCKED_MESSAGE_MS = 5000

/** Always on screen in the demo: a visitor clicking around must never think their changes were kept. */
export default function DemoBanner() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    function onBlocked() {
      setBlocked(true)
      clearTimeout(timer)
      timer = setTimeout(() => setBlocked(false), BLOCKED_MESSAGE_MS)
    }
    window.addEventListener(DEMO_READ_ONLY_EVENT, onBlocked)
    return () => {
      window.removeEventListener(DEMO_READ_ONLY_EVENT, onBlocked)
      clearTimeout(timer)
    }
  }, [])

  function leaveTo(path: string) {
    logout()
    navigate(path)
  }

  return (
    <div
      role="status"
      className={`sticky top-0 z-40 border-b px-4 py-2 text-sm transition-colors ${
        blocked
          ? 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-100'
          : 'border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-800 dark:bg-accent-950/80 dark:text-accent-100'
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p>
          {blocked
            ? t('Tej zmiany nie zapisaliśmy - to konto demonstracyjne. Załóż własne konto, żeby prowadzić swoje finanse.')
            : t('Oglądasz konto demonstracyjne z przykładowymi danymi. Możesz wszystko przeklikać, ale zmiany nie są zapisywane.')}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              trackEvent('register_clicked', { source: 'demo_banner' })
              rememberSignupSource('demo_banner')
              leaveTo('/register')
            }}
            className="rounded-full bg-accent-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-800"
          >
            {t('Załóż własne konto →')}
          </button>
          <button type="button" onClick={() => leaveTo('/')} className="text-xs font-medium hover:underline">
            {t('Wyjdź z demo')}
          </button>
        </div>
      </div>
    </div>
  )
}
