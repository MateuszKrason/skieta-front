import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import YearShareCard from '../components/YearShareCard'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate, formatMoney, formatNumber } from '../lib/format'
import { monthName, shareLines, type YearReview as Review } from '../lib/yearReview'

const LOCALES: Record<string, string> = { pl: 'pl-PL', en: 'en-US', de: 'de-DE', es: 'es-ES' }
const CARD = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm'

function Figure({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className={CARD}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      {children && <div className="mt-1.5 space-y-1 text-sm text-slate-500 dark:text-slate-400">{children}</div>}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  )
}

export default function YearReview() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const locale = LOCALES[language] ?? 'pl-PL'
  const base = user?.profile.base_currency ?? 'PLN'
  // In January the year worth looking back on is the one that just ended.
  const [year, setYear] = useState(() => {
    const now = new Date()
    return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  })
  const [amounts, setAmounts] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['year-review', year],
    queryFn: async () => (await api.get<Review>('/networth/year-review/', { params: { year } })).data,
  })

  const money = (value: string | null | undefined) => formatMoney(value ?? null, base, 0)
  const signedMoney = (value: string) => `${Number(value) > 0 ? '+' : ''}${money(value)}`
  const pct = (value: string | null) => (value === null ? '' : `${formatNumber(value, Number(value) % 1 === 0 ? 0 : 1)}%`)

  const lines = useMemo(
    () => (data ? shareLines(data, { amounts, locale, money: (value) => formatMoney(value, base, 0) }, t) : []),
    [data, amounts, locale, base, t],
  )

  if (isLoading) return <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
  if (isError || !data) {
    return <p className="text-sm text-red-600 dark:text-red-400">{t('Nie udało się przygotować podsumowania. Spróbuj ponownie za chwilę.')}</p>
  }

  const { facts, net_worth: worth } = data
  const peak = Math.max(1, ...data.months.flatMap((m) => [Number(m.income), Number(m.expense)]))
  const subtitle = data.is_current_year ? t('stan na {0}', formatDate(data.through)) : t('cały rok w liczbach')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Twój rok {0} w skiecie', String(data.year))}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {data.is_current_year
              ? t('Rok jeszcze trwa, więc to podsumowanie do {0}. Wróć w grudniu po pełny obraz.', formatDate(data.through))
              : t('Sześć liczb, które mówią o roku więcej niż saldo, i kilka faktów, które po prostu miło znać.')}
          </p>
        </div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Rok')}
          <select value={data.year} onChange={(e) => setYear(Number(e.target.value))} className="input mt-1 block w-28">
            {[...data.available_years].reverse().map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!data.has_data ? (
        <div className={CARD}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('Za {0} rok nie ma jeszcze danych. Dodaj pierwsze wydatki i wpływy, a podsumowanie zacznie się wypełniać.', String(data.year))}
          </p>
          <Link to="/budzet" className="btn-primary mt-3 inline-block">
            {t('Przejdź do budżetu')}
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('Sześć liczb')}>
            {worth && (
              <Figure label={t('Majątek')} value={signedMoney(worth.change)}>
                <p>
                  {worth.change_pct !== null && `${Number(worth.change_pct) > 0 ? '+' : ''}${pct(worth.change_pct)} `}
                  {t('od {0}', formatDate(worth.since))}
                </p>
              </Figure>
            )}
            {worth && (
              <Figure label={t('Z czego to się wzięło')} value={money(worth.saved)}>
                <p>{t('tyle zostało z dochodów zapisanych w budżecie')}</p>
                <p>
                  {t(
                    'Pozostała różnica: {0}. To wynik inwestycji i wszystko, czego w budżecie nie ma.',
                    signedMoney(worth.market_and_rest),
                  )}
                </p>
              </Figure>
            )}
            {data.savings_rate_pct !== null && (
              <Figure label={t('Stopa oszczędności')} value={pct(data.savings_rate_pct)}>
                <p>{t('{0} z {1} dochodu', money(data.saved), money(data.income_total))}</p>
              </Figure>
            )}
            {data.fixed_costs_monthly !== null && (
              <Figure label={t('Koszty stałe')} value={t('{0} miesięcznie', money(data.fixed_costs_monthly))}>
                {data.fixed_costs_share_pct !== null && <p>{t('{0} średniego dochodu', pct(data.fixed_costs_share_pct))}</p>}
              </Figure>
            )}
            {data.top_categories.length > 0 && (
              <Figure label={t('Największa kategoria wydatków')} value={data.top_categories[0].name ?? t('Bez kategorii')}>
                {data.top_categories.map((category) => (
                  <p key={category.name ?? ''}>
                    {category.name ?? t('Bez kategorii')}: {money(category.total)} ({pct(category.share_pct)})
                  </p>
                ))}
              </Figure>
            )}
            {data.cushion && (
              <Figure label={t('Poduszka')} value={t('{0} mies.', formatNumber(data.cushion.months, 1))}>
                <p>
                  {t(
                    '{0} na kontach i lokatach przy średnich wydatkach {1} miesięcznie. Stan na dziś.',
                    money(data.cushion.liquid),
                    money(data.average_monthly_expense),
                  )}
                </p>
              </Figure>
            )}
          </section>

          {facts.transaction_count > 0 && (
            <section className={CARD}>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Miesiąc po miesiącu')}</h2>
              <div className="mt-4 flex h-40 items-end gap-1.5 sm:gap-3" aria-hidden="true">
                {data.months.map((month) => (
                  <div key={month.month} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="flex h-full items-end gap-0.5">
                      <div className="flex-1 rounded-t-sm bg-accent-500" style={{ height: `${(Number(month.income) / peak) * 100}%` }} />
                      <div className="flex-1 rounded-t-sm bg-slate-300 dark:bg-slate-600" style={{ height: `${(Number(month.expense) / peak) * 100}%` }} />
                    </div>
                    <span className="mt-1 truncate text-center text-[10px] uppercase text-slate-400 dark:text-slate-500">
                      {new Date(2000, month.month - 1, 1).toLocaleDateString(locale, { month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500" />
                  {t('wpływy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                  {t('wydatki')}
                </span>
              </p>
            </section>
          )}

          <section className={CARD}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Rok w kilku faktach')}</h2>
            <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
              <Fact label={t('Zapisane wydatki i wpływy')} value={String(facts.transaction_count)} />
              <Fact label={t('Dni z jakimkolwiek wpisem')} value={String(facts.days_with_entries)} />
              {facts.active_days > 0 && <Fact label={t('Dni ze skietą')} value={String(facts.active_days)} />}
              {facts.best_month && Number(facts.best_month.saved) > 0 && (
                <Fact
                  label={t('Najlepszy miesiąc')}
                  value={t('{0}, odłożone {1}', monthName(facts.best_month.month, locale), money(facts.best_month.saved))}
                />
              )}
              {facts.priciest_month && (
                <Fact
                  label={t('Najdroższy miesiąc')}
                  value={`${monthName(facts.priciest_month.month, locale)}, ${money(facts.priciest_month.expense)}`}
                />
              )}
              {facts.biggest_expense && (
                <Fact
                  label={t('Największy pojedynczy wydatek')}
                  value={`${money(facts.biggest_expense.amount)}${
                    facts.biggest_expense.description || facts.biggest_expense.category
                      ? `, ${facts.biggest_expense.description || facts.biggest_expense.category}`
                      : ''
                  }`}
                />
              )}
              {facts.favourite_store && (
                <Fact
                  label={t('Najczęściej odwiedzany sklep')}
                  value={t('{0}, {1} razy', facts.favourite_store.name, String(facts.favourite_store.visits))}
                />
              )}
              {facts.dividends && <Fact label={t('Dywidendy brutto')} value={money(facts.dividends)} />}
              {facts.realized_gain && <Fact label={t('Wynik ze sprzedanych akcji, przed podatkiem')} value={signedMoney(facts.realized_gain)} />}
              {facts.goal_contributions && <Fact label={t('Odłożone na cele')} value={money(facts.goal_contributions)} />}
              {facts.goals_total > 0 && (
                <Fact label={t('Osiągnięte cele')} value={t('{0} z {1}', String(facts.goals_reached), String(facts.goals_total))} />
              )}
            </dl>
          </section>

          {lines.length > 0 && (
            <section className={CARD}>
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">{t('Pochwal się rokiem')}</h2>
              <YearShareCard
                year={data.year}
                title={t('Mój rok {0}', String(data.year))}
                subtitle={subtitle}
                lines={lines}
                amounts={amounts}
                onAmountsChange={setAmounts}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
