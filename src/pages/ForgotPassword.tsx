import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

export default function ForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post<{ detail: string }>('/auth/password-reset/', { email })
      setMessage(data.detail)
    } catch {
      setMessage(t('Jeśli podany adres e-mail istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          Skieta
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('Podaj adres e-mail przypisany do konta — wyślemy link do resetu hasła.')}</p>
        {message ? (
          <p className="rounded-md bg-accent-50 dark:bg-accent-900/30 px-3 py-2 text-sm text-accent-800 dark:text-accent-300">{message}</p>
        ) : (
          <>
            <label className="mb-4 block text-sm">
              {t('Adres e-mail')}
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-accent-600 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            >
              {submitting ? t('Wysyłanie…') : t('Wyślij link do resetu')}
            </button>
          </>
        )}
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('← Powrót do logowania')}
          </Link>
        </p>
      </form>
    </div>
  )
}
