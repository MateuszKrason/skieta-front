import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

export default function Login() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      // A 429 carries a real explanation from the server (too many attempts,
      // and how long to wait). Collapsing it into "wrong password" would send
      // someone off resetting a password that was never the problem.
      //
      // Read the response off the error by shape rather than with
      // `instanceof AxiosError`: under Vite's dependency pre-bundling the
      // class the app imports is not always the same object as the one axios
      // threw, and a failed instanceof here would silently hide every login
      // error, not just the throttled one.
      const response = (err as { response?: { status?: number; data?: unknown } }).response
      const data = response?.data
      const detail =
        typeof data === 'object' && data !== null ? (data as { detail?: string }).detail : undefined
      setError(response?.status === 429 && detail ? detail : t('Nieprawidłowy login lub hasło.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <Link to="/" className="flex items-center gap-2">
            <SockLogo className="h-8 w-8" />
            skieta
          </Link>
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('Zaloguj się do swojego portfela finansowego')}</p>
        <label className="mb-3 block text-sm">
          {t('Login lub e-mail')}
          <input
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="mb-1 block text-sm">
          {t('Hasło')}
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <p className="mb-4 text-right text-xs">
          <Link to="/zapomnialem-hasla" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zapomniałeś hasła?')}
          </Link>
        </p>
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent-600 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
        >
          {submitting ? t('Logowanie…') : t('Zaloguj się')}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('← Strona główna')}
          </Link>
        </p>
      </form>
    </div>
  )
}
