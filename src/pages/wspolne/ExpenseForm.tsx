import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AmountInput } from '../../components/AmountInput'
import { ScanReceiptButton } from '../../components/ScanReceiptButton'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney, formatNumber } from '../../lib/format'
import {
  apiError,
  equalAmounts,
  equalPercents,
  previewShares,
  SPLIT_CURRENCIES,
  splitsApi,
  type ExpenseInput,
  type SplitExpense,
  type SplitMode,
  todayIso,
  type SplitState,
} from '../../lib/splits'
import TagChips from './TagChips'
import { CARD, ErrorText, Field, PRIMARY, SECONDARY } from './ui'

const MODES: { mode: SplitMode; label: string }[] = [
  { mode: 'equal', label: 'Po równo' },
  { mode: 'percent', label: 'Procentowo' },
  { mode: 'amount', label: 'Kwotowo' },
]

const lastCurrencyKey = (token: string) => `skieta_split_currency_${token}`

function readLastCurrency(token: string): string | null {
  try {
    return localStorage.getItem(lastCurrencyKey(token))
  } catch {
    return null
  }
}

export default function ExpenseForm({
  state,
  token,
  meId,
  expense,
  onDone,
  onCancel,
}: {
  state: SplitState
  token: string
  meId: number | null
  expense?: SplitExpense
  onDone: (state: SplitState) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const members = state.members
  const memberIds = members.map((m) => m.id)
  const groupCurrency = state.group.currency

  const [title, setTitle] = useState(expense?.title ?? '')
  const [amount, setAmount] = useState(expense?.amount ?? '')
  const [currency, setCurrency] = useState(
    expense?.currency ?? (readLastCurrency(token) || groupCurrency),
  )
  const [date, setDate] = useState(expense?.date ?? todayIso())
  const [paidBy, setPaidBy] = useState<number>(expense?.paid_by ?? meId ?? members[0]?.id)
  const [mode, setMode] = useState<SplitMode>(expense?.split_mode ?? 'equal')
  const [included, setIncluded] = useState<Record<number, boolean>>(() => {
    if (expense) return Object.fromEntries(memberIds.map((id) => [id, expense.shares.some((s) => s.member === id)]))
    return Object.fromEntries(memberIds.map((id) => [id, true]))
  })
  const [values, setValues] = useState<Record<number, string>>(() => {
    if (!expense || expense.split_mode === 'equal') return {}
    return Object.fromEntries(expense.shares.map((s) => [s.member, Number(s.value).toString()]))
  })
  const [description, setDescription] = useState(expense?.description ?? '')
  const [tags, setTags] = useState<string[]>(expense?.tags ?? [])
  const [manualRate, setManualRate] = useState(expense?.rate_source === 'manual' ? expense.rate : '')
  const [error, setError] = useState('')
  const [scanNote, setScanNote] = useState('')

  const foreign = currency !== groupCurrency
  const { data: nbp, isError: nbpMissing } = useQuery({
    queryKey: ['split-rate', token, currency, date],
    queryFn: () => splitsApi.rate(token, currency, date),
    enabled: foreign && !!date,
    retry: false,
    staleTime: 60 * 60 * 1000,
  })
  const rate = foreign ? manualRate || nbp?.rate || '' : '1'

  const preview = useMemo(
    () => previewShares(amount, mode, memberIds, values, included),
    [amount, mode, memberIds, values, included],
  )

  const save = useMutation({
    mutationFn: (body: ExpenseInput) =>
      expense ? splitsApi.updateExpense(token, expense.id, body) : splitsApi.addExpense(token, body),
    onSuccess: (next) => {
      try {
        localStorage.setItem(lastCurrencyKey(token), currency)
      } catch {
        // Only a convenience.
      }
      onDone(next)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się zapisać wydatku.'))),
  })

  function switchMode(next: SplitMode) {
    setMode(next)
    const people = memberIds.filter((id) => included[id])
    if (next === 'percent') {
      const split = equalPercents(people.length)
      setValues(Object.fromEntries(memberIds.map((id) => [id, people.includes(id) ? split[people.indexOf(id)] : ''])))
    } else if (next === 'amount') {
      const split = equalAmounts(amount, people.length)
      setValues(Object.fromEntries(memberIds.map((id) => [id, people.includes(id) ? split[people.indexOf(id)] : ''])))
    }
  }

  function spreadEvenly() {
    const people = memberIds.filter((id) => Number(values[id] || 0) > 0 || included[id])
    const split = mode === 'percent' ? equalPercents(people.length) : equalAmounts(amount, people.length)
    setValues(Object.fromEntries(memberIds.map((id) => [id, people.includes(id) ? split[people.indexOf(id)] : ''])))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (preview.problem) {
      setError(t(preview.problem))
      return
    }
    const shares =
      mode === 'equal'
        ? memberIds.filter((id) => included[id]).map((id) => ({ member: id, value: '1' }))
        : memberIds
            .filter((id) => Number((values[id] || '0').replace(',', '.')) > 0)
            .map((id) => ({ member: id, value: (values[id] || '0').replace(',', '.') }))
    save.mutate({
      title,
      description,
      tags,
      amount,
      currency,
      rate: foreign && manualRate ? manualRate : null,
      date,
      paid_by: paidBy,
      split_mode: mode,
      shares,
    })
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {expense ? t('Edytuj wydatek') : t('Nowy wydatek')}
        </h2>
        <ScanReceiptButton
            label={t('📷 Odczytaj z paragonu')}
            onParsed={(r) => {
              if (r.amount) setAmount(r.amount)
              if (r.currency && (SPLIT_CURRENCIES as readonly string[]).includes(r.currency)) setCurrency(r.currency)
              if (r.date) setDate(r.date)
              if (!title && (r.store_name || r.description)) setTitle((r.store_name || r.description || '').slice(0, 120))
              setScanNote(t('Odczytane z paragonu - sprawdź, czy wszystko się zgadza. Zdjęcie nie zostało nigdzie zapisane.'))
            }}
            onNeedsGeminiKey={() =>
              setScanNote(t('Do odczytu paragonu potrzebny jest Twój klucz Gemini. Dodasz go w ustawieniach konta.'))
            }
            onError={(message) => setScanNote(message)}
          />
      </div>
      {scanNote && (
        <p className="rounded-md bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
          {scanNote}{' '}
          {scanNote.includes('Gemini') && (
            <Link to="/moje-konto" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
              {t('Przejdź do ustawień')}
            </Link>
          )}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <Field label={t('Za co')}>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('np. Zakupy na grilla')}
              maxLength={120}
              required
              autoFocus={!expense}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t('Kwota')}>
            <div className="flex gap-2">
              <AmountInput className="input min-w-0 flex-1" value={amount} onChange={setAmount} required placeholder="0,00" />
              <select className="input w-24" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {SPLIT_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>
        <Field label={t('Data')}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>

      {foreign && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={t('Kurs {0} → {1}', currency, groupCurrency)}
            hint={
              manualRate
                ? t('Kurs wpisany ręcznie, np. ten, po którym rozliczyła Cię karta.')
                : nbpMissing
                  ? t('Nie udało się pobrać kursu z NBP - wpisz go ręcznie.')
                  : t('Kurs średni NBP z dnia wydatku. Możesz wpisać własny.')
            }
          >
            <AmountInput
              className="input"
              value={manualRate || nbp?.rate || ''}
              onChange={setManualRate}
              placeholder={nbpMissing ? t('np. 4,2500') : ''}
            />
          </Field>
          <div className="self-center text-sm text-slate-600 dark:text-slate-400 sm:col-span-2">
            {rate && Number(amount) > 0 && (
              <>
                {t('W walucie rozliczenia:')}{' '}
                <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMoney(Number(amount) * Number(rate), groupCurrency)}
                </strong>
              </>
            )}
            {manualRate && (
              <button
                type="button"
                className="ml-3 text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                onClick={() => setManualRate('')}
              >
                {t('wróć do kursu NBP')}
              </button>
            )}
          </div>
        </div>
      )}

      <Field label={t('Kto zapłacił')}>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaidBy(m.id)}
              className={`rounded-full border px-3 py-1.5 text-sm sm:py-1 ${
                paidBy === m.id
                  ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/30 font-semibold text-accent-800 dark:text-accent-300'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {m.name}
              {m.id === meId ? ` (${t('Ty')})` : ''}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Jak dzielicie')}</p>
          <div className="grid w-full grid-cols-3 rounded-md border border-slate-300 dark:border-slate-600 p-0.5 sm:inline-flex sm:w-auto">
            {MODES.map(({ mode: m, label }) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded px-3 py-1.5 text-sm sm:py-1 ${
                  mode === m
                    ? 'bg-accent-600 font-medium text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
          {members.map((m) => {
            const owed = preview.owed[m.id] ?? 0
            return (
              <li key={m.id} className="flex items-center gap-2 px-3 py-2 sm:gap-3">
                {mode === 'equal' ? (
                  <label className="flex min-w-0 flex-1 items-center gap-2 py-1 text-sm text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!included[m.id]}
                      onChange={(e) => setIncluded({ ...included, [m.id]: e.target.checked })}
                    />
                    {m.name}
                    {m.id === meId ? ` (${t('Ty')})` : ''}
                  </label>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                      {m.name}
                      {m.id === meId ? ` (${t('Ty')})` : ''}
                    </span>
                    <div className="flex w-24 shrink-0 items-center gap-1 sm:w-32">
                      <AmountInput
                        className="input text-right"
                        value={values[m.id] ?? ''}
                        onChange={(v) => setValues({ ...values, [m.id]: v })}
                        placeholder="0"
                        aria-label={m.name}
                      />
                      <span className="w-7 text-xs text-slate-500 sm:w-8">{mode === 'percent' ? '%' : currency}</span>
                    </div>
                  </>
                )}
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400 sm:w-28 sm:text-sm">
                  {owed > 0 ? formatMoney(owed / 100, currency) : '—'}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {preview.problem && amount.trim() ? (
            <span className="text-amber-700 dark:text-amber-400">
              {t(preview.problem)}
              {preview.remainder !== 0 && ' '}
              {preview.remainder > 0 &&
                t('Brakuje {0}.', mode === 'percent' ? `${formatNumber(preview.remainder)}%` : formatMoney(preview.remainder, currency))}
              {preview.remainder < 0 &&
                t(
                  'Za dużo o {0}.',
                  mode === 'percent' ? `${formatNumber(-preview.remainder)}%` : formatMoney(-preview.remainder, currency),
                )}
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400">{Number(amount) > 0 ? t('Podział się zgadza.') : ''}</span>
          )}
          {mode !== 'equal' && (
            <button type="button" className="font-medium text-accent-700 dark:text-accent-400 hover:underline" onClick={spreadEvenly}>
              {t('Rozłóż po równo')}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Opis (opcjonalnie)')}>
          <textarea
            className="input min-h-[2.5rem]"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </Field>
        <TagChips value={tags} onChange={setTags} groupTags={state.tags} />
      </div>

      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button type="submit" className={`${PRIMARY} flex-1 py-2.5 sm:flex-none sm:py-1.5`} disabled={save.isPending}>
          {save.isPending ? t('Zapisywanie…') : expense ? t('Zapisz zmiany') : t('Dodaj wydatek')}
        </button>
        <button type="button" className={`${SECONDARY} py-2.5 sm:py-1.5`} onClick={onCancel}>
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}
