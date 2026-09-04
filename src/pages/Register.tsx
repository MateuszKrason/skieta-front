import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { CURRENCY_BY_LANGUAGE, LANGUAGES, LANGUAGE_LABELS, useLanguage, type Language } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'

export default function Register() {
  const { register } = useAuth()
  const { language: siteLanguage, t } = useLanguage()
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

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Defaults to the language the site was in when Register.tsx mounted (per
  // requirement: "default language = registration language") — freely
  // changeable below, same as currency.
  const [registerLanguage, setRegisterLanguage] = useState<Language>(siteLanguage)
  const [baseCurrency, setBaseCurrency] = useState(CURRENCY_BY_LANGUAGE[siteLanguage])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Suggest the language's usual currency whenever the language picker
  // changes — the currency dropdown right below stays fully user-editable.
  function onLanguageChange(lang: Language) {
    setRegisterLanguage(lang)
    setBaseCurrency(CURRENCY_BY_LANGUAGE[lang])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(
        username,
        email,
        password,
        firstName,
        lastName,
        baseCurrency,
        inviteToken,
        registerLanguage,
        termsAccepted,
      )
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

  if (!inviteToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <AuthTopBar />
        <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
          <h1 className="mb-1 flex items-center justify-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-8 w-8" />
            skieta
          </h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {t('Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika — poproś o link lub zeskanuj kod QR.')}
          </p>
          <Link to="/logowanie" className="mt-6 inline-block font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Masz już konto? Zaloguj się')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('Załóż konto i zacznij śledzić swój majątek')}</p>
        <div className="mb-3 flex gap-3">
          <label className="block flex-1 text-sm">
            {t('Imię')}
            <input
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="block flex-1 text-sm">
            {t('Nazwisko')}
            <input
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="mb-3 block text-sm">
          {t('Login')}
          <input
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="mb-3 block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mb-3 block text-sm">
          {t('Hasło')}
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label className="mb-3 block text-sm">
          {t('Język interfejsu')}
          <select
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={registerLanguage}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 block text-sm">
          {t('Domyślna waluta')}
          <select
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
          >
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
            {t('Konta w innej walucie będą oznaczone jako walutowe — to tylko etykieta, nie wpływa na przeliczenia.')}
          </span>
        </label>
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
          {submitting ? t('Tworzenie konta…') : t('Zarejestruj się')}
        </button>
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
