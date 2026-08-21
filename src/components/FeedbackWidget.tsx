import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

export default function FeedbackWidget() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.post('/feedback/', { message }),
    onSuccess: () => {
      setSent(true)
      setMessage('')
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    mutation.mutate()
  }

  function close() {
    setOpen(false)
    setSent(false)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Feedback')}</h2>
            <button onClick={close} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              ×
            </button>
          </div>
          {sent ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {t('Dziękujemy za wiadomość! Przeczytamy ją wkrótce.')}
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Co możemy poprawić? Czego brakuje? Napisz śmiało.')}
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="input"
                placeholder={t('Twoja wiadomość…')}
              />
              <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
                {t('Wyślij')}
              </button>
            </form>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('Zostaw feedback')}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg hover:bg-accent-700"
      >
        💬
      </button>
    </div>
  )
}
