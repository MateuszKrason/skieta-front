import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../api/client'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatAxisValue, formatDate, formatMoney, formatPct } from '../../lib/format'
import type {
  BankAccount,
  BudgetTransaction,
  BudgetType,
  Category,
  CategoryBreakdownRow,
  Currency,
  MonthlyTrendRow,
  Store,
  StoreBreakdownRow,
  Tag,
  TagBreakdownRow,
} from '../../types'

export const PALETTE = [
  '#059669',
  '#0ea5e9',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

// Red/orange family for expense-only pages (Wydatki) — still distinct shades per
// category, but reading unmistakably as "money going out" instead of the
// general-purpose rainbow palette shared with income charts.
export const EXPENSE_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f43f5e',
  '#dc2626',
  '#fb923c',
  '#e11d48',
  '#b91c1c',
  '#fda4af',
  '#c2410c',
  '#991b1b',
]

export type Preset = 'this_month' | 'last_month' | 'this_year' | 'custom'

export function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (preset === 'last_month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: iso(start), to: iso(end) }
  }
  if (preset === 'this_year') {
    return { from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) }
  }
  return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) }
}

export function usePeriodRange(initial: Preset = 'this_month') {
  const [preset, setPreset] = useState<Preset>(initial)
  const [customFrom, setCustomFrom] = useState(() => presetRange(initial).from)
  const [customTo, setCustomTo] = useState(() => presetRange(initial).to)
  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset)
  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range }
}

export function PeriodSelector({
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: ReturnType<typeof usePeriodRange>) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          ['this_month', 'Ten miesiąc'],
          ['last_month', 'Poprzedni miesiąc'],
          ['this_year', 'Ten rok'],
          ['custom', 'Zakres własny'],
        ] as [Preset, string][]
      ).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setPreset(key)}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            preset === key ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {t(label)}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input w-auto" />
          <span className="text-slate-400 dark:text-slate-500">–</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input w-auto" />
        </>
      )}
    </div>
  )
}

export function StatCard({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'negative' }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tone === 'positive' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'}`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === 'positive' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{value}</p>
    </div>
  )
}

