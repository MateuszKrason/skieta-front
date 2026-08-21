import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import type { BankAccount, BudgetTransaction, Category, CategoryBreakdown } from '../../types'
import {
  AddCategoryForm,
  AddTransactionForm,
  CategoryPieCard,
  CategoryTrendChart,
  EXPENSE_PALETTE,
  PeriodSelector,
  StatCard,
  StoreBreakdownCard,
  TransactionList,
  usePeriodRange,
} from './shared'

export default function Wydatki() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const period = usePeriodRange('this_month')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)

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

  const { data: transactions } = useQuery({
    queryKey: ['budget-transactions', 'expense', period.range.from, period.range.to, selectedCategoryId, selectedStoreId],
    queryFn: async () =>
      (
        await api.get<BudgetTransaction[]>('/budget/transactions/', {
          params: {
            ...period.range,
            type: 'expense',
            ...(selectedCategoryId ? { category: selectedCategoryId } : {}),
            ...(selectedStoreId ? { store: selectedStoreId } : {}),
          },
        })
      ).data,
  })

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
  const selectedCategoryName = expenseRows.find((r) => (r.category?.id ?? null) === selectedCategoryId)?.category?.name

  function onSelectCategory(id: number | null) {
    setSelectedCategoryId(id)
    setSelectedStoreId(null)
  }

  function onSelectStore(id: number | null) {
    setSelectedStoreId(id)
    setSelectedCategoryId(null)
  }

  let listTitle = t('Wydatki w okresie')
  if (selectedCategoryName) listTitle = t('Wydatki: {0}', selectedCategoryName)
  else if (selectedStoreId) listTitle = t('Wydatki w wybranym sklepie')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Wydatki')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Na co wydajesz i jak zmienia się to w czasie')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategory((v) => !v)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('+ Kategoria')}
          </button>
          <button
            onClick={() => setShowAddTx((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Wydatek')}
          </button>
        </div>
      </div>

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
          lockedType="expense"
          categories={categories ?? []}
          accounts={accounts ?? []}
          onDone={() => {
            setShowAddTx(false)
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
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
          palette={EXPENSE_PALETTE}
        />
        <CategoryTrendChart
          type="expense"
          months={6}
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
          palette={EXPENSE_PALETTE}
        />
      </div>

      <StoreBreakdownCard
        dateFrom={period.range.from}
        dateTo={period.range.to}
        onSelectStore={onSelectStore}
        selectedStoreId={selectedStoreId}
        palette={EXPENSE_PALETTE}
      />

      <TransactionList transactions={transactions ?? []} onDelete={(id) => deleteTx.mutate(id)} title={listTitle} />
    </div>
  )
}
