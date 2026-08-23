import { Fragment, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { PageLoader, Spinner } from '../../components/Loader'
import ReinvestmentThreads from '../../components/ReinvestmentThreads'
import StockAutocomplete from '../../components/StockAutocomplete'
import { useLanguage } from '../../i18n/LanguageContext'
import { accountTypeLabel, formatDateTime, formatMoney, formatNumber, formatPct, formatShareQuantity } from '../../lib/format'
import type {
  BankAccount,
  Currency,
  Holding,
  InstrumentType,
  Market,
  PortfolioSummary,
  Stock,
  StockSearchResult,
  StockTransaction,
} from '../../types'

const CURRENCY_OPTIONS: Currency[] = ['PLN', 'USD', 'EUR', 'NOK', 'DKK', 'GBP', 'SEK', 'CHF']

type HoldingSortKey =
  | 'ticker'
  | 'quantity'
  | 'avg_cost'
  | 'current_price'
  | 'market_value'
  | 'unrealized_pl'
  | 'unrealized_pl_after_tax'
  | 'price_fetched_at'

function holdingSortValue(h: Holding, key: HoldingSortKey): number | string {
  switch (key) {
    case 'ticker':
      return h.stock.ticker
    case 'quantity':
      return Number(h.quantity)
    case 'avg_cost':
      return Number(h.avg_cost)
    case 'current_price':
      return h.current_price !== null ? Number(h.current_price) : -Infinity
    case 'market_value':
      // PLN-converted, not the native-currency figure - a USD position's
      // market value isn't directly comparable to a PLN one without FX.
      return h.market_value_base !== null ? Number(h.market_value_base) : -Infinity
    case 'unrealized_pl':
      return h.unrealized_pl_base !== null ? Number(h.unrealized_pl_base) : -Infinity
    case 'unrealized_pl_after_tax':
      return h.unrealized_pl_after_tax_base !== null ? Number(h.unrealized_pl_after_tax_base) : -Infinity
    case 'price_fetched_at':
      return h.price_fetched_at ? new Date(h.price_fetched_at).getTime() : -Infinity
  }
}

export default function Portfel() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [showAddStock, setShowAddStock] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [sellingStockId, setSellingStockId] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<HoldingSortKey>('ticker')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function toggleSort(key: HoldingSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const { data: holdings, isLoading: holdingsLoading, isFetching } = useQuery({
    queryKey: ['holdings'],
    queryFn: async () => (await api.get<Holding[]>('/stocks/holdings/')).data,
    refetchInterval: 60_000,
    // Otherwise this silently stops polling whenever the tab isn't focused —
    // see the same fix + explanation in Dashboard.tsx.
    refetchIntervalInBackground: true,
  })

  const { data: portfolioSummary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: async () => (await api.get<PortfolioSummary>('/stocks/portfolio-summary/')).data,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  })

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await api.get<Stock[]>('/stocks/tickers/')).data,
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get<StockTransaction[]>('/stocks/transactions/')).data,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  function invalidatePortfolio() {
    queryClient.invalidateQueries({ queryKey: ['holdings'] })
    queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  const refreshPrices = useMutation({
    mutationFn: () => api.get<Holding[]>('/stocks/holdings/', { params: { refresh: 'true' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] })
    },
  })

  if (holdingsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Portfel akcji i ETF-ów')}</h1>
          <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {t('Kursy aktualizowane automatycznie 2x dziennie — kliknij "Odśwież kursy" po bieżącą cenę')}
            {(isFetching || refreshPrices.isPending) && (
              <span className="inline-flex items-center gap-1">
                <Spinner size="sm" /> {t('odświeżanie…')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refreshPrices.mutate()}
            disabled={refreshPrices.isPending}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('⟳ Odśwież kursy')}
          </button>
          <button
            onClick={() => setShowAddStock((v) => !v)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Zarządzaj spółkami')}
          </button>
          <button
            onClick={() => setShowAddTx((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Kupno')}
          </button>
        </div>
      </div>

      {showAddStock && (
        <div className="space-y-3">
          <AddStockForm
            onDone={() => queryClient.invalidateQueries({ queryKey: ['stocks'] })}
          />
          <StockManager
            stocks={stocks ?? []}
            onChange={() => {
              queryClient.invalidateQueries({ queryKey: ['stocks'] })
              invalidatePortfolio()
            }}
          />
        </div>
      )}

      {showAddTx && (
        <BuyForm
          stocks={stocks ?? []}
          accounts={accounts ?? []}
          onDone={() => {
            setShowAddTx(false)
            invalidatePortfolio()
          }}
        />
      )}

      {holdings && holdings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Suma wartości akcji')}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatMoney(portfolioSummary?.total_value, 'PLN')}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 shadow-sm ${
              Number(portfolioSummary?.total_unrealized_pl ?? 0) >= 0
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Łączny zysk/strata')}</p>
            <p
              className={`mt-1 text-xl font-bold ${
                Number(portfolioSummary?.total_unrealized_pl ?? 0) >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {formatMoney(portfolioSummary?.total_unrealized_pl, 'PLN')} ({formatPct(portfolioSummary?.total_unrealized_pl_pct)})
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 shadow-sm ${
              Number(portfolioSummary?.total_unrealized_pl_after_tax ?? 0) >= 0
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400" title={t('Po podatku od zysków kapitałowych (19%)')}>
              {t('Zysk/strata po Belce')}
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                Number(portfolioSummary?.total_unrealized_pl_after_tax ?? 0) >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {formatMoney(portfolioSummary?.total_unrealized_pl_after_tax, 'PLN')} (
              {formatPct(portfolioSummary?.total_unrealized_pl_after_tax_pct)})
            </p>
          </div>
        </div>
      )}

      {(() => {
        const sortedHoldings = [...(holdings ?? [])].sort((a, b) => {
          const va = holdingSortValue(a, sortKey)
          const vb = holdingSortValue(b, sortKey)
          const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number)
          return sortDir === 'asc' ? cmp : -cmp
        })

        function SortTh({
          column,
          align = 'right',
          title: thTitle,
          children,
        }: {
          column: HoldingSortKey
          align?: 'left' | 'right'
          title?: string
          children: React.ReactNode
        }) {
          return (
            <th
              onClick={() => toggleSort(column)}
              title={thTitle}
              className={`cursor-pointer select-none px-4 py-2 hover:text-slate-700 dark:hover:text-slate-200 ${
                align === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {children}
              {sortKey === column && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
            </th>
          )
        }

        return (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <SortTh column="ticker" align="left">
                    {t('Spółka')}
                  </SortTh>
                  <SortTh column="quantity">{t('Ilość')}</SortTh>
                  <SortTh column="avg_cost">{t('Śr. cena zakupu')}</SortTh>
                  <SortTh column="current_price">{t('Cena bieżąca')}</SortTh>
                  <SortTh column="market_value">{t('Wartość')}</SortTh>
                  <SortTh column="unrealized_pl">{t('Zysk/strata')}</SortTh>
                  <SortTh column="unrealized_pl_after_tax" title={t('Po podatku od zysków kapitałowych (19%)')}>
                    {t('Zysk/strata po Belce')}
                  </SortTh>
                  <SortTh column="price_fetched_at">{t('Aktualizacja')}</SortTh>
                  <th className="px-4 py-2 text-right">{t('Operacje')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => (
              <Fragment key={h.stock.id}>
                <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium">{h.stock.ticker}</span>{' '}
                    {h.stock.instrument_type === 'ETF' && (
                      <span className="rounded-full bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                        ETF
                      </span>
                    )}{' '}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({h.stock.market}){h.stock.name && ` ${h.stock.name}`}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatShareQuantity(h.quantity)}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(h.avg_cost, h.stock.currency)}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(h.current_price, h.stock.currency)}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(h.market_value, h.stock.currency)}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      Number(h.unrealized_pl ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatMoney(h.unrealized_pl, h.stock.currency)} ({formatPct(h.unrealized_pl_pct)})
                    {h.fx_effect_base !== null && (
                      <div className="text-xs font-normal text-slate-400 dark:text-slate-500">
                        {t('z tego kurs waluty')}: {Number(h.fx_effect_base) >= 0 ? '+' : ''}
                        {formatMoney(h.fx_effect_base, 'PLN')}
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      Number(h.unrealized_pl_after_tax ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatMoney(h.unrealized_pl_after_tax, h.stock.currency)} ({formatPct(h.unrealized_pl_after_tax_pct)})
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-slate-400 dark:text-slate-500">
                    {formatDateTime(h.price_fetched_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setSellingStockId(sellingStockId === h.stock.id ? null : h.stock.id)}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      {t('Sprzedaj')}
                    </button>
                  </td>
                </tr>
                {sellingStockId === h.stock.id && (
                  <tr>
                    <td colSpan={9} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                      <SellForm
                        holding={h}
                        accounts={accounts ?? []}
                        onDone={() => {
                          setSellingStockId(null)
                          invalidatePortfolio()
                        }}
                        onCancel={() => setSellingStockId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
                {holdings?.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                      {t('Brak pozycji — dodaj pierwszą transakcję.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      })()}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia transakcji')}</h2>
        <div className="space-y-2">
          {(transactions ?? []).map((tx) => (
            <div key={tx.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5 text-sm last:border-0">
              <span>
                <span className={tx.type === 'BUY' ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}>
                  {tx.type === 'BUY' ? t('Kupno') : t('Sprzedaż')}
                </span>{' '}
                {formatNumber(tx.quantity, 4)}x {tx.stock_detail.ticker} @{' '}
                {formatMoney(tx.price_per_share, tx.currency)}
                {tx.exchange_rate_at_purchase && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {' '}
                    ({t('kurs')} {formatNumber(tx.exchange_rate_at_purchase, 4)} PLN/{tx.currency})
                  </span>
                )}
                {tx.account_detail && (
                  <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {tx.account_detail.name}
                  </span>
                )}
              </span>
              <span className="text-slate-400 dark:text-slate-500">{tx.executed_at}</span>
            </div>
          ))}
          {transactions?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak transakcji.')}</p>}
        </div>
      </div>

      <ReinvestmentThreads />
    </div>
  )
}

function AddStockForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage()
  const [ticker, setTicker] = useState('')
  const [market, setMarket] = useState<Market>('GPW')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('STOCK')

  const mutation = useMutation({
    mutationFn: () => api.post('/stocks/tickers/', { ticker, market, name, currency, instrument_type: instrumentType }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  function onPick(result: StockSearchResult) {
    setTicker(result.symbol)
    setMarket(result.market)
    setName(result.name)
    setCurrency(result.currency)
    setInstrumentType(result.instrument_type)
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <Field label="Wyszukaj spółkę">
        <StockAutocomplete onSelect={onPick} />
      </Field>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Field label="Ticker">
          <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required className="input" />
        </Field>
        <Field label="Rynek">
          <select value={market} onChange={(e) => setMarket(e.target.value as Market)} className="input">
            <option value="GPW">GPW</option>
            <option value="US">USA</option>
            <option value="EU">{t('Europa')}</option>
          </select>
        </Field>
        <Field label="Nazwa">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label="Waluta">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Typ">
          <select value={instrumentType} onChange={(e) => setInstrumentType(e.target.value as InstrumentType)} className="input">
            <option value="STOCK">{t('Akcja')}</option>
            <option value="ETF">ETF</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {t('Dodaj spółkę')}
          </button>
        </div>
      </form>
    </div>
  )
}

function StockManager({ stocks, onChange }: { stocks: Stock[]; onChange: () => void }) {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const sorted = [...stocks].sort((a, b) => a.display_order - b.display_order)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/stocks/tickers/${id}/`),
    onSuccess: onChange,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      const message =
        data && typeof data === 'object' ? Object.values(data as Record<string, unknown>).flat().join(' ') : null
      window.alert(message || t('Nie udało się usunąć spółki.'))
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (order: number[]) => api.post('/stocks/tickers/reorder/', { order }),
    onSuccess: onChange,
  })

  function handleDrop(targetId: number) {
    setDragOverId(null)
    if (dragId === null || dragId === targetId) {
      setDragId(null)
      return
    }
    const ids = sorted.map((s) => s.id)
    const fromIndex = ids.indexOf(dragId)
    const toIndex = ids.indexOf(targetId)
    ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, dragId)
    reorderMutation.mutate(ids)
    setDragId(null)
  }

  function onDelete(stock: Stock) {
    if (window.confirm(t('Usunąć spółkę {0} ({1})?', stock.ticker, stock.market))) {
      deleteMutation.mutate(stock.id)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zarządzaj spółkami')}</h3>
      <div className="space-y-1">
        {sorted.map((s) =>
          editingId === s.id ? (
            <EditStockRow
              key={s.id}
              stock={s}
              onDone={() => {
                setEditingId(null)
                onChange()
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={s.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragId !== null && dragId !== s.id) setDragOverId(s.id)
              }}
              onDragLeave={() => setDragOverId((prev) => (prev === s.id ? null : prev))}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(s.id)
              }}
              className={`flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm transition ${
                dragOverId === s.id ? 'ring-2 ring-accent-400' : ''
              } ${dragId === s.id ? 'opacity-40' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span
                  draggable
                  onDragStart={() => setDragId(s.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setDragOverId(null)
                  }}
                  title={t('Przeciągnij, aby zmienić kolejność')}
                  className="cursor-grab select-none text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 active:cursor-grabbing"
                >
                  ⠿
                </span>
                <span>
                  <span className="font-medium">{s.ticker}</span>{' '}
                  {s.instrument_type === 'ETF' && (
                    <span className="rounded-full bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                      ETF
                    </span>
                  )}{' '}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ({s.market}, {s.currency}) {s.name}
                  </span>
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingId(s.id)}
                  className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                >
                  {t('Edytuj')}
                </button>
                <button
                  onClick={() => onDelete(s)}
                  disabled={deleteMutation.isPending}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('Usuń')}
                </button>
              </div>
            </div>
          ),
        )}
        {sorted.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak spółek.')}</p>}
      </div>
    </div>
  )
}

function EditStockRow({ stock, onDone, onCancel }: { stock: Stock; onDone: () => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [ticker, setTicker] = useState(stock.ticker)
  const [market, setMarket] = useState<Market>(stock.market)
  const [name, setName] = useState(stock.name)
  const [currency, setCurrency] = useState<Currency>(stock.currency)
  const [instrumentType, setInstrumentType] = useState<InstrumentType>(stock.instrument_type)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/stocks/tickers/${stock.id}/`, { ticker, market, name, currency, instrument_type: instrumentType }),
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
      className="grid grid-cols-2 gap-2 rounded-md border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 px-3 py-2 sm:grid-cols-6"
    >
      <Field label="Ticker">
        <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required className="input" />
      </Field>
      <Field label="Rynek">
        <select value={market} onChange={(e) => setMarket(e.target.value as Market)} className="input">
          <option value="GPW">GPW</option>
          <option value="US">USA</option>
          <option value="EU">{t('Europa')}</option>
        </select>
      </Field>
      <Field label="Nazwa">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </Field>
      <Field label="Waluta">
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Typ">
        <select value={instrumentType} onChange={(e) => setInstrumentType(e.target.value as InstrumentType)} className="input">
          <option value="STOCK">{t('Akcja')}</option>
          <option value="ETF">ETF</option>
        </select>
      </Field>
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-5">{error}</p>}
    </form>
  )
}

function BuyForm({ stocks, accounts, onDone }: { stocks: Stock[]; accounts: BankAccount[]; onDone: () => void }) {
  const { t } = useLanguage()
  const [stock, setStock] = useState<number | ''>('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [pricePerShare, setPricePerShare] = useState('')
  const [fee, setFee] = useState('0')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const selectedStock = stocks.find((s) => s.id === stock)
  const eligibleAccounts = selectedStock ? accounts.filter((a) => a.currency === selectedStock.currency) : accounts

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/stocks/transactions/', {
        stock,
        type: 'BUY',
        account: account || null,
        affects_balance: !alreadyOwned,
        quantity,
        price_per_share: pricePerShare,
        fee,
        currency: selectedStock?.currency ?? 'PLN',
        executed_at: executedAt,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać transakcji.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!stock) return
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-6">
      <Field label="Spółka">
        <select value={stock} onChange={(e) => { setStock(Number(e.target.value)); setAccount('') }} required className="input">
          <option value="">{t('wybierz…')}</option>
          {stocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.ticker} ({s.market})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ilość">
        <input type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="input" />
      </Field>
      <Field label="Cena/szt.">
        <input type="number" step="0.01" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} required className="input" />
      </Field>
      <Field label="Prowizja">
        <input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} className="input" />
      </Field>
      <Field label="Data">
        <input type="date" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} required className="input" />
      </Field>
      <Field label="Powiąż z kontem (opcjonalnie)">
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')}
          className="input"
        >
          <option value="">{t('bez powiązania')}</option>
          {eligibleAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({t(accountTypeLabel(a.account_type))})
            </option>
          ))}
        </select>
        {eligibleAccounts.length === 0 && selectedStock && (
          <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">
            {t('Brak konta w walucie {0} — dodaj je w zakładce Konta i lokaty.', selectedStock.currency)}
          </span>
        )}
      </Field>
      {account ? (
        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-6">
          <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
          {t('To pozycja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
        </label>
      ) : (
        <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 sm:col-span-6">
          {t(
            'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz akcje, które już posiadasz.',
          )}
        </p>
      )}
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-6">{error}</p>}
      <div className="col-span-2 flex items-end sm:col-span-6">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz kupno')}
        </button>
      </div>
    </form>
  )
}

function SellForm({
  holding,
  accounts,
  onDone,
  onCancel,
}: {
  holding: Holding
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const maxQuantity = Number(holding.quantity)
  const [quantity, setQuantity] = useState(holding.quantity)
  const [pricePerShare, setPricePerShare] = useState(holding.current_price ?? holding.avg_cost)
  const [fee, setFee] = useState('0')
  const [account, setAccount] = useState<number | ''>('')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const eligibleAccounts = accounts.filter((a) => a.currency === holding.stock.currency)
  const estimatedProceeds = Math.max(0, Number(quantity || 0) * Number(pricePerShare || 0) - Number(fee || 0))

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/stocks/transactions/', {
        stock: holding.stock.id,
        type: 'SELL',
        account: account || null,
        quantity,
        price_per_share: pricePerShare,
        fee,
        currency: holding.stock.currency,
        executed_at: executedAt,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się sprzedać akcji.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (Number(quantity) > maxQuantity) {
      setError(t('Posiadasz tylko {0} szt.', formatNumber(holding.quantity, 4)))
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t('Sprzedaż')} <span className="font-medium">{holding.stock.ticker}</span> — {t('posiadasz')}{' '}
        {formatNumber(holding.quantity, 4)} {t('szt.')}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Field label="Ilość (max)">
          <input
            type="number"
            step="0.0001"
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Cena/szt.">
          <input type="number" step="0.01" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} required className="input" />
        </Field>
        <Field label="Prowizja">
          <input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} className="input" />
        </Field>
        <Field label="Data">
          <input type="date" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} required className="input" />
        </Field>
        <Field label="Środki na konto">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('bez powiązania')}</option>
            {eligibleAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.name} ({t(accountTypeLabel(a.account_type))})
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col justify-end text-xs text-slate-500 dark:text-slate-400">
          {t('Szac. wpływ:')} <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(estimatedProceeds, holding.stock.currency)}</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700" disabled={mutation.isPending}>
          {t('Potwierdź sprzedaż')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
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
