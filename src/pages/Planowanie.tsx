import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate, formatMoney } from '../lib/format'
import type { BudgetPlan, Category, Currency, PlannedExpense, PlanningSummary, SavingsGoal } from '../types'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {t(label)}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        tone === 'positive'
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30'
          : tone === 'negative'
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          tone === 'positive'
            ? 'text-emerald-700 dark:text-emerald-400'
            : tone === 'negative'
              ? 'text-red-700 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default function Planowanie() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  const { data: summary } = useQuery({
    queryKey: ['planning-summary'],
    queryFn: async () => (await api.get<PlanningSummary>('/planning/summary/')).data,
  })

  const { data: goals } = useQuery({
    queryKey: ['planning-goals'],
    queryFn: async () => (await api.get<SavingsGoal[]>('/planning/goals/')).data,
  })

  const { data: expenses } = useQuery({
    queryKey: ['planning-expenses'],
    queryFn: async () => (await api.get<PlannedExpense[]>('/planning/expenses/')).data,
  })

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/')).data,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['planning-summary'] })
    queryClient.invalidateQueries({ queryKey: ['planning-goals'] })
    queryClient.invalidateQueries({ queryKey: ['planning-expenses'] })
  }

  const deleteGoal = useMutation({
    mutationFn: (id: number) => api.delete(`/planning/goals/${id}/`),
    onSuccess: invalidateAll,
  })

  const deleteExpense = useMutation({
    mutationFn: (id: number) => api.delete(`/planning/expenses/${id}/`),
    onSuccess: invalidateAll,
  })

  const togglePaid = useMutation({
    mutationFn: ({ id, is_paid }: { id: number; is_paid: boolean }) =>
      api.patch(`/planning/expenses/${id}/`, { is_paid }),
    onSuccess: invalidateAll,
  })

  const base = summary?.base_currency ?? 'PLN'
  const today = new Date().toISOString().slice(0, 10)
  const sortedExpenses = [...(expenses ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Planowanie budżetu')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Twoja pensja, oszczędności, nadchodzące duże wydatki i cele, na które odkładasz.')}
        </p>
      </div>

      <SalaryForm plan={summary} onDone={invalidateAll} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Pensja miesięczna')} value={formatMoney(summary?.monthly_salary, base)} />
        <StatCard label={t('Śr. wydatki (3 mies.)')} value={formatMoney(summary?.avg_monthly_expense, base)} tone="negative" />
        <StatCard
          label={t('Wolny budżet / mies.')}
          value={formatMoney(summary?.free_monthly_budget, base)}
          tone={Number(summary?.free_monthly_budget ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label={t('Oszczędności (konta)')} value={formatMoney(summary?.current_savings, base)} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('Zarezerwowano na cele')} value={formatMoney(summary?.total_reserved_for_goals, base)} />
        <StatCard label={t('Zarezerwowano na duże wydatki')} value={formatMoney(summary?.total_unpaid_planned_expenses, base)} />
        <StatCard
          label={t('Zostaje po rezerwacjach i odkładaniu')}
          value={formatMoney(summary?.remaining_after_commitments, base)}
          tone={Number(summary?.remaining_after_commitments ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Cele oszczędnościowe')}</h2>
          <button
            onClick={() => setShowAddGoal((v) => !v)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t('+ Cel')}
          </button>
        </div>
        {showAddGoal && (
          <div className="mb-4">
            <AddGoalForm
              categories={categories ?? []}
              onDone={() => {
                setShowAddGoal(false)
                invalidateAll()
              }}
            />
          </div>
        )}
        <div className="space-y-3">
          {(goals ?? []).map((g) => (
            <GoalRow key={g.id} goal={g} onDelete={() => deleteGoal.mutate(g.id)} onChange={invalidateAll} />
          ))}
          {goals?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak celów — dodaj pierwszy.')}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Duże wydatki')}</h2>
          <button
            onClick={() => setShowAddExpense((v) => !v)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t('+ Wydatek')}
          </button>
        </div>
        {showAddExpense && (
          <div className="mb-4">
            <AddExpenseForm
              onDone={() => {
                setShowAddExpense(false)
                invalidateAll()
              }}
            />
          </div>
        )}
        <div className="space-y-2">
          {sortedExpenses.map((e) => {
            const overdue = !e.is_paid && e.due_date < today
            return (
              <div
                key={e.id}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  e.is_paid
                    ? 'bg-slate-50 dark:bg-slate-900 opacity-60'
                    : overdue
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                <span>
                  <span className={e.is_paid ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium text-slate-700 dark:text-slate-300'}>
                    {e.name}
                  </span>{' '}
                  <span className="text-slate-500 dark:text-slate-400">{formatMoney(e.amount, e.currency)}</span>
                  {e.notes && <span className="text-slate-400 dark:text-slate-500"> — {e.notes}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className={overdue && !e.is_paid ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}>
                    {formatDate(e.due_date)}
                  </span>
                  <button
                    onClick={() => togglePaid.mutate({ id: e.id, is_paid: !e.is_paid })}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {e.is_paid ? t('Cofnij') : t('Opłacone')}
                  </button>
                  <button
                    onClick={() => deleteExpense.mutate(e.id)}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t('Usuń')}
                  </button>
                </span>
              </div>
            )
          })}
          {sortedExpenses.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak zaplanowanych wydatków.')}</p>}
        </div>
      </div>
    </div>
  )
}

function SalaryForm({ plan, onDone }: { plan: PlanningSummary | undefined; onDone: () => void }) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')

  const mutation = useMutation({
    mutationFn: () => api.patch<BudgetPlan>('/planning/plan/', { monthly_salary: salary, currency }),
    onSuccess: () => {
      setEditing(false)
      onDone()
    },
  })

  function startEditing() {
    setSalary(plan?.monthly_salary ?? '')
    setCurrency((plan?.base_currency as Currency) ?? 'PLN')
    setEditing(true)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (!editing) {
    return (
      <button
        onClick={startEditing}
        className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
      >
        {t('Ustaw / zmień pensję miesięczną')}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
      <Field label="Pensja miesięczna (netto)">
        <input type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} required className="input" />
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
      <div className="col-span-2 flex items-end gap-2 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz')}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function AddGoalForm({ onDone, categories }: { onDone: () => void; categories: Category[] }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('0')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState<number | ''>('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/planning/goals/', {
        name,
        target_amount: targetAmount,
        current_amount: currentAmount,
        currency,
        target_date: targetDate || null,
        notes,
        category: category || null,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 sm:grid-cols-6">
      <Field label="Nazwa celu">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="np. Wakacje" className="input" />
      </Field>
      <Field label="Kwota docelowa">
        <input type="number" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required className="input" />
      </Field>
      <Field label="Już odłożono">
        <input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="input" />
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
      <Field label="Data docelowa (opcjonalnie)">
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input" />
      </Field>
      <Field label="Kategoria (opcjonalnie)">
        <select value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez kategorii')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notatka (opcjonalnie)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </Field>
      <div className="col-span-2 flex items-end sm:col-span-6">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Dodaj cel')}
        </button>
      </div>
    </form>
  )
}

function GoalRow({ goal, onDelete, onChange }: { goal: SavingsGoal; onDelete: () => void; onChange: () => void }) {
  const { t } = useLanguage()
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const progress = goal.progress_pct !== null ? Number(goal.progress_pct) : 0
  const achieved = Number(goal.current_amount) >= Number(goal.target_amount)

  const contribute = useMutation({
    mutationFn: () =>
      api.patch(`/planning/goals/${goal.id}/`, {
        current_amount: (Number(goal.current_amount) + Number(amount || 0)).toFixed(2),
      }),
    onSuccess: () => {
      setAmount('')
      setAdding(false)
      onChange()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!amount) return
    contribute.mutate()
  }

  return (
    <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {goal.name} {achieved && <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
            {goal.category_detail && (
              <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                {goal.category_detail.name}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatMoney(goal.current_amount, goal.currency)} / {formatMoney(goal.target_amount, goal.currency)}
            {goal.target_date && <> · {t('do')} {formatDate(goal.target_date)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAdding((v) => !v)} className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
            {t('Dołóż')}
          </button>
          <button onClick={onDelete} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">
            {t('Usuń')}
          </button>
        </div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-2 rounded-full ${achieved ? 'bg-emerald-500' : 'bg-emerald-400'}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {adding && (
        <form onSubmit={onSubmit} className="mt-2 flex items-end gap-2">
          <Field label="Kwota do dołożenia">
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input" />
          </Field>
          <button type="submit" className="btn-primary" disabled={contribute.isPending}>
            {t('Zapisz')}
          </button>
        </form>
      )}
    </div>
  )
}

function AddExpenseForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/planning/expenses/', {
        name,
        amount,
        currency,
        due_date: dueDate,
        notes,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 sm:grid-cols-5">
      <Field label="Nazwa wydatku">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="np. Ubezpieczenie auta" className="input" />
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
      <Field label="Termin">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Notatka (opcjonalnie)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
      </Field>
      <div className="col-span-2 flex items-end sm:col-span-5">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Dodaj wydatek')}
        </button>
      </div>
    </form>
  )
}
