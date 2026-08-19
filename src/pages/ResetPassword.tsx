import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

export default function ResetPassword() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/auth/password-reset-confirm/', { uid, token, new_password: newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as Record<string, string[] | string>
        setError(Object.values(data).flat().join(' '))
      } else {
        setError(t('Nie udało się zresetować hasła.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          <SockLogo className="h-8 w-8" />
          Skieta
        </h1>
        {!uid || !token ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{t('Link resetu hasła jest niepełny — otwórz go bezpośrednio z wiadomości e-mail.')}</p>
        ) : success ? (
          <p className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
            {t('Hasło zostało zresetowane. Przekierowuję do logowania…')}
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{t('Ustaw nowe hasło do swojego konta.')}</p>
            <label className="mb-4 block text-sm">
              {t('Nowe hasło')}
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t('Zapisywanie…') : t('Ustaw nowe hasło')}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('← Powrót do logowania')}
          </Link>
        </p>
      </div>
    </div>
  )
}
