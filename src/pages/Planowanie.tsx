import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { CardLoader, PageLoader } from '../components/Loader'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate, formatMoney } from '../lib/format'
import type {
  BudgetPlan,
  Category,
  Currency,
  PlannedExpense,
  PlanningSummary,
  RecurringExpense,
  SavingsGoal,
  SavingsGoalContribution,
} from '../types'

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
  const [showAddFixed, setShowAddFixed] = useState(false)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['planning-summary'],
    queryFn: async () => (await api.get<PlanningSummary>('/planning/summary/')).data,
  })

  const { data: plan } = useQuery({
    queryKey: ['planning-plan'],
    queryFn: async () => (await api.get<BudgetPlan>('/planning/plan/')).data,
  })

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['planning-goals'],
    queryFn: async () => (await api.get<SavingsGoal[]>('/planning/goals/')).data,
  })

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['planning-expenses'],
    queryFn: async () => (await api.get<PlannedExpense[]>('/planning/expenses/')).data,
  })

  const { data: fixedCosts, isLoading: fixedCostsLoading } = useQuery({
    queryKey: ['planning-recurring'],
    queryFn: async () => (await api.get<RecurringExpense[]>('/planning/recurring-expenses/')).data,
  })

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/')).data,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['planning-summary'] })
    queryClient.invalidateQueries({ queryKey: ['planning-plan'] })
    queryClient.invalidateQueries({ queryKey: ['planning-goals'] })
    queryClient.invalidateQueries({ queryKey: ['planning-expenses'] })
    queryClient.invalidateQueries({ queryKey: ['planning-recurring'] })
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

  const deleteFixed = useMutation({
    mutationFn: (id: number) => api.delete(`/planning/recurring-expenses/${id}/`),
    onSuccess: invalidateAll,
  })

  const toggleFixedActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/planning/recurring-expenses/${id}/`, { is_active }),
    onSuccess: invalidateAll,
  })

  const base = summary?.base_currency ?? 'PLN'
  const today = new Date().toISOString().slice(0, 10)
  const sortedExpenses = [...(expenses ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date))
  const sortedFixedCosts = [...(fixedCosts ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name))

  if (summaryLoading || goalsLoading || expensesLoading || fixedCostsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Planowanie budżetu')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Twoja pensja, oszczędności, nadchodzące duże wydatki i cele, na które odkładasz.')}
        </p>
      </div>

      <SalaryForm plan={plan} onDone={invalidateAll} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Pensja miesięczna')} value={formatMoney(summary?.monthly_salary, base)} />
        <StatCard label={t('Śr. wydatki (3 mies.)')} value={formatMoney(summary?.avg_monthly_expense, base)} tone="negative" />
        <StatCard label={t('Stałe koszty / mies.')} value={formatMoney(summary?.total_monthly_fixed_costs, base)} tone="negative" />
        <StatCard
          label={t('Wolny budżet / mies.')}
          value={formatMoney(summary?.free_monthly_budget, base)}
          tone={Number(summary?.free_monthly_budget ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Oszczędności (konta)')} value={formatMoney(summary?.current_savings, base)} />
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
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
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
            <GoalRow
              key={g.id}
              goal={g}
              categories={categories ?? []}
              onDelete={() => deleteGoal.mutate(g.id)}
              onChange={invalidateAll}
            />
          ))}
          {goals?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak celów — dodaj pierwszy.')}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Stałe koszty')}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('Czynsz, subskrypcje, ubezpieczenia — cykliczne opłaty co miesiąc, niezależnie od tego, czy już je zapłaciłeś w tym miesiącu.')}
            </p>
          </div>
          <button
            onClick={() => setShowAddFixed((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Stały koszt')}
          </button>
        </div>
        {showAddFixed && (
          <div className="mb-4">
            <AddRecurringExpenseForm
              categories={categories ?? []}
              onDone={() => {
                setShowAddFixed(false)
                invalidateAll()
              }}
            />
          </div>
        )}
        <div className="space-y-2">
          {sortedFixedCosts.map((f) => (
            <RecurringExpenseRow
              key={f.id}
              expense={f}
              categories={categories ?? []}
              onDelete={() => deleteFixed.mutate(f.id)}
              onToggleActive={() => toggleFixedActive.mutate({ id: f.id, is_active: !f.is_active })}
              onChange={invalidateAll}
            />
          ))}
          {sortedFixedCosts.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak stałych kosztów — dodaj pierwszy.')}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Duże wydatki')}</h2>
          <button
            onClick={() => setShowAddExpense((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
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
                    className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
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

function SalaryForm({ plan, onDone }: { plan: BudgetPlan | undefined; onDone: () => void }) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [paydayDay, setPaydayDay] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.patch<BudgetPlan>('/planning/plan/', {
        monthly_salary: salary,
        currency,
        payday_day: paydayDay ? Number(paydayDay) : null,
      }),
    onSuccess: () => {
      setEditing(false)
      onDone()
    },
  })

  function startEditing() {
    setSalary(plan?.monthly_salary ?? '')
    setCurrency(plan?.currency ?? 'PLN')
    setPaydayDay(plan?.payday_day ? String(plan.payday_day) : '')
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
        className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
      >
        {plan?.payday_day
          ? t('Pensja i dzień wypłaty ({0}. dnia miesiąca) — zmień', plan.payday_day)
          : t('Ustaw pensję miesięczną i dzień wypłaty')}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
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
      <Field label="Dzień wypłaty w miesiącu (opcjonalnie)">
        <input
          type="number"
          min={1}
          max={31}
          placeholder="np. 10"
          value={paydayDay}
          onChange={(e) => setPaydayDay(e.target.value)}
          className="input"
        />
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
      <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 sm:col-span-5">
        {t('Dzień wypłaty pozwala policzyć, ile wypłat zostało do terminu każdego celu oszczędnościowego.')}
      </p>
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

function GoalRow({
  goal,
  categories,
  onDelete,
  onChange,
}: {
  goal: SavingsGoal
  categories: Category[]
  onDelete: () => void
  onChange: () => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [mode, setMode] = useState<'view' | 'edit' | 'contribute-payday' | 'contribute-savings'>('view')
  const [showHistory, setShowHistory] = useState(false)
  const [paydayRows, setPaydayRows] = useState<{ amount: string; date: string }[]>([{ amount: '', date: today }])
  const [paydayNote, setPaydayNote] = useState('')
  const [savingsAmount, setSavingsAmount] = useState('')
  const [savingsDate, setSavingsDate] = useState(today)
  const [savingsNote, setSavingsNote] = useState('')
  const progress = goal.progress_pct !== null ? Number(goal.progress_pct) : 0
  const achieved = Number(goal.current_amount) >= Number(goal.target_amount)
  const remaining = Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0)

  const { data: contributions, isLoading: contributionsLoading } = useQuery({
    queryKey: ['goal-contributions', goal.id],
    queryFn: async () =>
      (await api.get<SavingsGoalContribution[]>('/planning/goal-contributions/', { params: { goal: goal.id } })).data,
    enabled: showHistory,
  })

  const contributeBatch = useMutation({
    mutationFn: async (rows: { amount: string; date: string; note: string }[]) => {
      await Promise.all(
        rows.map((r) => api.post('/planning/goal-contributions/', { goal: goal.id, amount: r.amount, date: r.date, note: r.note })),
      )
    },
    onSuccess: () => {
      setPaydayRows([{ amount: '', date: today }])
      setPaydayNote('')
      setSavingsAmount('')
      setSavingsDate(today)
      setSavingsNote('')
      setMode('view')
      queryClient.invalidateQueries({ queryKey: ['goal-contributions', goal.id] })
      onChange()
    },
  })

  const deleteContribution = useMutation({
    mutationFn: (id: number) => api.delete(`/planning/goal-contributions/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-contributions', goal.id] })
      onChange()
    },
  })

  function addPaydayRow() {
    const last = paydayRows[paydayRows.length - 1]
    const nextDate = new Date(last?.date || today)
    nextDate.setMonth(nextDate.getMonth() + 1)
    setPaydayRows([...paydayRows, { amount: '', date: nextDate.toISOString().slice(0, 10) }])
  }

  function updatePaydayRow(index: number, field: 'amount' | 'date', value: string) {
    setPaydayRows(paydayRows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function removePaydayRow(index: number) {
    setPaydayRows(paydayRows.filter((_, i) => i !== index))
  }

  function onSubmitPayday(e: FormEvent) {
    e.preventDefault()
    const rows = paydayRows.filter((r) => r.amount).map((r) => ({ ...r, note: paydayNote }))
    if (rows.length === 0) return
    contributeBatch.mutate(rows)
  }

  function onSubmitSavings(e: FormEvent) {
    e.preventDefault()
    if (!savingsAmount) return
    contributeBatch.mutate([{ amount: savingsAmount, date: savingsDate, note: savingsNote }])
  }

  if (mode === 'edit') {
    return (
      <GoalEditForm
        goal={goal}
        categories={categories}
        onDone={() => {
          setMode('view')
          onChange()
        }}
        onCancel={() => setMode('view')}
      />
    )
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
          {!achieved && goal.target_date && (
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              {goal.paydays_remaining !== null
                ? goal.paydays_remaining > 0
                  ? t('Zostało {0} wypłat — odkładaj ~{1} z każdej, żeby zdążyć', goal.paydays_remaining, formatMoney(goal.suggested_contribution_per_payday, goal.currency))
                  : t('Termin wypłaty minął przed celem — dodaj więcej lub przesuń termin')
                : t('Ustaw dzień wypłaty (u góry strony), żeby zobaczyć ile wypłat zostało do celu')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('contribute-payday')} className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zarezerwuj z wypłaty')}
          </button>
          <button onClick={() => setMode('contribute-savings')} className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zarezerwuj z oszczędności')}
          </button>
          <button onClick={() => setMode('edit')} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline">
            {t('Edytuj')}
          </button>
          <button onClick={() => setShowHistory((v) => !v)} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline">
            {showHistory ? t('Ukryj historię') : t('Historia')}
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
      {mode === 'contribute-payday' && (
        <form onSubmit={onSubmitPayday} className="mt-3 space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('Zarezerwuj część pensji z jednego lub kilku konkretnych miesięcy naraz.')}
          </p>
          {paydayRows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Kwota z wypłaty">
                <input
                  type="number"
                  step="0.01"
                  max={remaining || undefined}
                  value={row.amount}
                  onChange={(e) => updatePaydayRow(i, 'amount', e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Miesiąc wypłaty">
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updatePaydayRow(i, 'date', e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removePaydayRow(i)}
                  disabled={paydayRows.length === 1}
                  className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPaydayRow}
            className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
          >
            {t('+ Dodaj kolejny miesiąc')}
          </button>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Notatka (opcjonalnie)">
              <input value={paydayNote} onChange={(e) => setPaydayNote(e.target.value)} className="input" />
            </Field>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary" disabled={contributeBatch.isPending}>
                {t('Zapisz')}
              </button>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t('Anuluj')}
              </button>
            </div>
          </div>
        </form>
      )}
      {mode === 'contribute-savings' && (
        <form onSubmit={onSubmitSavings} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="Kwota z oszczędności">
            <input
              type="number"
              step="0.01"
              max={remaining || undefined}
              value={savingsAmount}
              onChange={(e) => setSavingsAmount(e.target.value)}
              required
              className="input"
            />
          </Field>
          <Field label="Data">
            <input type="date" value={savingsDate} onChange={(e) => setSavingsDate(e.target.value)} required className="input" />
          </Field>
          <Field label="Notatka (opcjonalnie)">
            <input value={savingsNote} onChange={(e) => setSavingsNote(e.target.value)} className="input" />
          </Field>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary" disabled={contributeBatch.isPending}>
              {t('Zapisz')}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('Anuluj')}
            </button>
          </div>
        </form>
      )}
      {showHistory && (
        <div className="mt-3 space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
          {contributionsLoading && <CardLoader />}
          {(contributions ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                + {formatMoney(c.amount, goal.currency)} · {formatDate(c.date)} {c.note && `— ${c.note}`}
              </span>
              <button
                onClick={() => deleteContribution.mutate(c.id)}
                className="font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                {t('Usuń')}
              </button>
            </div>
          ))}
          {!contributionsLoading && contributions?.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('Brak zarezerwowanych wypłat.')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function GoalEditForm({
  goal,
  categories,
  onDone,
  onCancel,
}: {
  goal: SavingsGoal
  categories: Category[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [name, setName] = useState(goal.name)
  const [targetAmount, setTargetAmount] = useState(goal.target_amount)
  const [currentAmount, setCurrentAmount] = useState(goal.current_amount)
  const [currency, setCurrency] = useState<Currency>(goal.currency)
  const [targetDate, setTargetDate] = useState(goal.target_date ?? '')
  const [notes, setNotes] = useState(goal.notes)
  const [category, setCategory] = useState<number | ''>(goal.category ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/planning/goals/${goal.id}/`, {
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
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-md border border-accent-200 dark:border-accent-800 bg-white dark:bg-slate-800 p-3 sm:grid-cols-6">
      <Field label="Nazwa celu">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
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
      <div className="col-span-2 flex items-end gap-2 sm:col-span-6">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz zmiany')}
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

function AddRecurringExpenseForm({ onDone, categories }: { onDone: () => void; categories: Category[] }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [billingDay, setBillingDay] = useState('')
  const [category, setCategory] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/planning/recurring-expenses/', {
        name,
        amount,
        currency,
        billing_day: billingDay ? Number(billingDay) : null,
        category: category || null,
        notes,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 sm:grid-cols-6">
      <Field label="Nazwa kosztu">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="np. Czynsz" className="input" />
      </Field>
      <Field label="Kwota miesięcznie">
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
      <Field label="Dzień płatności (opcjonalnie)">
        <input type="number" min={1} max={31} placeholder="np. 15" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className="input" />
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
          {t('Dodaj stały koszt')}
        </button>
      </div>
    </form>
  )
}

function RecurringExpenseRow({
  expense,
  categories,
  onDelete,
  onToggleActive,
  onChange,
}: {
  expense: RecurringExpense
  categories: Category[]
  onDelete: () => void
  onToggleActive: () => void
  onChange: () => void
}) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <RecurringExpenseEditForm
        expense={expense}
        categories={categories}
        onDone={() => {
          setEditing(false)
          onChange()
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${expense.is_active ? 'bg-slate-50 dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900 opacity-50'}`}>
      <span>
        <span className={expense.is_active ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through'}>
          {expense.name}
        </span>{' '}
        <span className="text-slate-500 dark:text-slate-400">{formatMoney(expense.amount, expense.currency)}/mies.</span>
        {expense.billing_day && (
          <span className="text-slate-400 dark:text-slate-500"> · {t('{0}. dnia miesiąca', expense.billing_day)}</span>
        )}
        {expense.category_detail && (
          <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            {expense.category_detail.name}
          </span>
        )}
        {expense.notes && <span className="text-slate-400 dark:text-slate-500"> — {expense.notes}</span>}
      </span>
      <span className="flex items-center gap-3">
        <button onClick={onToggleActive} className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
          {expense.is_active ? t('Zatrzymaj') : t('Wznów')}
        </button>
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline">
          {t('Edytuj')}
        </button>
        <button onClick={onDelete} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">
          {t('Usuń')}
        </button>
      </span>
    </div>
  )
}

function RecurringExpenseEditForm({
  expense,
  categories,
  onDone,
  onCancel,
}: {
  expense: RecurringExpense
  categories: Category[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [name, setName] = useState(expense.name)
  const [amount, setAmount] = useState(expense.amount)
  const [currency, setCurrency] = useState<Currency>(expense.currency)
  const [billingDay, setBillingDay] = useState(expense.billing_day ? String(expense.billing_day) : '')
  const [category, setCategory] = useState<number | ''>(expense.category ?? '')
  const [notes, setNotes] = useState(expense.notes)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/planning/recurring-expenses/${expense.id}/`, {
        name,
        amount,
        currency,
        billing_day: billingDay ? Number(billingDay) : null,
        category: category || null,
        notes,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-md border border-accent-200 dark:border-accent-800 bg-white dark:bg-slate-800 p-3 sm:grid-cols-6">
      <Field label="Nazwa kosztu">
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </Field>
      <Field label="Kwota miesięcznie">
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
      <Field label="Dzień płatności (opcjonalnie)">
        <input type="number" min={1} max={31} value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className="input" />
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
      <div className="col-span-2 flex items-end gap-2 sm:col-span-6">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz zmiany')}
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
