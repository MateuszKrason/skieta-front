import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
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
  ScanReceiptButton,
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
  const period = usePeriodRange('this_month')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  // Independent - category, store and tag can all be active on the
  // transaction list at once, via TransactionFilters below.
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [receiptValues, setReceiptValues] = useState<ReceiptInitialValues | undefined>(undefined)
  const [scanNeedsKey, setScanNeedsKey] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

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
    ],
    '/budget/transactions/',
    {
      ...period.range,
      type: 'expense',
      ...(selectedCategoryId ? { category: selectedCategoryId } : {}),
      ...(selectedStoreId ? { store: selectedStoreId } : {}),
      ...(selectedTagId ? { tag: selectedTagId } : {}),
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
          <ScanReceiptButton
            onParsed={(receipt) => {
              setScanError(null)
              setScanNeedsKey(false)
              setReceiptValues(receiptToInitialValues(receipt))
              setShowAddTx(true)
            }}
            onNeedsGeminiKey={() => setScanNeedsKey(true)}
            onError={(message) => setScanError(message)}
          />
          <button
            onClick={() => {
              setReceiptValues(undefined)
              setShowAddTx((v) => !v)
            }}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Wydatek')}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t('💡 Najlepiej wgrywać świeże zdjęcie zrobione telefonem - Gemini odczytuje je lepiej niż skan albo stary plik.')}
      </p>

      {scanNeedsKey && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('Żeby skanować paragony, dodaj swój darmowy klucz Gemini w')}{' '}
          <Link to="/moje-konto" className="font-medium underline">
            {t('ustawieniach konta')}
          </Link>
          .
        </p>
      )}
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
          key={receiptValues ? 'from-receipt' : 'blank'}
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
