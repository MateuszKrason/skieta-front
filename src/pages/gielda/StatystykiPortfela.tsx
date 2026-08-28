import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { useTooltipStyle } from '../../lib/chartTooltip'
import { formatAxisValue, formatDate, formatMoney, formatPct } from '../../lib/format'
import type { AccountBreakdownRow, AllocationRow, ClosedPosition, ClosedPositions, PortfolioAnalytics } from '../../types'

const PALETTE = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#6366f1']
const MARKET_COLORS: Record<string, string> = { GPW: '#0ea5e9', US: '#059669', EU: '#f59e0b' }
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

type AllocSortKey = 'ticker' | 'pct' | 'unrealized_pl_pct'

function sortAllocation(rows: AllocationRow[], key: AllocSortKey, dir: 'asc' | 'desc'): AllocationRow[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (key === 'ticker') return a.stock.ticker.localeCompare(b.stock.ticker) * factor
    const av = a[key] !== null ? Number(a[key]) : -Infinity
    const bv = b[key] !== null ? Number(b[key]) : -Infinity
    return (av - bv) * factor
  })
}

function PortfolioAnalyticsBody({ data }: { data: PortfolioAnalytics }) {
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const base = 'PLN'
  const [allocSortKey, setAllocSortKey] = useState<AllocSortKey>('pct')
  const [allocSortDir, setAllocSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleAllocSort(key: AllocSortKey) {
    if (allocSortKey === key) {
      setAllocSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setAllocSortKey(key)
      setAllocSortDir('desc')
    }
  }

  const sortedAllocation = sortAllocation(data.allocation, allocSortKey, allocSortDir)

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
                <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, base)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between px-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <button onClick={() => toggleAllocSort('ticker')} className="hover:text-slate-600 dark:hover:text-slate-300">
              {t('Spółka')}{allocSortKey === 'ticker' && (allocSortDir === 'asc' ? ' ▲' : ' ▼')}
            </button>
            <span className="flex items-center gap-2">
              <button
                onClick={() => toggleAllocSort('pct')}
                className="min-w-[56px] text-right hover:text-slate-600 dark:hover:text-slate-300"
              >
                {t('Udział')}{allocSortKey === 'pct' && (allocSortDir === 'asc' ? ' ▲' : ' ▼')}
              </button>
              <button
                onClick={() => toggleAllocSort('unrealized_pl_pct')}
                className="min-w-[56px] text-right hover:text-slate-600 dark:hover:text-slate-300"
              >
                {t('Zysk')}{allocSortKey === 'unrealized_pl_pct' && (allocSortDir === 'asc' ? ' ▲' : ' ▼')}
              </button>
            </span>
          </div>
          <div className="space-y-1">
            {sortedAllocation.map((r) => {
              const rank = topRows.findIndex((tr) => tr.stock.id === r.stock.id)
              return <AllocationLine key={r.stock.id} row={r} color={rank >= 0 ? PALETTE[rank % PALETTE.length] : '#94a3b8'} />
            })}
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
          <MiniStat
            label={t('Podatek Belki przy sprzedaży dziś')}
            value={formatMoney(data.belka_tax_liability, base)}
            hint={t('Ile fiskus zabrałby, gdybyś dziś sprzedał(a) wszystko na plusie.')}
          />
          <MiniStat
            label={t('Dywidendy w tym roku (po Belce)')}
            value={formatMoney(data.dividends_ytd_after_tax, base)}
            hint={t(
              'Brutto: {0} · Łącznie od zawsze: {1} ({2} po Belce)',
              formatMoney(data.dividends_ytd, base),
              formatMoney(data.dividends_all_time, base),
              formatMoney(data.dividends_all_time_after_tax, base),
            )}
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

      {data.by_account.length > 0 && (
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('Podział wg konta maklerskiego')}
          </p>
          <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
            {t('Udział wartości portfela trzymanej na każdym koncie maklerskim. Zysk to zmiana wartości względem wpłaconego kapitału.')}
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.by_account.map((r) => ({ name: r.account_label, value: Number(r.value_base) }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={2}
                >
                  {data.by_account.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, base)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between px-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <span>{t('Konto')}</span>
            <span className="flex items-center gap-2">
              <span className="min-w-[56px] text-right">{t('Udział')}</span>
              <span className="min-w-[56px] text-right">{t('Zysk')}</span>
            </span>
          </div>
          <div className="space-y-1">
            {data.by_account.map((row, i) => (
              <AccountLine key={row.account_id} row={row} color={PALETTE[i % PALETTE.length]} />
            ))}
          </div>
        </div>
      )}

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
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{t('Zrealizowany zysk/strata wg roku')}</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                {t('Zielony/czerwony słupek to zysk lub strata po podatku Belki, bursztynowy to sam podatek — razem dają wynik przed opodatkowaniem.')}
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.realized_pl_by_year.map((r) => ({
                      year: r.year,
                      net: Number(r.realized_pl),
                      tax: Number(r.belka_tax),
                      beforeTax: Number(r.realized_pl_before_tax),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 11 }} stroke="#94a3b8" width={40} />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value, name) => [formatMoney(value as number, base), name]}
                      labelFormatter={(y) => String(y)}
                    />
                    <Bar dataKey="net" name={t('Po Belce')} stackId="pl" radius={[4, 4, 0, 0]}>
                      {data.realized_pl_by_year.map((r, i) => (
                        <Cell key={i} fill={Number(r.realized_pl) >= 0 ? '#059669' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Bar dataKey="tax" name={t('Podatek Belki')} stackId="pl" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                {t('Suma po Belce')}: {formatMoney(data.realized_pl_total, base)} · {t('Suma przed Belką')}:{' '}
                {formatMoney(data.realized_pl_total_before_tax, base)}
              </p>
            </div>
            <div className="space-y-3">
              <MiniStat
                label={t('Zrealizowany zysk w tym roku (przed Belką)')}
                value={formatMoney(
                  data.realized_pl_by_year.find((r) => r.year === new Date().getFullYear())?.realized_pl_before_tax ?? '0',
                  base,
                )}
              />
              <MiniStat
                label={t('Podatek Belki do zapłaty w tym roku')}
                value={formatMoney(data.realized_belka_tax_this_year, base)}
                hint={t('Od transakcji sprzedaży zamkniętych w tym roku podatkowym — nie licząc niezrealizowanych pozycji.')}
              />
            </div>
          </div>
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
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate">
          {row.stock.ticker}
          {row.stock.instrument_type === 'ETF' && (
            <span className="ml-1 rounded-full bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
              ETF
            </span>
          )}
          {row.stock.name && <span className="text-slate-400 dark:text-slate-500"> {row.stock.name}</span>}
        </span>
      </span>
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 tabular-nums">
        <span className="min-w-[56px] text-right" title={t('Udział tej spółki w wartości całego portfela')}>
          {formatPct(row.pct)}
        </span>
        <span
          className={`min-w-[56px] text-right ${
            plPct === null ? '' : plPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}
          title={t('Zysk/strata (niezrealizowane) na tej pozycji')}
        >
          {plPct !== null ? formatPct(row.unrealized_pl_pct) : '—'}
        </span>
      </span>
    </div>
  )
}

function AccountLine({ row, color }: { row: AccountBreakdownRow; color: string }) {
  const { t } = useLanguage()
  const invested = Number(row.invested_base)
  const value = Number(row.value_base)
  const gainPct = invested ? (value / invested - 1) * 100 : null
  return (
    <div className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs">
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate">{row.account_label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400 tabular-nums">
        <span className="min-w-[56px] text-right" title={t('Udział tego konta w wartości całego portfela')}>
          {formatPct(row.pct)}
        </span>
        <span
          className={`min-w-[56px] text-right ${
            gainPct === null ? '' : gainPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}
          title={t('Zmiana wartości względem wpłaconego kapitału na tym koncie')}
        >
          {gainPct !== null ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : '—'}
        </span>
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

function ClosedPositionCard({ label, position, tone }: { label: string; position: ClosedPosition | null; tone: 'positive' | 'negative' }) {
  const { t } = useLanguage()
  return (
    <div
      className={`rounded-lg border p-3 text-center ${tone === 'positive' ? 'border-emerald-100 dark:border-emerald-900' : 'border-red-100 dark:border-red-900'}`}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      {position ? (
        <p className={`mt-1 text-sm font-semibold ${tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {position.stock.ticker} ({formatPct(position.return_pct)})
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-300 dark:text-slate-600">{t('brak danych')}</p>
      )}
    </div>
  )
}

function ClosedPositionsSection() {
  const { t } = useLanguage()
  const base = 'PLN'
  const { data, isLoading } = useQuery({
    queryKey: ['closed-positions'],
    queryFn: async () => (await api.get<ClosedPositions>('/stocks/closed-positions/')).data,
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zamknięte pozycje')}</h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
        {t('Spółki, które sprzedałeś(-aś) w całości przynajmniej raz — z zyskiem lub stratą faktycznie zrealizowanym, po podatku Belki.')}
      </p>
      {isLoading ? (
        <CardLoader />
      ) : !data || data.count === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak jeszcze żadnej w pełni zamkniętej pozycji.')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MiniStat label={t('Zamknięte pozycje')} value={String(data.count)} />
            <MiniStat label={t('Zrealizowany zysk (po Belce)')} value={formatMoney(data.total_realized_pl_after_tax_base, base)} />
            <MiniStat label={t('Śr. stopa zwrotu')} value={data.avg_return_pct !== null ? formatPct(data.avg_return_pct) : '—'} />
            <MiniStat label={t('Win rate')} value={data.win_rate !== null ? `${Number(data.win_rate).toFixed(0)}%` : '—'} />
            <MiniStat label={t('Śr. czas trzymania')} value={formatHoldingPeriod(data.avg_holding_days, t)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ClosedPositionCard label={t('Najlepsza zamknięta pozycja')} position={data.best_position} tone="positive" />
            <ClosedPositionCard label={t('Najgorsza zamknięta pozycja')} position={data.worst_position} tone="negative" />
          </div>

          <div className="space-y-1">
            {data.positions.map((p, i) => (
              <div
                key={`${p.stock.id}-${p.closed_at}-${i}`}
                className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1.5"
              >
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="font-medium">{p.stock.ticker}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(p.opened_at)} → {formatDate(p.closed_at)} ({formatHoldingPeriod(p.holding_days, t)})
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 tabular-nums">
                  <span
                    className={Number(p.realized_pl_after_tax_base) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                  >
                    {formatMoney(p.realized_pl_after_tax_base, base)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{p.return_pct !== null ? formatPct(p.return_pct) : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatystykiPortfela() {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Statystyki portfela')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Skład, koncentracja i wyniki Twoich pozycji akcyjnych — otwartych i zamkniętych.')}
        </p>
      </div>
      <PortfolioAnalyticsSection />
      <ClosedPositionsSection />
    </div>
  )
}
