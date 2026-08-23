import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'
import type { AccessRequest } from '../../types'

const TABS: { key: AccessRequest['status']; label: string }[] = [
  { key: 'pending', label: 'Oczekujące' },
  { key: 'accepted', label: 'Zaakceptowane' },
  { key: 'rejected', label: 'Odrzucone' },
]

export default function AdminAccessRequests() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<AccessRequest['status']>('pending')
  const [percent, setPercent] = useState('20')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-access-requests', tab],
    queryFn: async () =>
      (await api.get<AccessRequest[]>('/auth/admin/access-requests/', { params: { status: tab } })).data,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-access-requests'] })
    // Accepting/rejecting moves a request off status='pending', which
    // affects the nav badge's count too (AdminNotificationCountsView).
    queryClient.invalidateQueries({ queryKey: ['admin-notification-counts'] })
  }

  const accept = useMutation({
    mutationFn: (id: number) => api.post(`/auth/admin/access-requests/${id}/accept/`),
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: (id: number) => api.post(`/auth/admin/access-requests/${id}/reject/`),
    onSuccess: invalidate,
  })

  const acceptPercent = useMutation({
    mutationFn: () => api.post('/auth/admin/access-requests/accept-percent/', { percent: Number(percent) }),
    onSuccess: (res) => {
      invalidate()
      window.alert(t('Zaakceptowano {0} z {1} oczekujących próśb.', String(res.data.accepted_count), String(res.data.total_pending)))
    },
  })

  return (
    <div className="space-y-6">
      {tab === 'pending' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('Zaakceptuj losowy procent oczekujących')}
          </h2>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            {t('Przydatne przy stopniowym otwieraniu dostępu — zamiast rozpatrywać każdą prośbę osobno.')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="input w-24"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
            <button
              onClick={() => acceptPercent.mutate()}
              disabled={acceptPercent.isPending}
              className="btn-primary"
            >
              {t('Zaakceptuj')}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === tb.key
                  ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t(tb.label)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
        ) : (requests ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak próśb w tej kategorii.')}</p>
        ) : (
          <ul className="space-y-2">
            {(requests ?? []).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{r.email}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {r.status === 'pending'
                      ? t('Otrzymano {0}', formatDateTime(r.created_at))
                      : t('{0} przez {1}, {2}', r.status === 'accepted' ? t('Zaakceptowano') : t('Odrzucono'), r.decided_by ?? '—', formatDateTime(r.decided_at))}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => accept.mutate(r.id)}
                      disabled={accept.isPending || reject.isPending}
                      className="rounded-md border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                    >
                      {t('Akceptuj')}
                    </button>
                    <button
                      onClick={() => reject.mutate(r.id)}
                      disabled={accept.isPending || reject.isPending}
                      className="rounded-md border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {t('Odrzuć')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
