import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

// Landing page for the "Zatrzymaj usuwanie konta" link in the deletion email.
// Deliberately behind a button rather than firing on mount like VerifyEmail
// does: mail scanners and link prefetchers follow links on their own, and
// nobody should find their deletion quietly called off by their employer's
// spam filter.
export default function CancelDeletion() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function cancelDeletion() {
    setStatus('sending')
    try {
      const { data } = await api.post<{ detail: string }>('/auth/cancel-deletion/', { uid, token })
      setStatus('ok')
      setMessage(data.detail)
    } catch (err: unknown) {
      setStatus('error')
      const responseData = err instanceof AxiosError ? err.response?.data : null
      const detail =
        responseData && typeof responseData === 'object'
          ? (responseData as Record<string, string>).detail
          : undefined
      setMessage(detail ?? t('Nie udało się zatrzymać usuwania konta.'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
        <h1 className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-8 w-8" />
          skieta
        </h1>

        {!uid || !token ? (
          <p className="rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {t('Ten link jest niekompletny. Otwórz go bezpośrednio z maila, który od nas dostałeś.')}
          </p>
        ) : status === 'ok' ? (
          <>
            <p className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
              {message}
            </p>
            <Link
              to="/logowanie"
              className="mt-6 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              {t('Zaloguj się →')}
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('Zatrzymać usuwanie konta?')}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t(
                'Twoje konto jest w trakcie usuwania. Jeśli klikniesz poniżej, odblokujemy je razem ze wszystkimi danymi i będziesz mógł znowu się zalogować.',
              )}
            </p>
            {status === 'error' && (
              <p className="mt-3 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                {message}
              </p>
            )}
            <button
              type="button"
              onClick={cancelDeletion}
              disabled={status === 'sending'}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {status === 'sending' ? t('Przywracanie…') : t('Tak, zatrzymaj usuwanie')}
            </button>
            <Link
              to="/"
              className="mt-4 inline-block text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
            >
              {t('Nie, chcę usunąć konto')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
