import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../api/client'
import { AmountInput } from '../../../components/AmountInput'
import CryptoAutocomplete from '../../../components/CryptoAutocomplete'
import { LoadMoreButton } from '../../../components/LoadMoreButton'
import { PageLoader, Spinner } from '../../../components/Loader'
import { useLanguage } from '../../../i18n/LanguageContext'
import { accountTypeLabel, formatDateTime, formatMoney, formatNumber, formatPct, formatShareQuantity } from '../../../lib/format'
import { usePaginatedList } from '../../../lib/usePaginatedList'
import type {
  BankAccount,
  CryptoAsset,
  CryptoHolding,
  CryptoPortfolioSummary,
  CryptoSearchResult,
  CryptoTransaction,
  Currency,
} from '../../../types'

const CURRENCY_OPTIONS: Currency[] = ['PLN', 'USD', 'EUR', 'NOK', 'DKK', 'GBP', 'SEK', 'CHF']

type HoldingSortKey =
  | 'symbol'
  | 'quantity'
  | 'avg_cost_base'
  | 'current_price_usd'
  | 'market_value_base'
  | 'unrealized_pl_base'
  | 'unrealized_pl_after_tax_base'
  | 'price_fetched_at'

function holdingSortValue(h: CryptoHolding, key: HoldingSortKey): number | string {
  switch (key) {
    case 'symbol':
      return h.asset.symbol
    case 'quantity':
      return Number(h.quantity)
    case 'avg_cost_base':
      return Number(h.avg_cost_base)
    case 'current_price_usd':
      return h.current_price_usd !== null ? Number(h.current_price_usd) : -Infinity
    case 'market_value_base':
      return h.market_value_base !== null ? Number(h.market_value_base) : -Infinity
    case 'unrealized_pl_base':
      return h.unrealized_pl_base !== null ? Number(h.unrealized_pl_base) : -Infinity
    case 'unrealized_pl_after_tax_base':
      return h.unrealized_pl_after_tax_base !== null ? Number(h.unrealized_pl_after_tax_base) : -Infinity
    case 'price_fetched_at':
      return h.price_fetched_at ? new Date(h.price_fetched_at).getTime() : -Infinity
  }
}

