import { useEffect, useState } from 'react'
import { DEMO_BLOCKED_EVENT } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'
import { formatDateTime } from '../lib/format'

const BLOCKED_MESSAGE_MS = 5000

/** Always on screen in the demo: a visitor must know whose data this is and what happens to their changes. */
export default function DemoBanner() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [blockedCode, setBlockedCode] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    function onBlocked(event: Event) {
      setBlockedCode((event as CustomEvent<string>).detail)
      clearTimeout(timer)
      timer = setTimeout(() => setBlockedCode(null), BLOCKED_MESSAGE_MS)
    }
    window.addEventListener(DEMO_BLOCKED_EVENT, onBlocked)
    return () => {
      window.removeEventListener(DEMO_BLOCKED_EVENT, onBlocked)
      clearTimeout(timer)
    }
  }, [])

  // Logging out of a private copy also erases it on the server. A full page load rather than navigate(): the
  // logged-out state would reach the protected page first and bounce the visitor to /logowanie instead.
  function leaveTo(path: string) {
    logout()
    window.location.assign(path)
  }

  let message
  if (blockedCode === 'demo_disabled') {
    message = t('Ta funkcja nie działa w wersji demo. Załóż własne konto, żeby z niej skorzystać.')
  } else if (blockedCode) {
    message = t('Tej zmiany nie zapisaliśmy - to konto demonstracyjne. Załóż własne konto, żeby prowadzić swoje finanse.')
  } else if (!user?.demo_read_only && user?.demo_expires_at) {
    message = t(
      'To Twoja prywatna kopia demo: dodawaj, zmieniaj i usuwaj do woli - nikt inny jej nie widzi. Zniknie {0}.',
      formatDateTime(user.demo_expires_at),
    )
  } else {
    message = t('Oglądasz konto demonstracyjne z przykładowymi danymi. Możesz wszystko przeklikać, ale zmiany nie są zapisywane.')
  }

  return (
    <div
      role="status"
      className={`sticky top-0 z-40 border-b px-4 py-2 text-sm transition-colors ${
        blockedCode
          ? 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-100'
          : 'border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-800 dark:bg-accent-950/80 dark:text-accent-100'
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p>{message}</p>
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
