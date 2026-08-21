import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { api } from '../../api/client'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime, formatMoney, formatPct } from '../../lib/format'
import type { AllocationRow, CompanyNews, PortfolioAnalytics, Stock } from '../../types'

const PALETTE = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#6366f1']
const MARKET_COLORS: Record<string, string> = { GPW: '#0ea5e9', US: '#059669' }
const MAX_PIE_SLICES = 7

function formatHoldingPeriod(days: number | null, t: (s: string, ...a: (string | number)[]) => string): string {
  if (days === null) return '—'
  if (days < 30) return t('{0} dni', days)
  const months = Math.round(days / 30)
  if (months < 24) return t('{0} mies.', months)
  const years = Math.floor(days / 365)
  const remMonths = Math.round((days % 365) / 30)
  return remMonths > 0 ? t('{0} lat {1} mies.', years, remMonths) : t('{0} lat', years)
}

function PortfolioAnalyticsSection() {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-analytics'],
    queryFn: async () => (await api.get<PortfolioAnalytics>('/stocks/portfolio-analytics/')).data,
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Statystyki portfela')}</h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
        {t('Skład, koncentracja i wyniki Twoich pozycji — przeliczone do jednej waluty, żeby dało się je sensownie porównać.')}
      </p>
      {isLoading ? (
        <CardLoader />
      ) : !data || data.allocation.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak wycenionych pozycji w portfelu.')}</p>
      ) : (
        <PortfolioAnalyticsBody data={data} />
      )}
    </div>
  )
}

function PortfolioAnalyticsBody({ data }: { data: PortfolioAnalytics }) {
  const { t } = useLanguage()
  const base = 'PLN'

  const topRows = data.allocation.slice(0, MAX_PIE_SLICES)
  const restRows = data.allocation.slice(MAX_PIE_SLICES)
  const restValue = restRows.reduce((s, r) => s + Number(r.value_base), 0)
  const pieData = [
    ...topRows.map((r) => ({ name: r.stock.ticker, value: Number(r.value_base) })),
    ...(restRows.length > 0 ? [{ name: t('Pozostałe ({0})', restRows.length), value: restValue }] : []),
  ]

  const hhiPct = data.concentration_hhi !== null ? Number(data.concentration_hhi) * 100 : null
  const concentrationLabel =
    hhiPct === null ? null : hhiPct < 15 ? t('bardzo rozproszony') : hhiPct < 30 ? t('zdywersyfikowany') : hhiPct < 50 ? t('umiarkowanie skoncentrowany') : t('mocno skoncentrowany')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
            {t(
              'Wykres pokazuje udział wartości każdej spółki w całym portfelu akcji. Przy każdej pozycji: pierwszy % to jej udział w portfelu, drugi (kolorowy) to zysk/strata na tej pozycji.',
            )}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i < topRows.length ? PALETTE[i % PALETTE.length] : '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value as number, base)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {data.allocation.map((r, i) => (
              <AllocationLine key={r.stock.id} row={r} color={i < MAX_PIE_SLICES ? PALETTE[i % PALETTE.length] : '#94a3b8'} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <MiniStat
            label={t('Koncentracja portfela')}
            value={hhiPct !== null ? `${hhiPct.toFixed(0)}%` : '—'}
            hint={concentrationLabel ?? undefined}
          />
          {data.top_holding && (
            <MiniStat
              label={t('Największa pozycja')}
              value={`${data.top_holding.stock.ticker} — ${formatPct(data.top_holding.pct)}`}
            />
          )}
          <MiniStat
            label={t('Śr. czas trzymania (ważony wartością)')}
            value={formatHoldingPeriod(data.avg_days_held, t)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{t('Podział wg rynku')}</p>
          {data.by_market.map((row) => (
            <BreakdownBar key={row.market} label={row.market} pct={Number(row.pct)} color={MARKET_COLORS[row.market] ?? '#94a3b8'} />
          ))}
        </div>
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{t('Podział wg waluty')}</p>
          {data.by_currency.map((row, i) => (
            <BreakdownBar key={row.currency} label={row.currency} pct={Number(row.pct)} color={PALETTE[i % PALETTE.length]} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Na plusie / na minusie / bez zmian')}</p>
          <p className="mt-1 text-sm font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">{data.winners_count}</span>
            {' / '}
            <span className="text-red-600 dark:text-red-400">{data.losers_count}</span>
            {' / '}
            <span className="text-slate-500 dark:text-slate-400">{data.flat_count}</span>
          </p>
        </div>
        <PerformerCard label={t('Najlepsza pozycja')} row={data.best_performer} tone="positive" />
        <PerformerCard label={t('Najgorsza pozycja')} row={data.worst_performer} tone="negative" />
      </div>

      {data.realized_pl_by_year.length > 0 && (
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('Zrealizowany zysk/strata wg roku (po podatku Belki)')}
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.realized_pl_by_year.map((r) => ({ year: r.year, value: Number(r.realized_pl) }))}>
                <Tooltip formatter={(value) => formatMoney(value as number, base)} labelFormatter={(y) => String(y)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.realized_pl_by_year.map((r, i) => (
                    <Cell key={i} fill={Number(r.realized_pl) >= 0 ? '#059669' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
            {t('Suma')}: {formatMoney(data.realized_pl_total, base)}
          </p>
        </div>
      )}
    </div>
  )
}

function AllocationLine({ row, color }: { row: AllocationRow; color: string }) {
  const { t } = useLanguage()
  const plPct = row.unrealized_pl_pct !== null ? Number(row.unrealized_pl_pct) : null
  return (
    <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {row.stock.ticker}
      </span>
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span title={t('Udział tej spółki w wartości całego portfela')}>{formatPct(row.pct)}</span>
        {plPct !== null && (
          <span
            title={t('Zysk/strata (niezrealizowane) na tej pozycji')}
            className={plPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          >
            {formatPct(row.unrealized_pl_pct)}
          </span>
        )}
      </span>
    </div>
  )
}

function BreakdownBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="mb-1.5">
      <div className="mb-0.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

function PerformerCard({ label, row, tone }: { label: string; row: AllocationRow | null; tone: 'positive' | 'negative' }) {
  const { t } = useLanguage()
  return (
    <div
      className={`rounded-lg border p-3 text-center ${tone === 'positive' ? 'border-emerald-100 dark:border-emerald-900' : 'border-red-100 dark:border-red-900'}`}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      {row ? (
        <p className={`mt-1 text-sm font-semibold ${tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.stock.ticker} ({formatPct(row.unrealized_pl_pct)})
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-300 dark:text-slate-600">{t('brak danych')}</p>
      )}
    </div>
  )
}

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

      <PortfolioAnalyticsSection />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value ? Number(e.target.value) : '')}
          className="input w-auto"
        >
          <option value="">{t('Wszystkie spółki')}</option>
          {(stocks ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.ticker} ({s.market})
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
