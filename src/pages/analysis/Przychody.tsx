import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import { usePaginatedList } from '../../lib/usePaginatedList'
import type { BankAccount, BudgetTransaction, Category, CategoryBreakdown } from '../../types'
import {
  AddCategoryForm,
  AddTransactionForm,
  CategoryPieCard,
  CategoryTrendChart,
  PeriodSelector,
  StatCard,
  TransactionList,
  usePeriodRange,
} from './shared'

export default function Przychody() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const period = usePeriodRange('this_month')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

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
    ['budget-transactions', 'income', period.range.from, period.range.to, selectedCategoryId],
    '/budget/transactions/',
    { ...period.range, type: 'income', ...(selectedCategoryId ? { category: selectedCategoryId } : {}) },
  )

  function invalidateBudget() {
    queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-category-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  const deleteTx = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/transactions/${id}/`),
    onSuccess: invalidateBudget,
  })

  const incomeRows = (breakdown?.rows ?? []).filter((r) => r.type === 'income')
  const selectedCategoryName = incomeRows.find((r) => (r.category?.id ?? null) === selectedCategoryId)?.category?.name

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Przychody')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Skąd biorą się Twoje przychody i jak zmieniają się w czasie')}</p>
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
            {t('+ Przychód')}
          </button>
        </div>
      </div>

      <PeriodSelector {...period} />

      {showAddCategory && (
        <AddCategoryForm
          lockedType="income"
          accounts={accounts}
          onDone={() => {
            setShowAddCategory(false)
            invalidateBudget()
          }}
        />
      )}

      {showAddTx && (
        <AddTransactionForm
          lockedType="income"
          categories={categories ?? []}
          accounts={accounts ?? []}
          onDone={() => {
            setShowAddTx(false)
            invalidateBudget()
          }}
        />
      )}

      <StatCard label={t('Przychody w okresie')} value={formatMoney(breakdown?.income_total, 'PLN')} tone="positive" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieCard
          title="Przychody wg kategorii"
          rows={incomeRows}
          loading={isLoading}
          onSelectCategory={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
        />
        <CategoryTrendChart
          type="income"
          months={6}
          onSelectCategory={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
        />
      </div>

      <TransactionList
        transactions={transactions}
        onDelete={(id) => deleteTx.mutate(id)}
        title={selectedCategoryName ? t('Przychody: {0}', selectedCategoryName) : t('Przychody w okresie')}
        hasMore={hasMoreTransactions}
        isLoadingMore={isFetchingMoreTransactions}
        onLoadMore={loadMoreTransactions}
      />
    </div>
  )
}