export function CategoryPieCard({
  title,
  rows,
  loading,
  onSelectCategory,
  selectedCategoryId,
  palette = PALETTE,
}: {
  title: string
  rows: CategoryBreakdownRow[]
  loading: boolean
  onSelectCategory?: (id: number | null) => void
  selectedCategoryId?: number | null
  palette?: string[]
}) {
  const { t } = useLanguage()
  const data = rows.map((r) => ({ id: r.category?.id ?? null, name: r.category?.name ?? t('Bez kategorii'), value: Number(r.total) }))

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t(title)}</h2>
      {loading ? (
        <CardLoader />
      ) : data.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak danych w tym okresie.')}</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 space-y-1">
        {rows.map((r, i) => (
          <button
            key={r.category?.id ?? 'none'}
            onClick={() => onSelectCategory?.(selectedCategoryId === (r.category?.id ?? null) ? null : r.category?.id ?? null)}
            className={`flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition ${
              onSelectCategory ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''
            } ${selectedCategoryId === (r.category?.id ?? null) && onSelectCategory ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800' : ''}`}
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
              {r.category?.name ?? t('Bez kategorii')}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatMoney(r.total, 'PLN')} ({formatPct(r.pct)})
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function CategoryTrendChart({
  type,
  months = 6,
  onSelectCategory,
  selectedCategoryId,
  palette = PALETTE,
}: {
  type: BudgetType
  months?: number
  onSelectCategory: (id: number | null) => void
  selectedCategoryId: number | null
  palette?: string[]
}) {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['budget-category-trend', type, months],
    queryFn: async () =>
      (
        await api.get<{ months: string[]; rows: { category: Category | null; totals: string[] }[] }>(
          '/budget/category-trend/',
          { params: { type, months } },
        )
      ).data,
  })

  const rows = data?.rows ?? []
  const chartData = (data?.months ?? []).map((month, i) => {
    const point: Record<string, string | number> = { month }
    rows.forEach((row) => {
      const key = row.category ? `cat_${row.category.id}` : 'cat_none'
      point[key] = Number(row.totals[i])
    })
    return point
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {t(type === 'expense' ? 'Wydatki' : 'Przychody')} {t('wg kategorii — miesiąc do miesiąca')}
      </h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{t('Kliknij kategorię poniżej, aby zobaczyć konkretne transakcje w wybranym okresie.')}</p>
      {isLoading ? (
        <CardLoader />
      ) : rows.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak danych.')}</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                {rows.map((row, i) => {
                  const key = row.category ? `cat_${row.category.id}` : 'cat_none'
                  return (
                    <Bar
                      key={key}
                      dataKey={(entry: Record<string, string | number>) => entry[key]}
                      name={row.category?.name ?? t('Bez kategorii')}
                      stackId="cat"
                      fill={palette[i % palette.length]}
                    />
                  )
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {rows.map((row, i) => {
              const id = row.category?.id ?? null
              const active = selectedCategoryId === id
              return (
                <button
                  key={id ?? 'none'}
                  onClick={() => onSelectCategory(active ? null : id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    active ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                  {row.category?.name ?? t('Bez kategorii')}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function TransactionList({
  transactions,
  onDelete,
  title = 'Transakcje w okresie',
}: {
  transactions: BudgetTransaction[]
  onDelete: (id: number) => void
  title?: string
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/')).data,
  })
  const { data: stores } = useQuery({
    queryKey: ['budget-stores'],
    queryFn: async () => (await api.get<Store[]>('/budget/stores/')).data,
  })

  function invalidateAfterEdit() {
    queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-category-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-store-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, category, store, tags }: { id: number; category: number | null; store: number | null; tags: number[] }) =>
      api.patch(`/budget/transactions/${id}/`, { category, store, tags }),
    onSuccess: () => {
      setEditingId(null)
      invalidateAfterEdit()
    },
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t(title)}</h2>
      <div className="space-y-2">
        {transactions.map((tx) =>
          editingId === tx.id ? (
            <EditTransactionCategoryStore
              key={tx.id}
              tx={tx}
              categories={(categories ?? []).filter((c) => c.type === tx.type)}
              stores={stores ?? []}
              onSave={(category, store, tagIds) => updateMutation.mutate({ id: tx.id, category, store, tags: tagIds })}
              onCancel={() => setEditingId(null)}
              saving={updateMutation.isPending}
            />
          ) : (
            <div key={tx.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-1.5 text-sm last:border-0">
              <span>
                <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}>
                  {tx.type === 'income' ? '+' : '−'} {formatMoney(tx.amount, tx.currency)}
                </span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{tx.category_detail?.name ?? t('Bez kategorii')}</span>
                {tx.store_detail && (
                  <span className="text-slate-400 dark:text-slate-500"> · {tx.store_detail.name}</span>
                )}
                {tx.description && <span className="text-slate-400 dark:text-slate-500"> — {tx.description}</span>}
                {tx.account_detail && (
                  <span className="ml-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {tx.account_detail.name}
                  </span>
                )}
                {tx.tags_detail.map((tag) => (
                  <span
                    key={tag.id}
                    className="ml-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
                  >
                    #{tag.name}
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-slate-400 dark:text-slate-500">{formatDate(tx.date)}</span>
                <button
                  onClick={() => setEditingId(tx.id)}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {t('Kategoria/sklep/tagi')}
                </button>
                <button onClick={() => onDelete(tx.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">
                  {t('Usuń')}
                </button>
              </span>
            </div>
          ),
        )}
        {transactions.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak transakcji w tym okresie.')}</p>}
      </div>
    </div>
  )
}

function TagPicker({ selected, onToggle }: { selected: number[]; onToggle: (id: number) => void }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: tags } = useQuery({
    queryKey: ['budget-tags'],
    queryFn: async () => (await api.get<Tag[]>('/budget/tags/')).data,
  })

  const addTag = useMutation({
    mutationFn: (name: string) => api.post<Tag>('/budget/tags/', { name }),
    onSuccess: ({ data: tag }) => {
      queryClient.invalidateQueries({ queryKey: ['budget-tags'] })
      setNewTagName('')
      setAdding(false)
      setError(null)
      onToggle(tag.id)
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się dodać tagu.'))
      }
    },
  })

  function submitNewTag() {
    if (!newTagName.trim()) return
    addTag.mutate(newTagName.trim())
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('Tagi (opcjonalnie)')}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {(tags ?? []).map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              selected.includes(tag.id)
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {tag.name}
          </button>
        ))}
        {adding ? (
          // Plain div, not a <form> — this already lives inside the outer
          // transaction/category <form>, and nested <form> elements are
          // invalid HTML: the browser can fall back to a native full-page
          // submit instead of React's handler, silently wiping the whole
          // outer form the user was filling in.
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitNewTag()
                }
              }}
              placeholder={t('np. wakacje')}
              className="input h-7 w-28 py-0.5 text-xs"
            />
            <button
              type="button"
              onClick={submitNewTag}
              disabled={addTag.isPending}
              className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {t('Dodaj')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setNewTagName('')
                setError(null)
              }}
              className="rounded-full px-1.5 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            {t('+ Dodaj tag')}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function EditTransactionCategoryStore({
  tx,
  categories,
  stores,
  onSave,
  onCancel,
  saving,
}: {
  tx: BudgetTransaction
  categories: Category[]
  stores: Store[]
  onSave: (category: number | null, store: number | null, tags: number[]) => void
  onCancel: () => void
  saving: boolean
}) {
  const { t } = useLanguage()
  const [category, setCategory] = useState<number | ''>(tx.category ?? '')
  const [store, setStore] = useState<number | ''>(tx.store ?? '')
  const [selectedTags, setSelectedTags] = useState<number[]>(tx.tags ?? [])

  function toggleTag(id: number) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 dark:border-slate-800 py-2 text-sm">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {formatMoney(tx.amount, tx.currency)} {tx.description && `— ${tx.description}`}
      </span>
      <Field label="Kategoria">
        <select value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez kategorii')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sklep (opcjonalnie)">
        <select value={store} onChange={(e) => setStore(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez sklepu')}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <TagPicker selected={selectedTags} onToggle={toggleTag} />
      <button
        onClick={() => onSave(category || null, store || null, selectedTags)}
        disabled={saving}
        className="btn-primary"
      >
        {t('Zapisz')}
      </button>
      <button
        onClick={onCancel}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {t('Anuluj')}
      </button>
    </div>
  )
}

export function AddCategoryForm({
  onDone,
  lockedType,
  accounts,
}: {
  onDone: () => void
  lockedType?: BudgetType
  accounts?: BankAccount[]
}) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [type, setType] = useState<BudgetType>(lockedType ?? 'expense')
  const [account, setAccount] = useState<number | ''>('')

  const mutation = useMutation({
    mutationFn: () => api.post('/budget/categories/', { name, type, account: account || null }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
      <Field label="Nazwa kategorii">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </Field>
      {!lockedType && (
        <Field label="Typ">
          <select value={type} onChange={(e) => setType(e.target.value as BudgetType)} className="input">
            <option value="expense">{t('Wydatek')}</option>
            <option value="income">{t('Przychód')}</option>
          </select>
        </Field>
      )}
      {accounts && accounts.length > 0 && (
        <Field label="Konto (opcjonalnie)">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('wszystkie konta')}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {t('Dodaj kategorię')}
        </button>
      </div>
    </form>
  )
}

export function CategoryManager({ type }: { type: BudgetType }) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  const { data: categories } = useQuery({
    queryKey: ['budget-categories', type],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/', { params: { type } })).data,
  })

  const deleteCategory = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
      queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
      queryClient.invalidateQueries({ queryKey: ['budget-category-trend'] })
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    },
  })

  function onDelete(category: Category) {
    if (
      window.confirm(
        t('Usunąć kategorię "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez kategorii".', category.name),
      )
    ) {
      deleteCategory.mutate(category.id)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Kategorie')}</h2>
      <div className="flex flex-wrap gap-2">
        {(categories ?? []).map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 pl-3 pr-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            {c.name}
            {c.account_detail && (
              <span
                title={t('Kategoria widoczna tylko dla tego konta')}
                className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400"
              >
                {c.account_detail.bank_name}
              </span>
            )}
            <button
              onClick={() => onDelete(c)}
              title={t('Usuń kategorię')}
              className="rounded-full px-1.5 py-0.5 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              ×
            </button>
          </span>
        ))}
        {categories?.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak kategorii.')}</p>}
      </div>
    </div>
  )
}

export function AddTransactionForm({
  categories,
  accounts,
  onDone,
  lockedType,
  lockedAccount,
}: {
  categories: Category[]
  accounts: BankAccount[]
  onDone: () => void
  lockedType?: BudgetType
  lockedAccount?: BankAccount
}) {
  const { t } = useLanguage()
  const [type, setType] = useState<BudgetType>(lockedType ?? 'expense')
  const [category, setCategory] = useState<number | ''>('')
  const [store, setStore] = useState<number | ''>('')
  const [tags, setTags] = useState<number[]>([])
  const [account, setAccount] = useState<number | ''>(lockedAccount?.id ?? '')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(lockedAccount?.currency ?? 'PLN')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = categories.filter(
    (c) => c.type === type && (c.account === null || c.account === account),
  )

  const { data: stores } = useQuery({
    queryKey: ['budget-stores'],
    queryFn: async () => (await api.get<Store[]>('/budget/stores/')).data,
  })

  function toggleTag(id: number) {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/budget/transactions/', {
        type,
        category: category || null,
        store: store || null,
        tags,
        account: account || null,
        amount,
        currency,
        date,
        description,
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
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
      {!lockedType && (
        <Field label="Typ">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as BudgetType)
              setCategory('')
            }}
            className="input"
          >
            <option value="expense">{t('Wydatek')}</option>
            <option value="income">{t('Przychód')}</option>
          </select>
        </Field>
      )}
      <Field label="Kategoria">
        <select value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez kategorii')}</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sklep (opcjonalnie)">
        <select value={store} onChange={(e) => setStore(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez sklepu')}</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kwota">
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input" />
      </Field>
      <Field label="Waluta">
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
          <option value="PLN">PLN</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="NOK">NOK</option>
          <option value="DKK">DKK</option>
          <option value="GBP">GBP</option>
        </select>
      </Field>
      <Field label="Konto (opcjonalnie)">
        {lockedAccount ? (
          <p className="input flex items-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
            {lockedAccount.bank_name} — {lockedAccount.name}
          </p>
        ) : (
        <select
          value={account}
          onChange={(e) => {
            setAccount(e.target.value ? Number(e.target.value) : '')
            setCategory('')
          }}
          className="input"
        >
          <option value="">{t('bez powiązania')}</option>
          {accounts.filter((a) => a.currency === currency).map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name}
            </option>
          ))}
        </select>
        )}
      </Field>
      <Field label="Data">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Opis (opcjonalnie)">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </Field>
      <div className="col-span-2 sm:col-span-4">
        <TagPicker selected={tags} onToggle={toggleTag} />
      </div>
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-4">{error}</p>}
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {t('Zapisz')}
        </button>
      </div>
      <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 sm:col-span-4">
        {t('Jeśli wybierzesz konto, kwota od razu zmieni jego saldo.')}
      </p>
    </form>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {t(label)}
      <div className="mt-1">{children}</div>
    </label>
  )
}

export function TagManager({
  onSelectTag,
  selectedTagId,
}: {
  onSelectTag?: (id: number | null) => void
  selectedTagId?: number | null
}) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [name, setName] = useState('')

  const { data: tags } = useQuery({
    queryKey: ['budget-tags'],
    queryFn: async () => (await api.get<Tag[]>('/budget/tags/')).data,
  })

  const addTag = useMutation({
    mutationFn: () => api.post('/budget/tags/', { name }),
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['budget-tags'] })
    },
  })

  const deleteTag = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/tags/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tags'] })
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
      onSelectTag?.(null)
    },
  })

  function onDelete(tag: Tag) {
    if (window.confirm(t('Usunąć tag "{0}"?', tag.name))) {
      deleteTag.mutate(tag.id)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addTag.mutate()
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Tagi')}</h2>
      {onSelectTag && (
        <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">{t('Kliknij tag, aby filtrować transakcje.')}</p>
      )}
      <form onSubmit={onSubmit} className="mb-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. wakacje"
          className="input max-w-xs"
        />
        <button type="submit" className="btn-primary" disabled={addTag.isPending}>
          {t('+ Dodaj tag')}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {(tags ?? []).map((tag) => (
          <span
            key={tag.id}
            onClick={() => onSelectTag?.(selectedTagId === tag.id ? null : tag.id)}
            className={`flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs transition ${
              onSelectTag ? 'cursor-pointer' : ''
            } ${
              selectedTagId === tag.id
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            {tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(tag)
              }}
              title={t('Usuń tag')}
              className="rounded-full px-1.5 py-0.5 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              ×
            </button>
          </span>
        ))}
        {tags?.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak tagów — dodaj pierwszy powyżej.')}</p>}
      </div>
    </div>
  )
}

export function StoreManager() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [name, setName] = useState('')

  const { data: stores } = useQuery({
    queryKey: ['budget-stores'],
    queryFn: async () => (await api.get<Store[]>('/budget/stores/')).data,
  })

  const addStore = useMutation({
    mutationFn: () => api.post('/budget/stores/', { name }),
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['budget-stores'] })
    },
  })

  const deleteStore = useMutation({
    mutationFn: (id: number) => api.delete(`/budget/stores/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-stores'] })
      queryClient.invalidateQueries({ queryKey: ['budget-store-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    },
  })

  function onDelete(store: Store) {
    if (
      window.confirm(t('Usunąć sklep "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez sklepu".', store.name))
    ) {
      deleteStore.mutate(store.id)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addStore.mutate()
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Sklepy')}</h2>
      <form onSubmit={onSubmit} className="mb-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Biedronka"
          className="input max-w-xs"
        />
        <button type="submit" className="btn-primary" disabled={addStore.isPending}>
          {t('+ Dodaj sklep')}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {(stores ?? []).map((s) => (
          <span
            key={s.id}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 pl-3 pr-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            {s.name}
            <button
              onClick={() => onDelete(s)}
              title={t('Usuń sklep')}
              className="rounded-full px-1.5 py-0.5 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              ×
            </button>
          </span>
        ))}
        {stores?.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak sklepów — dodaj pierwszy powyżej.')}</p>}
      </div>
    </div>
  )
}

export function StoreBreakdownCard({
  dateFrom,
  dateTo,
  type = 'expense',
  onSelectStore,
  selectedStoreId,
  palette = PALETTE,
}: {
  dateFrom: string
  dateTo: string
  type?: BudgetType
  onSelectStore: (id: number | null) => void
  selectedStoreId: number | null
  palette?: string[]
}) {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['budget-store-breakdown', dateFrom, dateTo, type],
    queryFn: async () =>
      (
        await api.get<{ total: string; rows: StoreBreakdownRow[] }>('/budget/store-breakdown/', {
          params: { from: dateFrom, to: dateTo, type },
        })
      ).data,
  })

  const rows = data?.rows ?? []
  const chartData = rows.map((r) => ({ id: r.store?.id ?? null, name: r.store?.name ?? t('Bez sklepu'), value: Number(r.total) }))

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Wydatki wg sklepów')}</h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
        {t('Tylko transakcje, którym przypisano sklep. Kliknij sklep, aby zobaczyć jego transakcje.')}
      </p>
      {isLoading ? (
        <CardLoader />
      ) : chartData.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak wydatków przypisanych do sklepów w tym okresie.')}</p>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1">
            {rows.map((r, i) => {
              const id = r.store?.id ?? null
              const active = selectedStoreId === id
              return (
                <button
                  key={id ?? 'none'}
                  onClick={() => onSelectStore(active ? null : id)}
                  className={`flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    active ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                    {r.store?.name ?? t('Bez sklepu')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatMoney(r.total, 'PLN')} ({formatPct(r.pct)})
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function TagBreakdownCard({
  dateFrom,
  dateTo,
  type = 'expense',
  onSelectTag,
  selectedTagId,
}: {
  dateFrom: string
  dateTo: string
  type?: BudgetType
  onSelectTag: (id: number | null) => void
  selectedTagId: number | null
}) {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['budget-tag-breakdown', dateFrom, dateTo, type],
    queryFn: async () =>
      (
        await api.get<{ total: string; rows: TagBreakdownRow[] }>('/budget/tag-breakdown/', {
          params: { from: dateFrom, to: dateTo, type },
        })
      ).data,
  })

  const rows = data?.rows ?? []
  const chartData = rows.map((r) => ({ id: r.tag?.id ?? null, name: r.tag ? `#${r.tag.name}` : t('Bez tagu'), value: Number(r.total) }))

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {t(type === 'income' ? 'Przychody wg tagów' : 'Wydatki wg tagów')}
      </h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
        {t('Tylko transakcje z co najmniej jednym tagiem — transakcja z kilkoma tagami liczy się do każdego z nich.')}
      </p>
      {isLoading ? (
        <CardLoader />
      ) : chartData.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Brak transakcji z tagami w tym okresie.')}</p>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1">
            {rows.map((r, i) => {
              const id = r.tag?.id ?? null
              const active = selectedTagId === id
              return (
                <button
                  key={id ?? 'none'}
                  onClick={() => onSelectTag(active ? null : id)}
                  className={`flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    active ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    {r.tag ? `#${r.tag.name}` : t('Bez tagu')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatMoney(r.total, 'PLN')} ({formatPct(r.pct)})
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export type TrendChartType = 'bar' | 'line' | 'area'
export type TrendMetric = 'income' | 'expense' | 'net'

const TREND_METRIC_COLORS: Record<TrendMetric, string> = {
  income: '#059669',
  expense: '#ef4444',
  net: '#0ea5e9',
}
const TREND_METRIC_LABELS: Record<TrendMetric, string> = {
  income: 'Przychody',
  expense: 'Wydatki',
  net: 'Bilans',
}
const TREND_MONTH_OPTIONS = [3, 6, 12, 24, 36]

export function FlexibleTrendChart() {
  const { t } = useLanguage()
  const [chartType, setChartType] = useState<TrendChartType>('bar')
  const [months, setMonths] = useState(12)
  const [metrics, setMetrics] = useState<TrendMetric[]>(['income', 'expense'])

  const { data: trend, isLoading } = useQuery({
    queryKey: ['budget-trend', months],
    queryFn: async () => (await api.get<MonthlyTrendRow[]>('/budget/trend/', { params: { months } })).data,
  })

  function toggleMetric(metric: TrendMetric) {
    setMetrics((prev) => (prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]))
  }

  const data = (trend ?? []).map((row) => ({
    month: row.month,
    income: Number(row.income),
    expense: Number(row.expense),
    net: Number(row.net),
  }))

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Przychody i wydatki w czasie')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
            {(['bar', 'line', 'area'] as TrendChartType[]).map((ct) => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  chartType === ct
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {ct === 'bar' ? t('Słupki') : ct === 'line' ? t('Linia') : t('Obszar')}
              </button>
            ))}
          </div>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="input w-auto">
            {TREND_MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t('{0} mies.', m)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['income', 'expense', 'net'] as TrendMetric[]).map((metric) => (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              metrics.includes(metric)
                ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TREND_METRIC_COLORS[metric] }} />
            {t(TREND_METRIC_LABELS[metric])}
          </button>
        ))}
      </div>
      {isLoading ? (
        <CardLoader />
      ) : metrics.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Wybierz co najmniej jedną serię do wyświetlenia.')}</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                <Legend />
                {metrics.map((m) => (
                  <Bar key={m} dataKey={m} name={t(TREND_METRIC_LABELS[m])} fill={TREND_METRIC_COLORS[m]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                <Legend />
                {metrics.map((m) => (
                  <Line
                    key={m}
                    type="monotone"
                    dataKey={m}
                    name={t(TREND_METRIC_LABELS[m])}
                    stroke={TREND_METRIC_COLORS[m]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
                <Legend />
                {metrics.map((m) => (
                  <Area
                    key={m}
                    type="monotone"
                    dataKey={m}
                    name={t(TREND_METRIC_LABELS[m])}
                    stroke={TREND_METRIC_COLORS[m]}
                    fill={TREND_METRIC_COLORS[m]}
                    fillOpacity={0.25}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function CumulativeNetChart() {
  const { t } = useLanguage()
  const [months, setMonths] = useState(12)

  const { data: trend, isLoading } = useQuery({
    queryKey: ['budget-trend', months],
    queryFn: async () => (await api.get<MonthlyTrendRow[]>('/budget/trend/', { params: { months } })).data,
  })

  let running = 0
  const data = (trend ?? []).map((row) => {
    running += Number(row.net)
    return { month: row.month, cumulative: running }
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Skumulowany bilans (oszczędności)')}</h2>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="input w-auto">
          {TREND_MONTH_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {t('{0} mies.', m)}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
        {t('Suma miesięcznych bilansów narastająco — jak rósł Twój zaoszczędzony kapitał w tym okresie.')}
      </p>
      <div className="h-56">
        {isLoading ? (
          <CardLoader />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cumulativeNetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
            <Tooltip formatter={(value) => formatMoney(value as number, 'PLN')} />
            <Area type="monotone" dataKey="cumulative" stroke="#0ea5e9" fill="url(#cumulativeNetGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
