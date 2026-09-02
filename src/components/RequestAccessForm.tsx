import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent, type ConversionSource } from '../lib/analytics'

// Registration is invite-only, so this is the only way in for someone who
// arrived without an invitation - notably anyone landing on an article from
// a search engine. Lives here rather than inside Landing so both the landing
// hero and the end of every article can offer the same path.
export default function RequestAccessForm({
  variant = 'inline',
  source,
  article,
}: {
  variant?: 'inline' | 'prominent'
  /** Reported to analytics so an article's conversions can be told apart from
   * the landing page's. Never sent with the email address. */
  source: ConversionSource
  article?: string
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(variant === 'prominent')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/access-requests/', { email }),
    onSuccess: () => {
      setSent(true)
      trackEvent('access_request_submitted', { source, ...(article ? { article } : {}) })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    mutation.mutate()
  }

  const errorDetail = (mutation.error as { response?: { data?: { detail?: string; email?: string } } } | undefined)
    ?.response?.data
  const errorMessage = errorDetail?.detail ?? errorDetail?.email

  if (sent) {
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        {t('Dziękujemy! Sprawdź skrzynkę e-mail — napiszemy, gdy administrator rozpatrzy Twoją prośbę.')}
      </p>
    )
  }

  if (!open) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika.')}{' '}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
        >
          {t('Nie masz zaproszenia? Poproś o dostęp →')}
        </button>
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-2">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('Twój adres e-mail')}
          required
          className="rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-accent-500 focus:outline-none"
        />
        {errorMessage && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-full bg-slate-900 dark:bg-slate-100 px-5 py-2 text-sm font-semibold text-white dark:text-slate-900 transition hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? t('Wysyłanie…') : t('Poproś o dostęp')}
      </button>
    </form>
  )
}
