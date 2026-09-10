import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../api/client'
import { ScanReceiptButton } from '../../components/ScanReceiptButton'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import type { BankAccount, Category, Currency, ParsedReceipt, ReceiptItem, Store } from '../../types'

/** Money on a receipt is exact to the grosz, and this code adds up a lot of
 * small numbers before comparing the result against a printed total. Doing
 * that in floating point produces the classic 0.1 + 0.2 problem and would
 * fail a reconciliation that is actually correct, so every amount is handled
 * as an integer number of grosze and only turned back into złote to display. */
function toGrosze(amount: string): number {
  const parsed = Number(String(amount).replace(',', '.'))
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100)
}

function fromGrosze(grosze: number): string {
  return (grosze / 100).toFixed(2)
}

/** Gemini is asked to echo a category name back exactly as it was given, but
 * "exactly" is not something to rely on - match case-insensitively and give
 * up rather than guessing at anything fuzzier. */
function matchCategory(name: string | null, categories: Category[]): number | null {
  if (!name) return null
  const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return found?.id ?? null
}

type Assignment = number | 'excluded' | null

/** The user ticks the handful of categories this receipt is likely to fall
 * into before taking the photo. Two things come out of that: Gemini chooses
 * from four names instead of twenty, which it gets right far more often, and
 * the review below is already down to the groups the user expects to see. */
