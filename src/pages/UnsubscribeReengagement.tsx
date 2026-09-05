import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { api } from '../api/client'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

// Landing page for the unsubscribe link in the re-engagement email. Behind a
// button rather than firing on mount, same reasoning as CancelDeletion: a
// mail scanner or link prefetcher loading this page must not be able to
// unsubscribe someone who never clicked anything themselves.
export default function UnsubscribeReengagement() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function unsubscribe() {
    setStatus('sending')
    try {
      const { data } = await api.post<{ detail: string }>('/auth/unsubscribe-reengagement/', { token })
      setStatus('ok')
      setMessage(data.detail)
    } catch (err: unknown) {
      setStatus('error')
      const responseData = err instanceof AxiosError ? err.response?.data : null
      const detail =
        responseData && typeof responseData === 'object'
          ? (responseData as Record<string, string>).detail
          : undefined
      setMessage(detail ?? t('Nie udało się wypisać z przypomnień.'))
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

        {!token ? (
          <p className="rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {t('Ten link jest niekompletny. Otwórz go bezpośrednio z maila, który od nas dostałeś.')}
          </p>
        ) : status === 'ok' ? (
          <>
            <p className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
              {message}
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              {t('Wróć do skieta →')}
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('Wypisać z przypomnień e-mail?')}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('Przestaniemy wysyłać e-maile z przypomnieniem, gdy dawno się nie logowałeś/aś. Możesz to zmienić w każdej chwili w ustawieniach konta.')}
            </p>
            {status === 'error' && (
              <p className="mt-3 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                {message}
              </p>
            )}
            <button
              type="button"
              onClick={unsubscribe}
              disabled={status === 'sending'}
              className="btn-primary mt-5 w-full disabled:opacity-60"
            >
              {status === 'sending' ? t('Wypisywanie…') : t('Tak, wypisz mnie')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