export default function KryptoPortfel() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [showAddTx, setShowAddTx] = useState(false)
  const [sellingAssetId, setSellingAssetId] = useState<number | null>(null)
  const [editingTxId, setEditingTxId] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<HoldingSortKey>('symbol')
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
    queryKey: ['crypto-holdings'],
    queryFn: async () => (await api.get<CryptoHolding[]>('/crypto/holdings/')).data,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  })

  const { data: portfolioSummary } = useQuery({
    queryKey: ['crypto-portfolio-summary'],
    queryFn: async () => (await api.get<CryptoPortfolioSummary>('/crypto/portfolio-summary/')).data,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  })

  const { data: assets } = useQuery({
    queryKey: ['crypto-assets'],
    queryFn: async () => (await api.get<CryptoAsset[]>('/crypto/assets/')).data,
  })

  const { items: transactions, hasMore: hasMoreTransactions, isFetchingMore: isFetchingMoreTransactions, loadMore: loadMoreTransactions } =
    usePaginatedList<CryptoTransaction>(['crypto-transactions'], '/crypto/transactions/')

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  function invalidatePortfolio() {
    queryClient.invalidateQueries({ queryKey: ['crypto-holdings'] })
    queryClient.invalidateQueries({ queryKey: ['crypto-portfolio-summary'] })
    queryClient.invalidateQueries({ queryKey: ['crypto-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  const deleteTxMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/crypto/transactions/${id}/`),
    onSuccess: invalidatePortfolio,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      const message =
        data && typeof data === 'object' ? Object.values(data as Record<string, unknown>).flat().join(' ') : null
      window.alert(message || t('Nie udało się usunąć transakcji.'))
    },
  })

  function onDeleteTx(tx: CryptoTransaction) {
    if (window.confirm(t('Usunąć tę transakcję? Środki wrócą na powiązane konto.'))) {
      deleteTxMutation.mutate(tx.id)
    }
  }

  const refreshPrices = useMutation({
    mutationFn: () => api.get<CryptoHolding[]>('/crypto/holdings/', { params: { refresh: 'true' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crypto-holdings'] })
      queryClient.invalidateQueries({ queryKey: ['crypto-portfolio-summary'] })
    },
  })

  // Same one-shot-on-open policy as Portfel.tsx - see get_latest_crypto_price's
  // docstring for why this isn't a timer-based poll instead.
  useEffect(() => {
    refreshPrices.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (holdingsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Portfel kryptowalut')}</h1>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {t('Kursy odświeżają się przy wejściu na tę stronę — kliknij "Odśwież kursy", by pobrać je ponownie')}
            {(isFetching || refreshPrices.isPending) && (
              <span className="inline-flex items-center gap-1">
                <Spinner size="sm" /> {t('odświeżanie…')}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refreshPrices.mutate()}
            disabled={refreshPrices.isPending}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('⟳ Odśwież kursy')}
          </button>
          <button
            onClick={() => setShowAddAsset((v) => !v)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Zarządzaj monetami')}
          </button>
          <button
            onClick={() => setShowAddTx((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Kupno')}
          </button>
        </div>
      </div>

      {showAddAsset && (
        <div className="space-y-3">
          <AddCryptoAssetForm onDone={() => queryClient.invalidateQueries({ queryKey: ['crypto-assets'] })} />
          <CryptoAssetManager
            assets={assets ?? []}
            onChange={() => {
              queryClient.invalidateQueries({ queryKey: ['crypto-assets'] })
              invalidatePortfolio()
            }}
          />
        </div>
      )}

      {showAddTx && (
        <BuyForm
          assets={assets ?? []}
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
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Suma wartości krypto')}</p>
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
            <p className="text-xs text-slate-500 dark:text-slate-400" title={t('Po podatku od zysków kapitałowych (wg kraju rezydencji)')}>
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
                  <SortTh column="symbol" align="left">
                    {t('Moneta')}
                  </SortTh>
                  <SortTh column="quantity">{t('Ilość')}</SortTh>
                  <SortTh column="avg_cost_base">{t('Śr. cena zakupu')}</SortTh>
                  <SortTh column="current_price_usd">{t('Cena bieżąca (USD)')}</SortTh>
                  <SortTh column="market_value_base">{t('Wartość')}</SortTh>
                  <SortTh column="unrealized_pl_base">{t('Zysk/strata')}</SortTh>
                  <SortTh column="unrealized_pl_after_tax_base" title={t('Po podatku od zysków kapitałowych (wg kraju rezydencji)')}>
                    {t('Zysk/strata po Belce')}
                  </SortTh>
                  <SortTh column="price_fetched_at">{t('Aktualizacja')}</SortTh>
                  <th className="px-4 py-2 text-right">{t('Operacje')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((h) => (
                  <Fragment key={h.asset.id}>
                    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="px-4 py-2">
                        <span className="font-medium">{h.asset.symbol}</span>{' '}
                        <span className="text-xs text-slate-400 dark:text-slate-500">{h.asset.name}</span>
                      </td>
                      <td className="px-4 py-2 text-right">{formatShareQuantity(h.quantity)}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(h.avg_cost_base, 'PLN')}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(h.current_price_usd, 'USD')}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(h.market_value_base, 'PLN')}</td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          Number(h.unrealized_pl_base ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatMoney(h.unrealized_pl_base, 'PLN')} ({formatPct(h.unrealized_pl_pct)})
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          Number(h.unrealized_pl_after_tax_base ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatMoney(h.unrealized_pl_after_tax_base, 'PLN')} ({formatPct(h.unrealized_pl_after_tax_pct)})
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-slate-400 dark:text-slate-500">
                        {formatDateTime(h.price_fetched_at)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setSellingAssetId(sellingAssetId === h.asset.id ? null : h.asset.id)}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          {t('Sprzedaj')}
                        </button>
                      </td>
                    </tr>
                    {sellingAssetId === h.asset.id && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                          <SellForm
                            holding={h}
                            accounts={accounts ?? []}
                            onDone={() => {
                              setSellingAssetId(null)
                              invalidatePortfolio()
                            }}
                            onCancel={() => setSellingAssetId(null)}
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
          {transactions.map((tx) =>
            editingTxId === tx.id ? (
              <EditCryptoTransactionForm
                key={tx.id}
                tx={tx}
                accounts={accounts ?? []}
                onDone={() => {
                  setEditingTxId(null)
                  invalidatePortfolio()
                }}
                onCancel={() => setEditingTxId(null)}
              />
            ) : (
              <div
                key={tx.id}
                className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 py-2 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1.5"
              >
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                  <span className={tx.type === 'BUY' ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}>
                    {tx.type === 'BUY' ? t('Kupno') : t('Sprzedaż')}
                  </span>
                  <span>
                    {formatNumber(tx.quantity, 6)}x {tx.asset_detail.symbol} @ {formatMoney(tx.price_per_unit, tx.currency)}
                  </span>
                  {tx.exchange_rate_at_purchase && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({t('kurs')} {formatNumber(tx.exchange_rate_at_purchase, 4)} PLN/{tx.currency})
                    </span>
                  )}
                  {tx.account_detail && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {tx.account_detail.name}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500">{tx.executed_at}</span>
                  <button
                    type="button"
                    onClick={() => setEditingTxId(tx.id)}
                    className="text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
                  >
                    {t('Edytuj')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTx(tx)}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    {t('Usuń')}
                  </button>
                </div>
              </div>
            ),
          )}
          {transactions.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak transakcji.')}</p>}
        </div>
        <LoadMoreButton onClick={loadMoreTransactions} loading={isFetchingMoreTransactions} visible={!!hasMoreTransactions} />
      </div>
    </div>
  )
}

function AddCryptoAssetForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage()
  const [coingeckoId, setCoingeckoId] = useState('')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/crypto/assets/', { coingecko_id: coingeckoId, symbol, name }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  function onPick(result: CryptoSearchResult) {
    setCoingeckoId(result.coingecko_id)
    setSymbol(result.symbol)
    setName(result.name)
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <Field label="Wyszukaj monetę">
        <CryptoAutocomplete onSelect={onPick} />
      </Field>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Symbol">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required className="input" />
        </Field>
        <Field label="Nazwa">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending || !coingeckoId}>
            {t('Dodaj monetę')}
          </button>
        </div>
      </form>
    </div>
  )
}

function CryptoAssetManager({ assets, onChange }: { assets: CryptoAsset[]; onChange: () => void }) {
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const sorted = [...assets].sort((a, b) => a.display_order - b.display_order)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/crypto/assets/${id}/`),
    onSuccess: onChange,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      const message =
        data && typeof data === 'object' ? Object.values(data as Record<string, unknown>).flat().join(' ') : null
      window.alert(message || t('Nie udało się usunąć monety.'))
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (order: number[]) => api.post('/crypto/assets/reorder/', { order }),
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

  function onDelete(asset: CryptoAsset) {
    if (window.confirm(t('Usunąć monetę {0}?', asset.symbol))) {
      deleteMutation.mutate(asset.id)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zarządzaj monetami')}</h3>
      <div className="space-y-1">
        {sorted.map((a) =>
          editingId === a.id ? (
            <EditCryptoAssetRow
              key={a.id}
              asset={a}
              onDone={() => {
                setEditingId(null)
                onChange()
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={a.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragId !== null && dragId !== a.id) setDragOverId(a.id)
              }}
              onDragLeave={() => setDragOverId((prev) => (prev === a.id ? null : prev))}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(a.id)
              }}
              className={`flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-sm transition ${
                dragOverId === a.id ? 'ring-2 ring-accent-400' : ''
              } ${dragId === a.id ? 'opacity-40' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span
                  draggable
                  onDragStart={() => setDragId(a.id)}
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
                  <span className="font-medium">{a.symbol}</span>{' '}
                  <span className="text-xs text-slate-400 dark:text-slate-500">{a.name}</span>
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingId(a.id)}
                  className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                >
                  {t('Edytuj')}
                </button>
                <button
                  onClick={() => onDelete(a)}
                  disabled={deleteMutation.isPending}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('Usuń')}
                </button>
              </div>
            </div>
          ),
        )}
        {sorted.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak monet.')}</p>}
      </div>
    </div>
  )
}

function EditCryptoAssetRow({ asset, onDone, onCancel }: { asset: CryptoAsset; onDone: () => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [symbol, setSymbol] = useState(asset.symbol)
  const [name, setName] = useState(asset.name)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.patch(`/crypto/assets/${asset.id}/`, { symbol, name }),
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
      className="grid grid-cols-2 gap-2 rounded-md border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 px-3 py-2 sm:grid-cols-4"
    >
      <Field label="Symbol">
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required className="input" />
      </Field>
      <Field label="Nazwa">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
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
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-4">{error}</p>}
    </form>
  )
}

function EditCryptoTransactionForm({
  tx,
  accounts,
  onDone,
  onCancel,
}: {
  tx: CryptoTransaction
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [account, setAccount] = useState<number | ''>(tx.account ?? '')
  const [quantity, setQuantity] = useState(tx.quantity)
  const [pricePerUnit, setPricePerUnit] = useState(tx.price_per_unit)
  const [fee, setFee] = useState(tx.fee)
  const [executedAt, setExecutedAt] = useState(tx.executed_at)
  const [notes, setNotes] = useState(tx.notes)
  const [error, setError] = useState<string | null>(null)

  const eligibleAccounts = accounts.filter((a) => a.currency === tx.currency)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/crypto/transactions/${tx.id}/`, {
        account: account || null,
        quantity,
        price_per_unit: pricePerUnit,
        fee,
        executed_at: executedAt,
        notes,
      }),
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
      <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:col-span-6">
        <span className={tx.type === 'BUY' ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}>
          {tx.type === 'BUY' ? t('Kupno') : t('Sprzedaż')}
        </span>{' '}
        {tx.asset_detail.symbol}
      </div>
      <Field label="Ilość">
        <AmountInput value={quantity} onChange={setQuantity} required className="input" />
      </Field>
      <Field label="Cena/szt.">
        <AmountInput value={pricePerUnit} onChange={setPricePerUnit} required className="input" />
      </Field>
      <Field label="Prowizja">
        <AmountInput value={fee} onChange={setFee} className="input" />
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
      </Field>
      <Field label="Notatki">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </Field>
      <div className="col-span-2 flex items-end gap-2 sm:col-span-6">
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
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-6">{error}</p>}
    </form>
  )
}

function BuyForm({ assets, accounts, onDone }: { assets: CryptoAsset[]; accounts: BankAccount[]; onDone: () => void }) {
  const { t } = useLanguage()
  const [asset, setAsset] = useState<number | ''>('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [fee, setFee] = useState('0')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const eligibleAccounts = accounts.filter((a) => a.currency === currency)

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/crypto/transactions/', {
        asset,
        type: 'BUY',
        account: account || null,
        affects_balance: !alreadyOwned,
        quantity,
        price_per_unit: pricePerUnit,
        fee,
        currency,
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
    if (!asset) return
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-7">
      <Field label="Moneta">
        <select value={asset} onChange={(e) => setAsset(Number(e.target.value))} required className="input">
          <option value="">{t('wybierz…')}</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.symbol}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ilość">
        <AmountInput value={quantity} onChange={setQuantity} required className="input" />
      </Field>
      <Field label="Cena/szt.">
        <AmountInput value={pricePerUnit} onChange={setPricePerUnit} required className="input" />
      </Field>
      <Field label="Prowizja">
        <AmountInput value={fee} onChange={setFee} className="input" />
      </Field>
      <Field label="Waluta">
        <select value={currency} onChange={(e) => { setCurrency(e.target.value as Currency); setAccount('') }} className="input">
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
        {eligibleAccounts.length === 0 && (
          <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">
            {t('Brak konta w walucie {0} — dodaj je w zakładce Konta i lokaty.', currency)}
          </span>
        )}
      </Field>
      {account ? (
        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-7">
          <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
          {t('To pozycja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
        </label>
      ) : (
        <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 sm:col-span-7">
          {t(
            'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz monety, które już posiadasz.',
          )}
        </p>
      )}
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-7">{error}</p>}
      <div className="col-span-2 flex items-end sm:col-span-7">
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
  holding: CryptoHolding
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const maxQuantity = Number(holding.quantity)
  const [quantity, setQuantity] = useState(holding.quantity)
  const [pricePerUnit, setPricePerUnit] = useState(holding.current_price_usd ?? holding.avg_cost_base)
  const [fee, setFee] = useState('0')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [account, setAccount] = useState<number | ''>('')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const eligibleAccounts = accounts.filter((a) => a.currency === currency)
  const estimatedProceeds = Math.max(0, Number(quantity || 0) * Number(pricePerUnit || 0) - Number(fee || 0))

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/crypto/transactions/', {
        asset: holding.asset.id,
        type: 'SELL',
        account: account || null,
        quantity,
        price_per_unit: pricePerUnit,
        fee,
        currency,
        executed_at: executedAt,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się sprzedać monety.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (Number(quantity) > maxQuantity) {
      setError(t('Posiadasz tylko {0} szt.', formatNumber(holding.quantity, 6)))
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t('Sprzedaż')} <span className="font-medium">{holding.asset.symbol}</span> — {t('posiadasz')}{' '}
        {formatNumber(holding.quantity, 6)} {t('szt.')}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
        <Field label="Ilość (max)">
          <AmountInput value={quantity} onChange={setQuantity} max={maxQuantity} required className="input" />
        </Field>
        <Field label="Cena/szt.">
          <AmountInput value={pricePerUnit} onChange={setPricePerUnit} required className="input" />
        </Field>
        <Field label="Prowizja">
          <AmountInput value={fee} onChange={setFee} className="input" />
        </Field>
        <Field label="Waluta">
          <select value={currency} onChange={(e) => { setCurrency(e.target.value as Currency); setAccount('') }} className="input">
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
          {t('Szac. wpływ:')} <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(estimatedProceeds, currency)}</span>
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
