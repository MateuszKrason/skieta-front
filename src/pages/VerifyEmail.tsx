import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

export default function VerifyEmail() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('Brak tokenu weryfikacyjnego w linku.'))
      return
    }
    api
      .post<{ detail: string }>('/auth/verify-email/', { token })
      .then(({ data }) => {
        setStatus('ok')
        setMessage(data.detail)
      })
      .catch((err: unknown) => {
        setStatus('error')
        if (err instanceof AxiosError && err.response?.data && typeof err.response.data === 'object') {
          const data = err.response.data as Record<string, string>
          setMessage(data.detail ?? t('Nie udało się potwierdzić adresu e-mail.'))
        } else {
          setMessage(t('Nie udało się potwierdzić adresu e-mail.'))
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
        <h1 className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>
        {status === 'checking' && <p className="text-sm text-slate-500 dark:text-slate-400">{t('Weryfikuję adres e-mail…')}</p>}
        {status === 'ok' && (
          <p className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">{message}</p>
        )}
        {status === 'error' && <p className="rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">{message}</p>}
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
          {t('Przejdź do aplikacji →')}
        </Link>
      </div>
    </div>
  )
}
