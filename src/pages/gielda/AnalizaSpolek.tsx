import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'
import type { CompanyNews, Stock } from '../../types'

export default function AnalizaSpolek() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [stockFilter, setStockFilter] = useState<number | ''>('')
  const [newOnly, setNewOnly] = useState(false)

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await api.get<Stock[]>('/stocks/tickers/')).data,
  })

  const { data: news, isLoading } = useQuery({
    queryKey: ['company-news', stockFilter, newOnly],
    queryFn: async () =>
      (
        await api.get<CompanyNews[]>('/news/', {
          params: {
            ...(stockFilter ? { stock: stockFilter } : {}),
            ...(newOnly ? { new_only: 'true' } : {}),
          },
        })
      ).data,
  })

  const sync = useMutation({
    mutationFn: () => api.post('/news/sync/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-news'] }),
  })

  const deleteNews = useMutation({
    mutationFn: (id: number) => api.delete(`/news/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-news'] }),
  })

  const newCount = (news ?? []).filter((n) => n.is_new).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Analiza spółek')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Komunikaty ESPI/EBI (GPW) i ważne newsy (USA) dla spółek z Twojego portfela — sprawdzane raz dziennie.')}
          </p>
        </div>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
        >
          {sync.isPending ? t('Sprawdzam…') : t('⟳ Sprawdź teraz')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value ? Number(e.target.value) : '')}
          className="input w-auto"
        >
          <option value="">{t('Wszystkie spółki')}</option>
          {(stocks ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.ticker} ({s.market}){s.name && ` - ${s.name}`}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
          {t('Pokaż tylko nowe')} {newCount > 0 && `(${newCount})`}
        </label>
      </div>

      <div className="space-y-2">
        {isLoading && <CardLoader />}
        {(news ?? []).map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
          >
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {item.stock_detail.ticker}
                </span>
                <span className="rounded-full bg-accent-50 dark:bg-accent-900/30 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-400">
                  {item.source}
                </span>
                {item.is_new && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {t('Nowe')}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(item.published_at)}</span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-accent-700 dark:hover:text-accent-400 hover:underline"
              >
                {item.title}
              </a>
            </div>
            <button
              onClick={() => deleteNews.mutate(item.id)}
              className="shrink-0 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              {t('Usuń')}
            </button>
          </div>
        ))}
        {!isLoading && news?.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500">
            {t('Brak komunikatów — kliknij „Sprawdź teraz” albo poczekaj na codzienne automatyczne sprawdzenie.')}
          </p>
        )}
      </div>
    </div>
  )
}
