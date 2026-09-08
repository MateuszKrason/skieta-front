import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { GeminiKeyPrompt } from '../../components/GeminiKeyForm'
import { ScanReceiptButton, type ReceiptScanNavState } from '../../components/ScanReceiptButton'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import { usePaginatedList } from '../../lib/usePaginatedList'
import type { BankAccount, BudgetTransaction, Category, CategoryBreakdown, Currency, ParsedReceipt } from '../../types'
import {
  AddCategoryForm,
  AddTransactionForm,
  CategoryPieCard,
  CategoryTrendChart,
  EXPENSE_PALETTE,
  PeriodSelector,
  StatCard,
  StoreBreakdownCard,
  TransactionFilters,
  TransactionList,
  usePeriodRange,
} from './shared'

type ReceiptInitialValues = {
  amount?: string
  currency?: Currency
  date?: string
  description?: string
  storeName?: string
  categoryName?: string
}

function receiptToInitialValues(receipt: ParsedReceipt): ReceiptInitialValues {
  return {
    amount: receipt.amount ?? undefined,
    currency: (receipt.currency as Currency) ?? undefined,
    date: receipt.date ?? undefined,
    description: receipt.description ?? undefined,
    storeName: receipt.store_name ?? undefined,
    categoryName: receipt.category_name ?? undefined,
  }
}

export default function Wydatki() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const period = usePeriodRange('this_month')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  // Independent - category, store and tag can all be active on the
  // transaction list at once, via TransactionFilters below.
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [receiptValues, setReceiptValues] = useState<ReceiptInitialValues | undefined>(undefined)
  // Bumped on every applied receipt so the form below remounts with the new
  // values. Without it a second scan while the form is still open from the
  // first one would keep the same React key, and initialValues (read only in
  // useState initialisers) would silently stay on the previous receipt.
  const [receiptSeq, setReceiptSeq] = useState(0)
  const [scanNeedsKey, setScanNeedsKey] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  function applyScan(receipt: ParsedReceipt) {
    setScanError(null)
    setScanNeedsKey(false)
    setReceiptValues(receiptToInitialValues(receipt))
    setReceiptSeq((n) => n + 1)
    setShowAddTx(true)
  }

  // A scan can also start from the header or the dashboard, which have
  // nowhere to show a result - they hand it over through the router state
  // (see ScanReceiptNavButton) and land here. Cleared straight after so a
  // refresh, or coming back with the browser's back button, doesn't re-open
  // the form with a receipt that was already saved or dismissed.
  useEffect(() => {
    const state = location.state as ReceiptScanNavState | null
    if (!state) return
    if (state.receipt) applyScan(state.receipt)
    if (state.needsGeminiKey) setScanNeedsKey(true)
    if (state.scanError) setScanError(state.scanError)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const { data: breakdown, isLoading } = useQuery({
    queryKey: ['budget-breakdown', period.range.from, period.range.to],
    queryFn: async () =>
      (await api.get<CategoryBreakdown>('/budget/breakdown/', { params: period.range })).data,
  })

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/')).data,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const {
    items: transactions,
    hasMore: hasMoreTransactions,
    isFetchingMore: isFetchingMoreTransactions,
    loadMore: loadMoreTransactions,
  } = usePaginatedList<BudgetTransaction>(
    [
      'budget-transactions',
      'expense',
      period.range.from,
      period.range.to,
      selectedCategoryId,
      selectedStoreId,
      selectedTagId,
      search,
    ],
    '/budget/transactions/',
    {
      ...period.range,
      type: 'expense',
      ...(selectedCategoryId ? { category: selectedCategoryId } : {}),
      ...(selectedStoreId ? { store: selectedStoreId } : {}),
      ...(selectedTagId ? { tag: selectedTagId } : {}),
      ...(search ? { search } : {}),
    },
  )

  function invalidateBudget() {
    queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-category-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-store-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    queryClient.invalidateQueries({ queryKey: ['budget-stores'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  const deleteTx = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/transactions/${id}/`),
    onSuccess: invalidateBudget,
  })

  const expenseRows = (breakdown?.rows ?? []).filter((r) => r.type === 'expense')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Wydatki')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Na co wydajesz i jak zmienia się to w czasie')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddCategory((v) => !v)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('+ Kategoria')}
          </button>
          <button
            onClick={() => {
              setReceiptValues(undefined)
              setShowAddTx((v) => !v)
            }}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('+ Wydatek')}
          </button>
          {/* The filled one, and last in the row, because photographing the
              receipt is the faster way to do exactly what "+ Wydatek" does -
              it just used to look like the least important of the three. */}
          <ScanReceiptButton
            onParsed={applyScan}
            onNeedsGeminiKey={() => setScanNeedsKey(true)}
            onError={(message) => setScanError(message)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t('💡 Najlepiej wgrywać świeże zdjęcie zrobione telefonem - Gemini odczytuje je lepiej niż skan albo stary plik.')}
      </p>

      {scanNeedsKey && <GeminiKeyPrompt />}
      {scanError && <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>}

      <PeriodSelector {...period} />

      {showAddCategory && (
        <AddCategoryForm
          lockedType="expense"
          accounts={accounts}
          onDone={() => {
            setShowAddCategory(false)
            invalidateBudget()
          }}
        />
      )}

      {showAddTx && (
        <AddTransactionForm
          key={receiptValues ? `from-receipt-${receiptSeq}` : 'blank'}
          lockedType="expense"
          categories={categories ?? []}
          accounts={accounts ?? []}
          initialValues={receiptValues}
          onDone={() => {
            setShowAddTx(false)
            setReceiptValues(undefined)
            invalidateBudget()
          }}
        />
      )}

      <StatCard label={t('Wydatki w okresie')} value={formatMoney(breakdown?.expense_total, 'PLN')} tone="negative" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieCard
          title="Wydatki wg kategorii"
          rows={expenseRows}
          loading={isLoading}
          onSelectCategory={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
          palette={EXPENSE_PALETTE}
        />
        <CategoryTrendChart type="expense" months={6} onSelectCategory={setSelectedCategoryId} palette={EXPENSE_PALETTE} />
      </div>

      <StoreBreakdownCard
        dateFrom={period.range.from}
        dateTo={period.range.to}
        onSelectStore={setSelectedStoreId}
        selectedStoreId={selectedStoreId}
        palette={EXPENSE_PALETTE}
      />

      <TransactionFilters
        categories={(categories ?? []).filter((c) => c.type === 'expense')}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        selectedTagId={selectedTagId}
        onSelectTag={setSelectedTagId}
        search={search}
        onSearchChange={setSearch}
      />

      <TransactionList
        transactions={transactions}
        onDelete={(id) => deleteTx.mutate(id)}
        title={t('Wydatki w okresie')}
        hasMore={hasMoreTransactions}
        isLoadingMore={isFetchingMoreTransactions}
        onLoadMore={loadMoreTransactions}
      />
    </div>
  )
}
