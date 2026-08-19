import { useMemo, useState } from 'react'
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
  CumulativeNetChart,
  FlexibleTrendChart,
  PeriodSelector,
  StatCard,
  StoreBreakdownCard,
  TagBreakdownCard,
  TagManager,
  TransactionList,
  usePeriodRange,
} from './shared'

export default function Bilans() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const period = usePeriodRange('this_month')
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
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

  const { data: transactions } = useQuery({
    queryKey: ['budget-transactions', period.range.from, period.range.to, selectedTagId, selectedCategoryId, selectedStoreId],
    queryFn: async () =>
      (
        await api.get<BudgetTransaction[]>('/budget/transactions/', {
          params: {
            ...period.range,
            ...(selectedTagId ? { tag: selectedTagId } : {}),
            ...(selectedCategoryId ? { category: selectedCategoryId } : {}),
            ...(selectedStoreId ? { store: selectedStoreId } : {}),
          },
        })
      ).data,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  function invalidateBudget() {
    queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-category-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-store-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-tag-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
    queryClient.invalidateQueries({ queryKey: ['budget-tags'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
  }

  const deleteTx = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/transactions/${id}/`),
    onSuccess: invalidateBudget,
  })

  const expenseRows = useMemo(() => (breakdown?.rows ?? []).filter((r) => r.type === 'expense'), [breakdown])
  const incomeRows = useMemo(() => (breakdown?.rows ?? []).filter((r) => r.type === 'income'), [breakdown])

  function onSelectCategory(id: number | null) {
    setSelectedCategoryId(id)
    setSelectedStoreId(null)
    setSelectedTagId(null)
  }

  function onSelectStore(id: number | null) {
    setSelectedStoreId(id)
    setSelectedCategoryId(null)
    setSelectedTagId(null)
  }

  function onSelectTag(id: number | null) {
    setSelectedTagId(id)
    setSelectedCategoryId(null)
    setSelectedStoreId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Bilans')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Przychody i wydatki razem — podział na kategorie i trend w czasie')}</p>
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
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t('+ Przychód / wydatek')}
          </button>
        </div>
      </div>

      <PeriodSelector {...period} />

      {showAddCategory && (
        <AddCategoryForm
          onDone={() => {
            setShowAddCategory(false)
            invalidateBudget()
          }}
        />
      )}

      {showAddTx && (
        <AddTransactionForm
          categories={categories ?? []}
          accounts={accounts ?? []}
          onDone={() => {
            setShowAddTx(false)
            invalidateBudget()
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('Przychody w okresie')} value={formatMoney(breakdown?.income_total, 'PLN')} tone="positive" />
        <StatCard label={t('Wydatki w okresie')} value={formatMoney(breakdown?.expense_total, 'PLN')} tone="negative" />
        <StatCard
          label={t('Bilans')}
          value={formatMoney(breakdown?.net, 'PLN')}
          tone={Number(breakdown?.net ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieCard
          title="Wydatki wg kategorii"
          rows={expenseRows}
          loading={isLoading}
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
        />
        <CategoryPieCard
          title="Przychody wg kategorii"
          rows={incomeRows}
          loading={isLoading}
          onSelectCategory={onSelectCategory}
          selectedCategoryId={selectedCategoryId}
        />
      </div>

      <FlexibleTrendChart />

      <CumulativeNetChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryTrendChart type="expense" months={6} onSelectCategory={onSelectCategory} selectedCategoryId={selectedCategoryId} />
        <CategoryTrendChart type="income" months={6} onSelectCategory={onSelectCategory} selectedCategoryId={selectedCategoryId} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StoreBreakdownCard
          dateFrom={period.range.from}
          dateTo={period.range.to}
          onSelectStore={onSelectStore}
          selectedStoreId={selectedStoreId}
        />
        <TagBreakdownCard
          dateFrom={period.range.from}
          dateTo={period.range.to}
          onSelectTag={onSelectTag}
          selectedTagId={selectedTagId}
        />
      </div>

      <TagManager onSelectTag={onSelectTag} selectedTagId={selectedTagId} />

      <TransactionList transactions={transactions ?? []} onDelete={(id) => deleteTx.mutate(id)} />
    </div>
  )
}
