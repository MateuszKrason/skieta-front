import { lazy } from 'react'
import { Link } from 'react-router-dom'
import RequestAccessForm from '../components/RequestAccessForm'
import SockLogo from '../components/SockLogo'
import AuthTopBar from '../components/AuthTopBar'
import { useLanguage } from '../i18n/LanguageContext'

// Dynamic, not a static import: this page is itself lazy-loaded so a
// logged-out visitor's landing bundle stays small (see App.tsx), and a
// static import here would pull recharts and the rest of the calculator
// straight back into whatever chunk loads first. The chunk is shared with
// the logged-in /analiza route, which imports the same module the same way.
const InvestmentCalculator = lazy(() => import('./InvestmentCalculator'))

// The logged-in version of this tool (/analiza) is the single best-tested
// hypothesis for turning an article reader into a registration: it is the
// thing every article's bottom CTA already promises ("kalkulator porównuje
// lokaty, obligacje i giełdę na Twojej kwocie"), and until now nobody could
// actually reach it without an account first. This page is the same
// component with the two account-only extras (custom-company search,
// saved presets - see InvestmentCalculator's `publicMode` prop) stood down,
// wrapped in its own header/footer instead of the logged-in <Layout>.
export default function PublicCalculator() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link to="/logowanie" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zaloguj się')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <InvestmentCalculator publicMode />

        <aside className="mt-8 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('Śledź to na bieżąco, nie tylko dziś')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {t(
              'skieta liczy to samo dla Twojego prawdziwego portfela - konta bankowe, akcje, obligacje i lokaty w jednym miejscu, z zyskiem po podatku Belki. Dostęp jest na zaproszenie - zostaw e-mail, a odezwiemy się.',
            )}
          </p>
          <div className="mt-4">
            <RequestAccessForm variant="prominent" source="calculator" />
          </div>
        </aside>
      </main>
    </div>
  )
}
