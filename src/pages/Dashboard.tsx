import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PageLoader } from '../components/Loader'
import { useLanguage } from '../i18n/LanguageContext'
import { useTooltipStyle } from '../lib/chartTooltip'
import { formatAxisValue, formatDate, formatMoney, formatPct } from '../lib/format'
import type { CategoryBreakdown, DashboardSummary, NetWorthSnapshot, PeriodKey } from '../types'

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '1d': '1 dzień',
  '1w': '1 tydzień',
  '1m': '1 miesiąc',
  ytd: 'Od początku roku',
  '1y': '1 rok',
  '5y': '5 lat',
}

const REFRESH_INTERVAL_MS = 60_000

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const showCrypto = user?.profile.interest_crypto ?? true

  const {
    data: summary,
    isLoading,
    isFetching: summaryFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/networth/dashboard/')).data,
    refetchInterval: REFRESH_INTERVAL_MS,
    // TanStack Query pauses refetchInterval while the tab is unfocused/hidden
    // by default — but the "auto co 60s" label and the ticking seconds-ago
    // counter below both promise it keeps happening regardless, so it must.
    refetchIntervalInBackground: true,
  })

  const { data: timeline, isFetching: timelineFetching } = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => (await api.get<NetWorthSnapshot[]>('/networth/timeline/')).data,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  const { data: budgetSummary, isFetching: budgetFetching } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: async () => (await api.get<CategoryBreakdown>('/budget/summary/')).data,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  // Drives the spin animation on the refresh button/icon - true both for the
  // manual "Odśwież teraz" click and for the silent 60s auto-refresh, so the
  // icon always reflects an actual in-flight request instead of just the
  // button's own click state.
  const isRefreshing = summaryFetching || timelineFetching || budgetFetching

  const [secondsAgo, setSecondsAgo] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSecondsAgo(Math.round((Date.now() - dataUpdatedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [dataUpdatedAt])

  function refreshNow() {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
  }

  const base = summary?.base_currency ?? 'PLN'
  const latest = summary?.latest

  if (isLoading) {
    return <PageLoader />
  }

  // totalAlloc always includes every category (matching latest.total) so a
  // hidden category's real share doesn't get silently redistributed onto the
  // visible ones' percentages - a hidden Krypto row just means the visible
  // bars don't visually add up to 100%, which is honest; inflating the
  // others' percentages to compensate would not be.
  const fullAllocation = latest
    ? [
        { label: 'Akcje', value: Number(latest.stocks_value) },
        { label: 'Krypto', value: Number(latest.crypto_value) },
        { label: 'Gotówka', value: Number(latest.bank_balance) },
        { label: 'Lokaty', value: Number(latest.deposits_value) },
        { label: 'Obligacje', value: Number(latest.bonds_value) },
      ]
    : []
  const allocation = showCrypto ? fullAllocation : fullAllocation.filter((a) => a.label !== 'Krypto')
  const totalAlloc = fullAllocation.reduce((s, a) => s + a.value, 0) || 1
  const periods: PeriodKey[] = ['1d', '1w', '1m', 'ytd', '1y', '5y']

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Dashboard')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Podsumowanie Twojego majątku, aktualizowane na bieżąco')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>{t('Odświeżono {0}s temu (auto co 60s)', secondsAgo)}</span>
          <button
            onClick={refreshNow}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-70"
          >
            <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>⟳</span>
            {t('Odśwież teraz')}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${showCrypto ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
        <StatCard label={t('Wartość majątku')} value={formatMoney(latest?.total, base)} highlight />
        <StatCard label={t('Akcje')} value={formatMoney(latest?.stocks_value, base)} />
        {showCrypto && <StatCard label={t('Krypto')} value={formatMoney(latest?.crypto_value, base)} />}
        <StatCard label={t('Gotówka')} value={formatMoney(latest?.bank_balance, base)} />
        <StatCard label={t('Lokaty')} value={formatMoney(latest?.deposits_value, base)} />
        <StatCard label={t('Obligacje')} value={formatMoney(latest?.bonds_value, base)} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zmiana wartości majątku')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {periods.map((key) => (
            <PeriodChangeCard
              key={key}
              label={t(PERIOD_LABELS[key])}
              pr={summary?.period_returns?.[key] ?? null}
              base={base}
              showCrypto={showCrypto}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Przychody i wydatki (ten miesiąc)')}</h2>
          <Link to="/budzet" className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zobacz pełną analizę →')}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('Przychody')} value={formatMoney(budgetSummary?.income_total, base)} tone="positive" />
          <StatCard label={t('Wydatki')} value={formatMoney(budgetSummary?.expense_total, base)} tone="negative" />
          <StatCard
            label={t('Bilans')}
            value={formatMoney(budgetSummary?.net, base)}
            tone={Number(budgetSummary?.net ?? 0) >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          data-tour="dashboard-chart"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm lg:col-span-2"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Wartość majątku w czasie')}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline ?? []}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d)}
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickFormatter={formatAxisValue}
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  width={40}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => formatMoney(value as number, base)}
                  labelFormatter={(d) => formatDate(d as string)}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#059669"
                  fill="url(#netWorthGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Podział majątku')}</h2>
          <div className="space-y-3">
            {allocation.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{t(a.label)}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatMoney(a.value, base)}{' '}
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      ({totalAlloc ? ((a.value / totalAlloc) * 100).toFixed(1) : '0.0'}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-accent-500"
                    style={{ width: `${(a.value / totalAlloc) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div data-tour="dashboard-realny-zwrot" className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Realny zwrot')}</h3>
              <Link to="/timeline" className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
                {t('Historia i wpłaty/wypłaty →')}
              </Link>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" title={t('To, co włożyłeś: majątek na starcie + przychody + wpłaty własne.')}>
              {t('Wpłacona kasa')}
            </p>
            <p className="text-sm font-medium">{formatMoney(summary?.growth.net_contributed, base)}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" title={t('To, co zarobiłeś: odsetki na lokatach i obligacjach, zysk na akcjach oraz dywidendy (po podatku Belki).')}>
              {t('Zysk')}
            </p>
            <p
              className={`text-sm font-semibold ${
                Number(summary?.growth.growth_amount ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatMoney(summary?.growth.growth_amount, base)} ({formatPct(summary?.growth.growth_pct)})
            </p>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zarobione odsetki')}</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('Na lokatach')}</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatMoney(summary?.deposits_interest_earned, base)}{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                ({formatMoney(summary?.deposits_interest_earned_after_tax, base)} {t('po podatku Belki')})
              </span>
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('Na obligacjach')}</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatMoney(summary?.bonds_interest_earned, base)}{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                ({formatMoney(summary?.bonds_interest_earned_after_tax, base)} {t('po podatku Belki')})
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  tone,
}: {
  label: string
  value: string
  highlight?: boolean
  tone?: 'positive' | 'negative'
}) {
  const isPositive = highlight || tone === 'positive'
  const isNegative = tone === 'negative'
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        isNegative ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30' : isPositive ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          isNegative ? 'text-red-700 dark:text-red-400' : isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

const BREAKDOWN_LABELS: Record<keyof import('../types').PeriodReturnBreakdown, string> = {
  stocks_value: 'Akcje',
  crypto_value: 'Krypto',
  bank_balance: 'Gotówka',
  deposits_value: 'Lokaty',
  bonds_value: 'Obligacje',
}

function PeriodChangeCard({
  label,
  pr,
  base,
  showCrypto,
}: {
  label: string
  pr: import('../types').PeriodReturn | null
  base: import('../types').Currency
  showCrypto: boolean
}) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const positive = pr ? Number(pr.change_amount) >= 0 : true

  if (!pr) {
    return (
      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm text-slate-300 dark:text-slate-600">{t('brak danych')}</p>
      </div>
    )
  }

  const breakdownEntries = (Object.keys(BREAKDOWN_LABELS) as Array<keyof typeof BREAKDOWN_LABELS>)
    .filter((k) => showCrypto || k !== 'crypto_value')
    .map((k) => ({ key: k, value: Number(pr.breakdown[k]) }))
    .filter((row) => Math.abs(row.value) > 0.005)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-left transition hover:border-slate-200 dark:hover:border-slate-700"
      title={t('Kliknij, aby zobaczyć podział zmiany na akcje, lokaty, obligacje i gotówkę')}
    >
      <p className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        {label}
        <span className="text-slate-300 dark:text-slate-600">{expanded ? '▲' : '▼'}</span>
      </p>
      <p className={`mt-1 text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}`}>
        {formatPct(pr.change_pct)}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{formatMoney(pr.change_amount, base)}</p>
      {expanded && (
        <div className="mt-2 space-y-1 border-t border-slate-200 dark:border-slate-700 pt-2">
          {breakdownEntries.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('Brak zmian w poszczególnych składnikach.')}</p>
          ) : (
            breakdownEntries.map((row) => (
              <div key={row.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{t(BREAKDOWN_LABELS[row.key])}</span>
                <span className={row.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {formatMoney(row.value, base)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </button>
  )
}
