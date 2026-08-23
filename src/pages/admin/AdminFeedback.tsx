import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'

interface Feedback {
  id: number
  message: string
  status: 'new' | 'done' | 'rejected' | 'later'
  is_important: boolean
  username: string
  created_at: string
}

const STATUS_LABELS: Record<Feedback['status'], string> = {
  new: 'Nowe',
  done: 'Zrobione',
  rejected: 'Odrzucone',
  later: 'Na później',
}

const STATUS_STYLES: Record<Feedback['status'], string> = {
  new: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  done: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  later: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
}

export default function AdminFeedback() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('new')
  const [importantOnly, setImportantOnly] = useState(false)

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-feedback', statusFilter, importantOnly],
    queryFn: async () =>
      (
        await api.get<Feedback[]>('/feedback/', {
          params: { status: statusFilter || undefined, important: importantOnly ? 'true' : undefined },
        })
      ).data,
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Feedback['status'] }) =>
      api.patch(`/feedback/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      // Changing status away from 'new' affects the nav badge's count too
      // (AdminNotificationCountsView counts status='new' feedback).
      queryClient.invalidateQueries({ queryKey: ['admin-notification-counts'] })
    },
  })

  const toggleImportant = useMutation({
    mutationFn: ({ id, is_important }: { id: number; is_important: boolean }) =>
      api.patch(`/feedback/${id}/`, { is_important }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feedback'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Status')}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input mt-1">
            <option value="">{t('wszystkie')}</option>
            {(Object.keys(STATUS_LABELS) as Feedback['status'][]).map((s) => (
              <option key={s} value={s}>
                {t(STATUS_LABELS[s])}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={importantOnly}
            onChange={(e) => setImportantOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          {t('Tylko ważne')}
        </label>
      </div>

      {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>}
      {!isLoading && items?.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak zgłoszeń spełniających kryteria.')}</p>
      )}

      <ul className="space-y-2">
        {(items ?? []).map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border p-4 shadow-sm ${
              item.is_important
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  {item.is_important && (
                    <span className="mr-1.5 text-amber-500" title={t('Ważne')}>
                      ★
                    </span>
                  )}
                  {item.message}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {item.username} • {formatDateTime(item.created_at)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                {t(STATUS_LABELS[item.status])}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => toggleImportant.mutate({ id: item.id, is_important: !item.is_important })}
                disabled={toggleImportant.isPending}
                className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                  item.is_important
                    ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {item.is_important ? `★ ${t('Odznacz ważne')}` : `☆ ${t('Oznacz jako ważne')}`}
              </button>
              {(Object.keys(STATUS_LABELS) as Feedback['status'][])
                .filter((s) => s !== item.status)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus.mutate({ id: item.id, status: s })}
                    disabled={setStatus.isPending}
                    className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    {t('Oznacz jako: {0}', t(STATUS_LABELS[s]))}
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
