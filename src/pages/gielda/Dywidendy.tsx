import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatAxisValue, formatDate, formatMoney, formatPct } from '../../lib/format'
import type { Dividend, DividendSummary, Stock } from '../../types'

const PALETTE = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#f97316', '#6366f1']

interface DividendTrendRow {
  month: string
  total: string
}

interface DividendYearlyRow {
  year: string
  total: string
}

const HISTORY_MONTHS_OPTIONS = [6, 12, 24, 36, 60]
const FORECAST_YEARS_OPTIONS = [5, 10, 15, 20]

export default function Dywidendy() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [showAdd, setShowAdd] = useState(false)
  const [stockFilter, setStockFilter] = useState<number | ''>('')
  const [historyMonths, setHistoryMonths] = useState(12)
  const [forecastYears, setForecastYears] = useState(10)

  const sync = useMutation({
    mutationFn: () => api.post('/dividends/sync/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividend-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dividends'] })
      queryClient.invalidateQueries({ queryKey: ['dividend-trend'] })
      queryClient.invalidateQueries({ queryKey: ['dividend-simulation'] })
      queryClient.invalidateQueries({ queryKey: ['dividend-simulation-yearly'] })
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['dividend-summary'],
    queryFn: async () => (await api.get<DividendSummary>('/dividends/summary/')).data,
  })

  const { data: dividends } = useQuery({
    queryKey: ['dividends', stockFilter],
    queryFn: async () =>
      (await api.get<Dividend[]>('/dividends/', { params: stockFilter ? { stock: stockFilter } : {} })).data,
  })

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await api.get<Stock[]>('/stocks/tickers/')).data,
  })

  const { data: trend } = useQuery({
    queryKey: ['dividend-trend', historyMonths, stockFilter],
    queryFn: async () =>
      (
        await api.get<DividendTrendRow[]>('/dividends/trend/', {
          params: { months: historyMonths, ...(stockFilter ? { stock: stockFilter } : {}) },
        })
      ).data,
  })

  const { data: simulation } = useQuery({
    queryKey: ['dividend-simulation', stockFilter],
    queryFn: async () =>
      (
        await api.get<DividendTrendRow[]>('/dividends/simulate/', {
          params: { months: 12, ...(stockFilter ? { stock: stockFilter } : {}) },
        })
      ).data,
  })

  const { data: yearlySimulation } = useQuery({
    queryKey: ['dividend-simulation-yearly', forecastYears, stockFilter],
    queryFn: async () =>
      (
        await api.get<DividendYearlyRow[]>('/dividends/simulate-yearly/', {
          params: { years: forecastYears, ...(stockFilter ? { stock: stockFilter } : {}) },
        })
      ).data,
  })

  const base = 'PLN'

  const cumulative = useMemo(() => {
    let running = 0
    return (trend ?? []).map((row) => {
      running += Number(row.total)
      return { month: row.month, cumulative: running }
    })
  }, [trend])

  const pieData = (summary?.rows ?? []).map((row) => ({ name: row.stock.ticker, value: Number(row.total_received) }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Profil dywidendowy')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Dywidendy wykrywane są automatycznie — nie musisz nic wpisywać ręcznie.')}
            {sync.isPending && ` — ${t('wykrywam dywidendy…')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            title={t('Automatyczne wykrywanie odświeża się samo przy wejściu na tę stronę — ten przycisk wymusza sprawdzenie od razu.')}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            {sync.isPending ? t('Wykrywam…') : t('⟳ Sprawdź teraz')}
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            title={t('Tylko dla wypłat, których automatyczne wykrywanie nie złapało (np. spółka spoza Yahoo Finance).')}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('+ Dodaj ręcznie')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Spółka')}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value ? Number(e.target.value) : '')}
            className="input ml-2 w-auto"
          >
            <option value="">{t('Wszystkie spółki')}</option>
            {(stocks ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.ticker} ({s.market})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Suma dywidend (wszystkie czasy)')}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{formatMoney(summary?.total_all_time, base)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Projekcja rocznego dochodu (12 mies.)')}</p>
          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatMoney(summary?.projected_annual_income, base)}
          </p>
        </div>
      </div>

      {showAdd && (
        <AddDividendForm
          stocks={stocks ?? []}
          onDone={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['dividends'] })
            queryClient.invalidateQueries({ queryKey: ['dividend-summary'] })
            queryClient.invalidateQueries({ queryKey: ['dividend-trend'] })
          }}
        />
      )}

      {(summary?.upcoming.length ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-300">{t('Planowane dywidendy')}</h2>
          <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
            {t(
              'Szacunek na podstawie historycznego rytmu wypłat tej spółki (ostatnia kwota + średni odstęp) — nie jest to oficjalna zapowiedź zarządu.',
            )}
          </p>
          <div className="space-y-2">
            {(summary?.upcoming ?? []).map((d) => (
              <div key={d.id} className="flex justify-between border-b border-amber-100 py-1.5 text-sm last:border-0">
                <span>
                  {d.stock_detail.ticker} — {t('ok.')} {formatMoney(d.total_amount, d.currency)}
                </span>
                <span className="text-amber-600 dark:text-amber-400">{formatDate(d.payment_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Dywidendy miesiąc do miesiąca')}</h2>
            <select value={historyMonths} onChange={(e) => setHistoryMonths(Number(e.target.value))} className="input w-auto">
              {HISTORY_MONTHS_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {t('{0} mies.', m)}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, base)} />
                <Bar dataKey="total" name={t('Dywidendy')} fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Udział spółek')}</h2>
          {pieData.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500">{t('Brak danych.')}</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value as number, base)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Suma dywidend narastająco ({0} mies.)', historyMonths)}
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative}>
              <defs>
                <linearGradient id="dividendCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
              <Tooltip formatter={(value) => formatMoney(value as number, base)} />
              <Area type="monotone" dataKey="cumulative" stroke="#059669" fill="url(#dividendCumulativeGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Symulacja przyszłych dywidend (12 mies.)')}</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t(
            'Szacunek na podstawie obecnie posiadanych akcji i historycznego rytmu wypłat każdej spółki — nie jest to gwarancja przyszłych dywidend.',
          )}
        </p>
        {(simulation ?? []).every((row) => Number(row.total) === 0) ? (
          <p className="text-slate-400 dark:text-slate-500">
            {t('Za mało historii wypłat dla posiadanych spółek, żeby oszacować przyszłość.')}
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulation ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, base)} />
                <Bar dataKey="total" name={t('Szac. dywidendy')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Szacunkowe dywidendy w kolejnych latach')}</h2>
          <select value={forecastYears} onChange={(e) => setForecastYears(Number(e.target.value))} className="input w-auto">
            {FORECAST_YEARS_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {t('{0} lat', y)}
              </option>
            ))}
          </select>
        </div>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t(
            'To samo założenie co powyżej (obecne akcje i historyczny rytm wypłat), zsumowane rok do roku na dłuższym horyzoncie.',
          )}
        </p>
        {(yearlySimulation ?? []).every((row) => Number(row.total) === 0) ? (
          <p className="text-slate-400 dark:text-slate-500">
            {t('Za mało historii wypłat dla posiadanych spółek, żeby oszacować przyszłość.')}
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlySimulation ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, base)} />
                <Bar dataKey="total" name={t('Szac. dywidendy')} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">{t('Spółka')}</th>
              <th className="px-4 py-2 text-right">{t('Suma dywidend')}</th>
              <th className="px-4 py-2 text-right">{t('Ostatnie 12 mies.')}</th>
              <th className="px-4 py-2 text-right">Yield on cost</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.rows ?? []).map((row) => (
              <tr key={row.stock.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-2 font-medium">{row.stock.ticker}</td>
                <td className="px-4 py-2 text-right">{formatMoney(row.total_received, base)}</td>
                <td className="px-4 py-2 text-right">{formatMoney(row.last_12m_received, base)}</td>
                <td className="px-4 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatPct(row.yield_on_cost_pct)}
                </td>
              </tr>
            ))}
            {summary?.rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  {t('Brak dywidend — dodaj pierwszą wypłatę.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia wypłat')}</h2>
        <div className="space-y-2">
          {(dividends ?? [])
            .filter((d) => d.status === 'paid')
            .map((d) => (
              <div key={d.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5 text-sm last:border-0">
                <span>
                  {d.stock_detail.ticker} — {formatMoney(d.total_amount, d.currency)}
                  {d.auto_detected && (
                    <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t('wykryta automatycznie')}
                    </span>
                  )}
                </span>
                <span className="text-slate-400 dark:text-slate-500">{formatDate(d.payment_date)}</span>
              </div>
            ))}
          {dividends?.filter((d) => d.status === 'paid').length === 0 && (
            <p className="text-slate-400 dark:text-slate-500">{t('Brak wypłat.')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AddDividendForm({ stocks, onDone }: { stocks: Stock[]; onDone: () => void }) {
  const { t } = useLanguage()
  const [stock, setStock] = useState<number | ''>('')
  const [amountPerShare, setAmountPerShare] = useState('')
  const [shares, setShares] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))

  const selectedStock = stocks.find((s) => s.id === stock)

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/dividends/', {
        stock,
        amount_per_share: amountPerShare,
        shares_at_payment: shares,
        total_amount: totalAmount,
        currency: selectedStock?.currency ?? 'PLN',
        payment_date: paymentDate,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stock) return
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
      <Field label="Spółka">
        <select value={stock} onChange={(e) => setStock(Number(e.target.value))} required className="input">
          <option value="">{t('wybierz…')}</option>
          {stocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.ticker}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kwota/akcję">
        <input type="number" step="0.0001" value={amountPerShare} onChange={(e) => setAmountPerShare(e.target.value)} required className="input" />
      </Field>
      <Field label="Liczba akcji">
        <input type="number" step="0.0001" value={shares} onChange={(e) => setShares(e.target.value)} required className="input" />
      </Field>
      <Field label="Kwota łącznie">
        <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required className="input" />
      </Field>
      <Field label="Data wypłaty">
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="input" />
      </Field>
      <div className="col-span-2 flex items-end sm:col-span-5">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz dywidendę')}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {t(label)}
      <div className="mt-1">{children}</div>
    </label>
  )
}
