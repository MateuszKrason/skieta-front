import { Link } from 'react-router-dom'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { useNoindex } from '../lib/useNoindex'

/** Catch-all for any URL that doesn't match a real route. Before this
 * existed, an unmatched path rendered nothing at all (React Router's
 * <Routes> returns null with no match) while the server/CDN still answered
 * with HTTP 200 - a "soft 404" that both looks broken to visitors and
 * confuses search engines. Tagged noindex since Netlify's static SPA
 * fallback can't itself return a real 404 status. */
export default function NotFound() {
  const { t } = useLanguage()
  useNoindex(true)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
        <h1 className="mb-1 flex items-center justify-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>
        <p className="mt-4 text-5xl font-bold text-slate-300 dark:text-slate-600">404</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('Nie znaleźliśmy tej strony.')}</p>
        <Link to="/" className="mt-6 inline-block font-medium text-accent-700 dark:text-accent-400 hover:underline">
          {t('← Strona główna')}
        </Link>
      </div>
    </div>
  )
}
