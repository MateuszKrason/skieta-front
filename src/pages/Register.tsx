import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'

const INPUT_CLASS =
  'mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none'

export default function Register() {
  const { register } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token') ?? ''

  // Fire-and-forget: records that this link was opened, whether or not the
  // visitor ever submits the form - powers the admin-only invitation funnel
  // report (accounts.services.invitation_funnel_stats). Doesn't affect what
  // renders here either way.
  useEffect(() => {
    if (!inviteToken) return
    api.get('/auth/invitations/check/', { params: { token: inviteToken } }).catch(() => {})
  }, [inviteToken])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Counted once per visit, so "started the form" can be told apart from "finished it" in the analytics.
  const started = useRef(false)
  function markStarted() {
    if (started.current) return
    started.current = true
    trackEvent('register_started')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // The interface language doubles as the account's language; the server picks the currency from it.
      await register({ email, password, language, inviteToken, termsAccepted })
      trackEvent('registered')
      navigate('/onboarding')
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as Record<string, string[]>
        setError(Object.values(data).flat().join(' '))
      } else {
        setError(t('Nie udało się zarejestrować.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <AuthTopBar />
      <form
        onSubmit={onSubmit}
        onFocus={markStarted}
        className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm"
      >
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('Załóż konto w minutę. Wystarczą e-mail i hasło.')}</p>
        {/* Registration is open to everyone, so an invite is no longer a key
            to the door - but someone who followed one should still see that
            it was recognised, rather than landing on a form identical to the
            one every stranger gets. */}
        {inviteToken && (
          <p className="mb-4 rounded-md border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 px-3 py-2 text-sm text-accent-700 dark:text-accent-400">
            {t('Rejestrujesz się z zaproszenia.')}
          </p>
        )}
        <label className="mb-3 block text-sm" htmlFor="register-email">
          {t('E-mail')}
        </label>
        <input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={`${INPUT_CLASS} mb-3`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="block text-sm" htmlFor="register-password">
          {t('Hasło')}
        </label>
        <div className="relative">
          {/* new-password lets iPhone and password managers offer a strong password in one tap. */}
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`${INPUT_CLASS} pr-16`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={100}
            aria-describedby="register-password-hint"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 mt-1 px-3 text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
          >
            {showPassword ? t('Ukryj') : t('Pokaż')}
          </button>
        </div>
        <p id="register-password-hint" className="mb-4 mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t('Co najmniej 8 znaków, nie same cyfry.')}
        </p>
        <label className="mb-4 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <span>
            {t('Akceptuję')}{' '}
            <Link to="/regulamin" target="_blank" rel="noopener noreferrer" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
              {t('Regulamin')}
            </Link>{' '}
            {t('i')}{' '}
            <Link to="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
              {t('Politykę prywatności')}
            </Link>
          </span>
        </label>
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !termsAccepted}
          className="w-full rounded-md bg-accent-600 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
        >
          {submitting ? t('Tworzenie konta…') : t('Załóż konto')}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          {t('Imię, język i walutę ustawisz później w ustawieniach konta.')}
        </p>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('Masz już konto?')}{' '}
          <Link to="/logowanie" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zaloguj się')}
          </Link>
        </p>
      </form>
    </div>
  )
}
