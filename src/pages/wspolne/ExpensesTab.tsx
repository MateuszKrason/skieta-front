import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../lib/format'
import { apiError, memberName, splitsApi, type SplitExpense, type SplitState } from '../../lib/splits'
import ExpenseForm from './ExpenseForm'
import { CARD, DANGER, ErrorText, PRIMARY, SECONDARY } from './ui'

function shareLabel(expense: SplitExpense, value: string) {
  return expense.split_mode === 'percent' ? `${formatNumber(Number(value))}%` : ''
}

function ExpenseRow({
  expense,
  state,
  token,
  meId,
  onState,
  onEdit,
}: {
  expense: SplitExpense
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onEdit: () => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const groupCurrency = state.group.currency
  const foreign = expense.currency !== groupCurrency
  const mine = meId !== null ? expense.shares.find((s) => s.member === meId) : undefined

  const remove = useMutation({
    mutationFn: () => splitsApi.removeExpense(token, expense.id),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się usunąć wydatku.'))),
  })

  return (
    <li className="py-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{expense.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span title={t('Kto zapłacił')}>💳 {memberName(state.members, expense.paid_by, meId, t)}</span>
            <span>{formatDate(expense.date)}</span>
            {expense.tags.map((tag) => (
              <span key={tag} className="text-accent-700 dark:text-accent-400">
                #{tag}
              </span>
            ))}
            {expense.exported && <span className="text-emerald-700 dark:text-emerald-400">✓ {t('w Twoim budżecie')}</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatMoney(expense.amount, expense.currency)}
          </p>
          {foreign && (
            <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              ≈ {formatMoney(expense.amount_group, groupCurrency)}
            </p>
          )}
          {mine && (
            <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {t('Twoja część: {0}', formatMoney(mine.owed, expense.currency))}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
          {expense.description && (
            <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">{expense.description}</p>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {expense.split_mode === 'equal'
                ? t('Podział po równo')
                : expense.split_mode === 'percent'
                  ? t('Podział procentowy')
                  : t('Podział kwotowy')}
            </p>
            <ul className="mt-1 space-y-0.5">
              {expense.shares.map((s) => (
                <li key={s.member} className="flex justify-between gap-3 text-slate-700 dark:text-slate-300">
                  <span>
                    {memberName(state.members, s.member, meId, t)}
                    {shareLabel(expense, s.value) && (
                      <span className="ml-1 text-xs text-slate-400">({shareLabel(expense, s.value)})</span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(s.owed, expense.currency)}
                    {foreign && (
                      <span className="ml-1 text-xs text-slate-400">≈ {formatMoney(s.owed_group, groupCurrency)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {foreign && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expense.rate_source === 'manual'
                ? t('Kurs wpisany ręcznie: 1 {0} = {1} {2}', expense.currency, expense.rate, groupCurrency)
                : t('Kurs średni NBP: 1 {0} = {1} {2}', expense.currency, expense.rate, groupCurrency)}
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('Dodane {0}', formatDateTime(expense.created_at))}
            {expense.created_by !== null && ` · ${memberName(state.members, expense.created_by, meId, t)}`}
            {new Date(expense.updated_at).getTime() - new Date(expense.created_at).getTime() > 1000 && (
              <>
                {' · '}
                {t('zmienione {0}', formatDateTime(expense.updated_at))}
                {expense.updated_by !== null && ` · ${memberName(state.members, expense.updated_by, meId, t)}`}
              </>
            )}
          </p>
          <ErrorText>{error}</ErrorText>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{t('Usunąć ten wydatek dla wszystkich?')}</span>
              <button type="button" className={DANGER} onClick={() => remove.mutate()} disabled={remove.isPending}>
                {t('Tak, usuń')}
              </button>
              <button type="button" className={SECONDARY} onClick={() => setConfirming(false)}>
                {t('Nie')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" className={SECONDARY} onClick={onEdit}>
                {t('Edytuj')}
              </button>
              <button type="button" className={DANGER} onClick={() => setConfirming(true)}>
                {t('Usuń')}
              </button>
            </div>
          )}
          {expense.exported && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {t('Ten wydatek jest już w Twoim budżecie. Zmiana tutaj nie poprawi tamtej transakcji.')}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

export default function ExpensesTab({
  state,
  token,
  meId,
  onState,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const expenses = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return [...state.expenses]
      .filter((e) => !tag || e.tags.includes(tag))
      .filter(
        (e) =>
          !needle ||
          e.title.toLowerCase().includes(needle) ||
          e.description.toLowerCase().includes(needle) ||
          e.tags.some((x) => x.toLowerCase().includes(needle)),
      )
      .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  }, [state.expenses, tag, search])

  const filteredTotal = expenses.reduce((sum, e) => sum + Number(e.amount_group), 0)
  const editingExpense = state.expenses.find((e) => e.id === editing)

  return (
    <div className="space-y-4">
      {adding || editingExpense ? (
        <ExpenseForm
          key={editingExpense?.id ?? 'new'}
          state={state}
          token={token}
          meId={meId}
          expense={editingExpense}
          onDone={(next) => {
            onState(next)
            setAdding(false)
            setEditing(null)
          }}
          onCancel={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      ) : (
        <button type="button" className={`${PRIMARY} w-full py-2.5 text-base sm:w-auto`} onClick={() => setAdding(true)}>
          {t('+ Dodaj wydatek')}
        </button>
      )}

      <div className={CARD}>
        {state.expenses.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-3xl">🧾</p>
            <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">{t('Jeszcze nic tu nie ma.')}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('Dodaj pierwszy wydatek. Każdy z linkiem może dopisywać swoje.')}
            </p>
          </div>
        ) : (
          <>
            {(state.tags.length > 0 || state.expenses.length > 6) && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {state.expenses.length > 6 && (
                  <input
                    className="input w-full sm:w-56"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Szukaj wydatku…')}
                  />
                )}
                {state.tags.map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setTag(tag === x ? null : x)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${
                      tag === x
                        ? 'border-accent-600 bg-accent-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-accent-500'
                    }`}
                  >
                    #{x}
                  </button>
                ))}
              </div>
            )}
            {(tag || search) && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Pasujące wydatki: {0}, razem {1}', String(expenses.length), formatMoney(filteredTotal, state.group.currency))}
              </p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  state={state}
                  token={token}
                  meId={meId}
                  onState={onState}
                  onEdit={() => {
                    setAdding(false)
                    setEditing(expense.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