export function ReceiptSplitPicker({
  categories,
  onParsed,
  onNeedsGeminiKey,
  onError,
  onCancel,
}: {
  categories: Category[]
  onParsed: (receipt: ParsedReceipt, chosen: number[]) => void
  onNeedsGeminiKey: () => void
  onError: (message: string) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [chosen, setChosen] = useState<number[]>([])

  function toggle(id: number) {
    setChosen((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const chosenNames = categories.filter((c) => chosen.includes(c.id)).map((c) => c.name)

  return (
    <div className="space-y-4 rounded-xl border border-accent-300 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('Podziel paragon na kategorie')}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t(
            'Zaznacz kategorie, które spodziewasz się na tym paragonie, a potem zrób zdjęcie. Przejdziemy produkt po produkcie i rozdzielimy kwotę między te kategorie.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = chosen.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-accent-600 bg-accent-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {chosen.length === 0
          ? t('Nic nie zaznaczone - Gemini wybierze spośród wszystkich Twoich kategorii.')
          : t('Zaznaczone: {0}', String(chosen.length))}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <ScanReceiptButton
          split
          categoryNames={chosenNames}
          label={t('📷 Zrób zdjęcie i podziel')}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
          onParsed={(receipt) => onParsed(receipt, chosen)}
          onNeedsGeminiKey={onNeedsGeminiKey}
          onError={onError}
        />
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline"
        >
          {t('Anuluj')}
        </button>
      </div>

      {/* Said before the photo, not after a failure: the stronger model this
          needs has a far smaller daily allowance than the everyday scan. */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t('💡 Podział czyta paragon dokładniej, ale zużywa mocniejszy model - zostaw go na większe zakupy.')}
      </p>
    </div>
  )
}

/** What the user checks before anything is written. Grouped by category
 * rather than listed as thirty rows: nobody wants to approve thirty
 * dropdowns on a phone, and the thing being decided is how much went to
 * food, not which yoghurt it was. Individual products are one tap away for
 * the cases where the grouping is wrong. */
export function ReceiptSplitReview({
  receipt,
  categories,
  accounts,
  stores,
  onSaved,
  onCancel,
}: {
  receipt: ParsedReceipt
  categories: Category[]
  accounts: BankAccount[]
  stores: Store[]
  onSaved: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const items: ReceiptItem[] = useMemo(() => receipt.items ?? [], [receipt.items])

  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    items.map((item) => matchCategory(item.category_name, categories) ?? matchCategory(receipt.category_name, categories)),
  )
  const [expanded, setExpanded] = useState<string | null>(null)
  const [leftoverCategory, setLeftoverCategory] = useState<number | null>(null)
  const [currency] = useState<Currency>((receipt.currency as Currency) ?? 'PLN')
  const [date, setDate] = useState(receipt.date ?? new Date().toISOString().slice(0, 10))
  const [account, setAccount] = useState<number | ''>('')
  const [store, setStore] = useState<number | ''>(
    () => stores.find((s) => s.name.toLowerCase() === (receipt.store_name ?? '').toLowerCase())?.id ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  const includedGrosze = items.reduce(
    (sum, item, index) => (assignments[index] === 'excluded' ? sum : sum + toGrosze(item.amount)),
    0,
  )
  // A receipt whose SUMA line came out blank or unreadable used to make this
  // screen unusable: the total was 0, so every item looked like an overshoot
  // and the save button never enabled, with a message about a discrepancy
  // that did not exist. When there is no printed total to reconcile against,
  // the items themselves are the best total available - and the user can
  // still see and correct every row.
  const printedTotalGrosze = toGrosze(receipt.amount ?? '0')
  const hasPrintedTotal = printedTotalGrosze > 0
  const totalGrosze = hasPrintedTotal ? printedTotalGrosze : includedGrosze
  const leftoverGrosze = totalGrosze - includedGrosze
  // Items adding up to more than the receipt means a line was read twice or
  // a price misread. There is no honest way to guess which, so saving is
  // blocked until the user removes something - a wrong split is worse than
  // no split.
  const overshoot = leftoverGrosze < 0

  const groups = useMemo(() => {
    const byCategory = new Map<number | null, { total: number; indexes: number[] }>()
    items.forEach((item, index) => {
      const assignment = assignments[index]
      if (assignment === 'excluded') return
      const key = assignment
      const group = byCategory.get(key) ?? { total: 0, indexes: [] }
      group.total += toGrosze(item.amount)
      group.indexes.push(index)
      byCategory.set(key, group)
    })
    return [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [items, assignments])

  function assign(index: number, value: Assignment) {
    setAssignments((prev) => prev.map((current, i) => (i === index ? value : current)))
  }

  function assignWholeGroup(indexes: number[], value: Assignment) {
    setAssignments((prev) => prev.map((current, i) => (indexes.includes(i) ? value : current)))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const rows = groups.map(([categoryId, group]) => ({
        category: categoryId,
        amount: fromGrosze(group.total),
        description: [receipt.store_name, categories.find((c) => c.id === categoryId)?.name]
          .filter(Boolean)
          .join(' - '),
      }))
      if (leftoverGrosze > 0) {
        rows.push({
          category: leftoverCategory,
          amount: fromGrosze(leftoverGrosze),
          description: [receipt.store_name, t('reszta paragonu')].filter(Boolean).join(' - '),
        })
      }
      return api.post('/budget/transactions/split/', {
        type: 'expense',
        date,
        currency,
        account: account === '' ? null : account,
        store: store === '' ? null : store,
        total: fromGrosze(totalGrosze),
        items: rows,
      })
    },
    onSuccess: onSaved,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać podziału.'))
      }
    },
  })

  const categoryName = (id: number | null) =>
    id === null ? t('Bez kategorii') : (categories.find((c) => c.id === id)?.name ?? t('Bez kategorii'))

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {receipt.store_name
              ? t('Paragon: {0}', receipt.store_name)
              : t('Podział paragonu')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Odczytano {0} pozycji na {1}', String(items.length), formatMoney(fromGrosze(totalGrosze), currency))}
          </p>
          {!hasPrintedTotal && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
              {t('Nie udało się odczytać sumy z paragonu - liczymy ją z pozycji poniżej. Sprawdź, czy się zgadza.')}
            </p>
          )}
          {receipt.degraded === 'lite_model' && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
              {t('Podziału dokonał prostszy model - warto sprawdzić pozycje.')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline"
        >
          {t('Anuluj')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="block">{t('Data')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1" />
        </label>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="block">{t('Sklep (opcjonalnie)')}</span>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value ? Number(e.target.value) : '')}
            className="input mt-1"
          >
            <option value="">{t('bez sklepu')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="block">{t('Konto (opcjonalnie)')}</span>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')}
            className="input mt-1"
          >
            <option value="">{t('bez powiązania')}</option>
            {accounts
              .filter((a) => a.currency === currency)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank_name} - {a.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
        {groups.map(([categoryId, group]) => {
          const key = String(categoryId)
          const isOpen = expanded === key
          return (
            <div key={key}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="flex items-center gap-2 text-left text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <span className="text-xs text-slate-400 dark:text-slate-500">{isOpen ? '▾' : '▸'}</span>
                  {categoryName(categoryId)}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                    {t('({0} poz.)', String(group.indexes.length))}
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(fromGrosze(group.total), currency)}
                  </span>
                  <select
                    value={categoryId ?? ''}
                    onChange={(e) => assignWholeGroup(group.indexes, e.target.value ? Number(e.target.value) : null)}
                    className="input w-40"
                    title={t('Przenieś całą grupę do innej kategorii')}
                  >
                    <option value="">{t('bez kategorii')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {isOpen && (
                <ul className="space-y-1 bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                  {group.indexes.map((index) => (
                    <li key={index} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="flex-1 text-slate-600 dark:text-slate-400">{items[index].name}</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatMoney(items[index].amount, currency)}
                      </span>
                      <select
                        value={assignments[index] === 'excluded' ? 'excluded' : (assignments[index] ?? '')}
                        onChange={(e) =>
                          assign(index, e.target.value === 'excluded' ? 'excluded' : e.target.value ? Number(e.target.value) : null)
                        }
                        className="input w-36"
                      >
                        <option value="">{t('bez kategorii')}</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="excluded">{t('pomiń tę pozycję')}</option>
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* The reconciliation, stated plainly. A receipt whose lines do not add
          up to its own total is the normal case, not an error - discounts and
          deposits are printed separately - so the difference gets a row of
          its own to assign rather than being hidden. */}
      {leftoverGrosze > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('Reszta paragonu')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('Różnica między sumą pozycji a kwotą paragonu - np. rabat albo nieodczytany wiersz.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatMoney(fromGrosze(leftoverGrosze), currency)}
            </span>
            <select
              value={leftoverCategory ?? ''}
              onChange={(e) => setLeftoverCategory(e.target.value ? Number(e.target.value) : null)}
              className="input w-40"
            >
              <option value="">{t('bez kategorii')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {overshoot && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {t(
            'Pozycje sumują się do {0}, czyli więcej niż kwota paragonu ({1}). Pomiń błędnie odczytaną pozycję, żeby zapisać.',
            formatMoney(fromGrosze(includedGrosze), currency),
            formatMoney(fromGrosze(totalGrosze), currency),
          )}
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Zapiszemy {0} transakcji na łączną kwotę {1}', String(groups.length + (leftoverGrosze > 0 ? 1 : 0)), formatMoney(fromGrosze(totalGrosze), currency))}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null)
            saveMutation.mutate()
          }}
          disabled={overshoot || saveMutation.isPending || groups.length === 0}
          className="btn-primary disabled:opacity-60"
        >
          {saveMutation.isPending ? t('Zapisuję…') : t('Zapisz podział')}
        </button>
      </div>
    </div>
  )
}
