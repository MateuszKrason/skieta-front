import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'

interface Feedback {
  id: number
  message: string
  status: 'new' | 'done' | 'rejected' | 'later'
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

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-feedback', statusFilter],
    queryFn: async () =>
      (await api.get<Feedback[]>('/feedback/', { params: { status: statusFilter || undefined } })).data,
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Feedback['status'] }) =>
      api.patch(`/feedback/${id}/`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-feedback'] }),
  })

  return (
    <div className="space-y-4">
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

      {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>}
      {!isLoading && items?.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak zgłoszeń spełniających kryteria.')}</p>
      )}

      <ul className="space-y-2">
        {(items ?? []).map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">{item.message}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {item.username} • {formatDateTime(item.created_at)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                {t(STATUS_LABELS[item.status])}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
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
