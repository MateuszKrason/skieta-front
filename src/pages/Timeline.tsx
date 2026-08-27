import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { AmountInput } from '../components/AmountInput'
import { CardLoader, PageLoader } from '../components/Loader'
import { useLanguage } from '../i18n/LanguageContext'
import { useTooltipStyle } from '../lib/chartTooltip'
import { formatAxisValue, formatDate, formatMoney, formatPct } from '../lib/format'
import type { CashFlow, DashboardSummary, NetWorthSnapshot } from '../types'

export default function Timeline() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const [showAdd, setShowAdd] = useState(false)
  const [editingCashflowId, setEditingCashflowId] = useState<number | null>(null)

  function invalidateCashflowsRelated() {
    queryClient.invalidateQueries({ queryKey: ['cashflows'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  function alertOnError(err: unknown) {
    const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
    if (detail) window.alert(detail)
  }

  const deleteCashflow = useMutation({
    mutationFn: (id: number) => api.delete(`/networth/cashflows/${id}/`),
    onSuccess: invalidateCashflowsRelated,
    onError: alertOnError,
  })

  function onDeleteCashflow(cf: CashFlow) {
    if (window.confirm(t('Czy na pewno chcesz usunąć ten wpis?'))) {
      deleteCashflow.mutate(cf.id)
    }
  }

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => (await api.get<NetWorthSnapshot[]>('/networth/timeline/')).data,
  })

  const { data: cashflows, isLoading: cashflowsLoading } = useQuery({
    queryKey: ['cashflows'],
    queryFn: async () => (await api.get<CashFlow[]>('/networth/cashflows/')).data,
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/networth/dashboard/')).data,
  })

  const base = summary?.base_currency ?? 'PLN'

  if (summaryLoading || cashflowsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Timeline majątku')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Sprawdź, jak realnie pomnożyłeś wpłacone środki — niezależnie od tego, ile do systemu dołożyłeś')}
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
        >
          {t('+ Wpłata / wypłata')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Obecna wartość majątku')}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{formatMoney(summary?.growth.current_total, base)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Wpłacone środki netto')}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{formatMoney(summary?.growth.net_contributed, base)}</p>
        </div>
        <div className="rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/30 p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Realny zysk (pomnożenie)')}</p>
          {summary?.growth.growth_amount === null ? (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {t('Brak danych — zarejestruj pierwszą wpłatę, aby zobaczyć realny zwrot.')}
            </p>
          ) : (
            <p
              className={`mt-1 text-xl font-bold ${
                Number(summary?.growth.growth_amount ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatMoney(summary?.growth.growth_amount, base)} ({formatPct(summary?.growth.growth_pct)})
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Wartość majątku w czasie')}</h2>
        <div className="h-72">
          {timelineLoading ? (
            <CardLoader />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline ?? []}>
                <defs>
                  <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, base)} labelFormatter={(d) => formatDate(d as string)} />
                <Area type="monotone" dataKey="total" stroke="#059669" fill="url(#timelineGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {showAdd && (
        <AddCashFlowForm
          onDone={() => {
            setShowAdd(false)
            invalidateCashflowsRelated()
          }}
        />
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia wpłat / wypłat')}</h2>
        <div className="space-y-2">
          {(cashflows ?? []).map((cf) => (
            <div key={cf.id}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-1.5 text-sm last:border-0">
                <span>
                  <span className={cf.type === 'deposit' ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}>
                    {cf.type === 'deposit' ? t('Wpłata') : t('Wypłata')}
                  </span>{' '}
                  {formatMoney(cf.amount, base)} {cf.note && `— ${cf.note}`}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-400 dark:text-slate-500">{formatDate(cf.date)}</span>
                  <button
                    onClick={() => setEditingCashflowId(editingCashflowId === cf.id ? null : cf.id)}
                    className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                  >
                    {t('Edytuj')}
                  </button>
                  <button
                    onClick={() => onDeleteCashflow(cf)}
                    disabled={deleteCashflow.isPending}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {t('Usuń')}
                  </button>
                </span>
              </div>
              {editingCashflowId === cf.id && (
                <div className="py-2">
                  <EditCashFlowForm
                    cashflow={cf}
                    onDone={() => {
                      setEditingCashflowId(null)
                      invalidateCashflowsRelated()
                    }}
                    onCancel={() => setEditingCashflowId(null)}
                  />
                </div>
              )}
            </div>
          ))}
          {cashflows?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak wpłat/wypłat.')}</p>}
        </div>
      </div>
    </div>
  )
}

function AddCashFlowForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage()
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/networth/cashflows/', { amount, type, date, note }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
      <Field label="Typ">
        <select value={type} onChange={(e) => setType(e.target.value as 'deposit' | 'withdrawal')} className="input">
          <option value="deposit">{t('Wpłata')}</option>
          <option value="withdrawal">{t('Wypłata')}</option>
        </select>
      </Field>
      <Field label="Kwota">
        <AmountInput value={amount} onChange={setAmount} required className="input" />
      </Field>
      <Field label="Data">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Notatka">
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </Field>
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {t('Zapisz')}
        </button>
      </div>
    </form>
  )
}

function EditCashFlowForm({
  cashflow,
  onDone,
  onCancel,
}: {
  cashflow: CashFlow
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [amount, setAmount] = useState(cashflow.amount)
  const [type, setType] = useState<'deposit' | 'withdrawal'>(cashflow.type)
  const [date, setDate] = useState(cashflow.date)
  const [note, setNote] = useState(cashflow.note)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.patch(`/networth/cashflows/${cashflow.id}/`, { amount, type, date, note }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać zmian.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-2 gap-3 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 p-4 sm:grid-cols-5"
    >
      <Field label="Typ">
        <select value={type} onChange={(e) => setType(e.target.value as 'deposit' | 'withdrawal')} className="input">
          <option value="deposit">{t('Wpłata')}</option>
          <option value="withdrawal">{t('Wypłata')}</option>
        </select>
      </Field>
      <Field label="Kwota">
        <AmountInput value={amount} onChange={setAmount} required className="input" />
      </Field>
      <Field label="Data">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Notatka">
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </Field>
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {t('Zapisz')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
      {error && <p className="col-span-2 text-xs text-red-600 dark:text-red-400 sm:col-span-5">{error}</p>}
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
