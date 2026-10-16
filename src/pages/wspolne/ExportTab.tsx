import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatMoney } from '../../lib/format'
import { apiError, splitsApi, type SplitState } from '../../lib/splits'
import { CARD, ErrorText, Field, PRIMARY } from './ui'

export default function ExportTab({ state, token, onState }: { state: SplitState; token: string; onState: (s: SplitState) => void }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['split-export', token, state.expenses.length, state.group.updated_at],
    queryFn: () => splitsApi.exportPreview(token),
  })
  // Everything not yet moved starts ticked; this holds only what was unticked.
  const [skipped, setSkipped] = useState<Record<number, boolean>>({})
  const [categories, setCategories] = useState<Record<number, string>>({})
  const [account, setAccount] = useState('')
  const [addTags, setAddTags] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState<number | null>(null)

  const pending = useMemo(() => (data?.items ?? []).filter((i) => !i.exported), [data])
  const exported = useMemo(() => (data?.items ?? []).filter((i) => i.exported), [data])

  const chosen = pending.filter((i) => !skipped[i.expense])
  const paidByMe = chosen.filter((i) => i.paid_by_me)
  const accounts = data?.accounts ?? []

  const run = useMutation({
    mutationFn: () =>
      splitsApi.export(token, {
        items: chosen.map((i) => ({ expense: i.expense, category: categories[i.expense] ? Number(categories[i.expense]) : null })),
        account: account ? Number(account) : null,
        add_tags: addTags,
      }),
    onSuccess: (next) => {
      setDone(next.exported_count ?? 0)
      onState(next)
      queryClient.invalidateQueries({ queryKey: ['split-export', token] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (e) => setError(apiError(e, t('Nie udało się przenieść wydatków.'))),
  })

  if (isLoading) return <CardLoader />
  if (loadError || !data) {
    return (
      <div className={CARD}>
        <ErrorText>{apiError(loadError, t('Nie udało się wczytać wydatków do przeniesienia.'))}</ErrorText>
      </div>
    )
  }

  function setAllCategories(value: string) {
    setCategories(Object.fromEntries(pending.map((i) => [i.expense, value])))
  }

  return (
    <div className="space-y-4">
      <div className={`${CARD} space-y-4`}>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Przenieś do swojego budżetu')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t(
              'Każdy wydatek trafi do Twoich transakcji jako jeden wpis. Za to, co zapłacono za Ciebie, wpisze się Twoja część. Za to, co płaciłeś(-aś) za innych, cała kwota, z resztą oznaczoną jako wyłożona za innych - więc w statystykach liczy się tylko Twoja część.',
            )}
          </p>
        </div>

        {done !== null && (
          <p className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
            {t('Przeniesione wydatki: {0}.', String(done))}{' '}
            <Link to="/budzet/wydatki" className="font-medium underline">
              {t('Zobacz w budżecie')}
            </Link>
          </p>
        )}

        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.items.length === 0
              ? t('Nie masz tu jeszcze żadnych wydatków ani udziałów.')
              : t('Wszystko, w czym brałeś(-aś) udział, jest już w Twoim budżecie.')}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={chosen.length === pending.length}
                  onChange={(e) => setSkipped(Object.fromEntries(pending.map((i) => [i.expense, !e.target.checked])))}
                />
                {t('Zaznacz wszystkie ({0})', String(pending.length))}
              </label>
              {data.categories.length > 0 && (
                <select className="input w-auto" value="" onChange={(e) => e.target.value !== '' && setAllCategories(e.target.value === '-' ? '' : e.target.value)}>
                  <option value="">{t('Ustaw kategorię wszystkim…')}</option>
                  <option value="-">{t('Bez kategorii')}</option>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
              {pending.map((item) => (
                <li key={item.expense} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={!skipped[item.expense]}
                    onChange={(e) => setSkipped({ ...skipped, [item.expense]: !e.target.checked })}
                    aria-label={item.title}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(item.date)} ·{' '}
                      {item.paid_by_me
                        ? Number(item.for_others) > 0
                          ? t('płacisz całość, {0} za innych', formatMoney(item.for_others, item.currency))
                          : t('płacisz całość')
                        : t('Twoja część')}
                      {item.currency !== item.expense_currency &&
                        ` · ${t('przeliczone z {0}', formatMoney(item.paid_by_me ? item.expense_amount : item.my_part, item.expense_currency))}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatMoney(item.amount, item.currency)}
                  </span>
                  <select
                    className="input w-full sm:w-44"
                    value={categories[item.expense] ?? ''}
                    onChange={(e) => setCategories({ ...categories, [item.expense]: e.target.value })}
                    aria-label={t('Kategoria')}
                  >
                    <option value="">{t('Bez kategorii')}</option>
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              {paidByMe.length > 0 && accounts.length > 0 && (
                <Field
                  label={t('Konto, z którego płaciłeś(-aś) (opcjonalnie)')}
                  hint={t('Zmniejszy saldo tego konta, ale tylko o wydatki w jego walucie. Bez konta wydatki nie ruszą salda.')}
                >
                  <select className="input" value={account} onChange={(e) => setAccount(e.target.value)}>
                    <option value="">{t('Bez konta')}</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.bank_name ? ` · ${a.bank_name}` : ''} ({a.currency})
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <label className="flex items-start gap-2 self-center text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="mt-0.5" checked={addTags} onChange={(e) => setAddTags(e.target.checked)} />
                <span>
                  {t('Dodaj tagi: „{0}” i tagi wydatków', state.group.name)}
                  <span className="block text-xs text-slate-400">{t('Łatwo potem policzyć cały wyjazd w statystykach.')}</span>
                </span>
              </label>
            </div>

            <ErrorText>{error}</ErrorText>
            <button
              type="button"
              className={PRIMARY}
              disabled={run.isPending || chosen.length === 0}
              onClick={() => {
                setError('')
                setDone(null)
                run.mutate()
              }}
            >
              {run.isPending ? t('Przenoszenie…') : t('Przenieś zaznaczone ({0})', String(chosen.length))}
            </button>
          </>
        )}
      </div>

      {exported.length > 0 && (
        <div className={CARD}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('Już w Twoim budżecie')}</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {exported.map((item) => (
              <li key={item.expense} className="flex justify-between gap-3">
                <span className="truncate">✓ {item.title}</span>
                <span className="tabular-nums">{formatMoney(item.amount, item.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {t('Usunięcie transakcji w budżecie pozwoli przenieść ten wydatek jeszcze raz.')}
          </p>
        </div>
      )}
    </div>
  )
}
