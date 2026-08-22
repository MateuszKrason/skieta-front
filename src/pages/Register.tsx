import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

export default function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token') ?? ''
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('PLN')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(username, email, password, firstName, lastName, baseCurrency, inviteToken)
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
            required
          />
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
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
          <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
            {t('Konta w innej walucie będą oznaczone jako walutowe — to tylko etykieta, nie wpływa na przeliczenia.')}
          </span>
        </label>
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
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
