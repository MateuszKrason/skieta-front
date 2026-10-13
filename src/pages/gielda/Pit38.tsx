import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatMoney, formatNumber, formatShareQuantity } from '../../lib/format'

// Amounts arrive as decimal strings: they are tax figures, and a float would
// be the one place in this screen allowed to be a grosz off.
interface Lot {
  date: string
  quantity: string
  price: string
  currency: string
  rate: string | null
  rate_date: string | null
  cost: string | null
}

interface Sale {
  date: string
  ticker: string
  name: string
  account: string | null
  quantity: string
  price: string
  fee: string
  currency: string
  rate: string | null
  rate_date: string | null
  revenue: string | null
  cost: string | null
  result: string | null
  uncovered_quantity: string
  complete: boolean
  lots: Lot[]
}

interface DividendItem {
  date: string
  ticker: string
  currency: string
  gross_original: string
  withheld_original: string
  rate?: string
  rate_date?: string | null
  gross?: string
  withheld?: string
  tax?: string
  deductible?: string
  to_pay?: string
  complete: boolean
}

type Warning =
  | { code: 'missing_rate'; what: string; currency: string; date: string }
  | { code: 'sold_more_than_bought'; ticker: string; date: string; quantity: string }
  | { code: 'sheltered_skipped'; count: number }
  | { code: 'sales_without_account'; count: number }
  | { code: 'withheld_over_treaty' }

interface Pit38Report {
  year: number
  available_years: number[]
  is_current_year: boolean
  complete: boolean
  securities: {
    revenue: string
    costs: string
    income: string
    loss: string
    tax_base: string
    tax: string
    by_account: { account_id: number | null; account: string | null; revenue: string; costs: string; result: string }[]
    sales: Sale[]
  }
  dividends: {
    gross: string
    tax: string
    withheld: string
    deductible: string
    to_pay: string
    to_pay_rounded: string
    treaty_rate_pct: string
    items: DividendItem[]
    domestic_count: number
    domestic_gross: string
  }
  crypto: {
    revenue: string
    costs_this_year: string
    costs_carried_in: string
    income: string
    costs_carried_out: string
    tax_base: string
    tax: string
    has_activity: boolean
    complete: boolean
  }
  previous_years: { year: number; result: string; loss: string; complete: boolean }[]
  warnings: Warning[]
}

const CARD = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm'

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={
          strong
            ? 'text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100'
            : 'text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200'
        }
      >
        {value}
      </dd>
    </div>
  )
}

function Section({ title, part, children }: { title: string; part: string; children: ReactNode }) {
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{part}</span>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function rateLabel(rate: string | null | undefined, rateDate: string | null | undefined): string {
  if (!rate) return ''
  return rateDate ? `${formatNumber(rate, 4)} (${formatDate(rateDate)})` : ''
}

export default function Pit38() {
  const { t } = useLanguage()
  const [year, setYear] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pit38', year],
    queryFn: async () => (await api.get<Pit38Report>('/stocks/pit38/', { params: year ? { year } : {} })).data,
  })

  async function downloadCsv() {
    if (!data) return
    setDownloading(true)
    setDownloadError(false)
    try {
      const response = await api.get('/stocks/pit38/csv/', { params: { year: data.year }, responseType: 'blob' })
      const url = URL.createObjectURL(response.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `skieta-pit38-${data.year}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoking at once can cancel the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setDownloadError(true)
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) return <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
  if (isError || !data) {
    return <p className="text-sm text-red-600 dark:text-red-400">{t('Nie udało się przygotować zestawienia. Spróbuj ponownie za chwilę.')}</p>
  }

  const money = (value: string | null | undefined) => formatMoney(value ?? null, 'PLN')
  const { securities, dividends, crypto } = data
  const losses = data.previous_years.filter((entry) => Number(entry.loss) > 0)
  const hasSales = securities.sales.length > 0
  const hasDividends = dividends.items.length > 0

  function warningText(warning: Warning): string {
    switch (warning.code) {
      case 'missing_rate':
        return t(
          'Nie udało się pobrać kursu NBP dla {0} ({1}) z dnia przed {2}. Ta pozycja nie jest wliczona do sum. Odśwież stronę za chwilę.',
          warning.currency,
          warning.what,
          formatDate(warning.date),
        )
      case 'sold_more_than_bought':
        return t(
          '{0}: sprzedaż z {1} obejmuje {2} szt. więcej, niż masz zapisanych zakupów. Dla tej części koszt wynosi zero, więc podatek wychodzi zawyżony. Dopisz brakujący zakup.',
          warning.ticker,
          formatDate(warning.date),
          formatShareQuantity(warning.quantity),
        )
      case 'sheltered_skipped':
        return t('Pominięte sprzedaże na rachunkach IKE i IKZE: {0}. Nie rozlicza się ich w PIT-38.', String(warning.count))
      case 'sales_without_account':
        return t(
          'Sprzedaże bez wskazanego rachunku: {0}. Kolejność sprzedawanych akcji liczy się osobno dla każdego rachunku maklerskiego, więc przypisz je do rachunków.',
          String(warning.count),
        )
      case 'withheld_over_treaty':
        return t(
          'Od części dywidend pobrano za granicą więcej niż {0}%. Odliczasz tylko stawkę z umowy o unikaniu podwójnego opodatkowania, nadwyżkę odzyskuje się w kraju wypłaty (w USA zapobiega temu formularz W-8BEN).',
          formatNumber(dividends.treaty_rate_pct, 0),
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Pomocnik PIT-38')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t(
              'Liczby do zeznania policzone z Twoich transakcji: kolejność FIFO, kursy NBP z dnia poprzedzającego i prowizje w kosztach. To zestawienie pomocnicze, a nie gotowe zeznanie.',
            )}
          </p>
        </div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Rok podatkowy')}
          <select
            value={data.year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input mt-1 block w-28"
          >
            {[...data.available_years].reverse().map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data.is_current_year && (
        <p className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {t('Rok {0} jeszcze trwa. Te liczby zmienią się z każdą kolejną transakcją.', String(data.year))}
        </p>
      )}

      {data.warnings.length > 0 && (
        <ul className="space-y-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {data.warnings.map((warning, index) => (
            <li key={index}>{warningText(warning)}</li>
          ))}
        </ul>
      )}

      <Section title={t('Akcje i ETF-y')} part={t('część C zeznania')}>
        {hasSales ? (
          <>
            <dl className="divide-y divide-slate-100 dark:divide-slate-700">
              <Row label={t('Przychód')} value={money(securities.revenue)} />
              <Row label={t('Koszty uzyskania przychodu')} value={money(securities.costs)} />
              {Number(securities.loss) > 0 ? (
                <Row label={t('Strata')} value={money(securities.loss)} strong />
              ) : (
                <Row label={t('Dochód')} value={money(securities.income)} strong />
              )}
              <Row label={t('Podatek 19% od dochodu zaokrąglonego do złotych')} value={money(securities.tax)} />
            </dl>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t(
                'Jeśli broker przysłał PIT-8C, przepisujesz jego kwoty do wiersza z PIT-8C i porównujesz z tym, co tutaj. Rachunki bez PIT-8C, zwykle u zagranicznych brokerów, wpisujesz w wierszu „Inne przychody”.',
              )}
            </p>
            {securities.by_account.length > 1 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm tabular-nums">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="py-2 pr-3 font-medium">{t('Rachunek')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('Przychód')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('Koszty')}</th>
                      <th className="py-2 text-right font-medium">{t('Wynik')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securities.by_account.map((account) => (
                      <tr key={account.account_id ?? 'none'} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                        <td className="py-2 pr-3">{account.account ?? t('Bez rachunku')}</td>
                        <td className="py-2 pr-3 text-right">{money(account.revenue)}</td>
                        <td className="py-2 pr-3 text-right">{money(account.costs)}</td>
                        <td className="py-2 text-right font-semibold">{money(account.result)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('W {0} roku nie masz zapisanej sprzedaży akcji ani ETF-ów poza IKE i IKZE.', String(data.year))}
          </p>
        )}
      </Section>

      <Section title={t('Dywidendy z zagranicy')} part={t('część G zeznania')}>
        {hasDividends ? (
          <>
            <dl className="divide-y divide-slate-100 dark:divide-slate-700">
              <Row label={t('Dywidendy brutto')} value={money(dividends.gross)} />
              <Row label={t('Podatek 19%')} value={money(dividends.tax)} />
              <Row label={t('Podatek pobrany za granicą')} value={money(dividends.withheld)} />
              <Row label={t('Z tego do odliczenia')} value={money(dividends.deductible)} />
              <Row label={t('Do dopłaty w Polsce, po zaokrągleniu')} value={money(dividends.to_pay_rounded)} strong />
            </dl>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t(
                'Do odliczenia przyjmujemy najwyżej {0}% dywidendy, czyli stawkę z większości umów podatkowych (m.in. USA, Niemcy, Francja, Holandia). Dla spółek z Wielkiej Brytanii i Włoch umowa mówi o 10%.',
                formatNumber(dividends.treaty_rate_pct, 0),
              )}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-accent-700 dark:text-accent-400">
                {t('Pokaż dywidendy ({0})', String(dividends.items.length))}
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm tabular-nums">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="py-2 pr-3 font-medium">{t('Data')}</th>
                      <th className="py-2 pr-3 font-medium">{t('Spółka')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('Kurs NBP (tabela z dnia)')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('Brutto')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('Pobrano')}</th>
                      <th className="py-2 text-right font-medium">{t('Do dopłaty')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividends.items.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                        <td className="py-2 pr-3">{formatDate(item.date)}</td>
                        <td className="py-2 pr-3">{item.ticker}</td>
                        <td className="py-2 pr-3 text-right">{rateLabel(item.rate, item.rate_date)}</td>
                        <td className="py-2 pr-3 text-right">{item.complete ? money(item.gross) : t('brak kursu')}</td>
                        <td className="py-2 pr-3 text-right">{item.complete ? money(item.withheld) : ''}</td>
                        <td className="py-2 text-right font-semibold">{item.complete ? money(item.to_pay) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('W {0} roku nie masz zapisanych wypłaconych dywidend od zagranicznych spółek.', String(data.year))}
          </p>
        )}
        {dividends.domestic_count > 0 && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t(
              'Dywidendy polskich spółek ({0}) opodatkował już dom maklerski przy wypłacie. Nie wpisujesz ich do zeznania.',
              String(dividends.domestic_count),
            )}
          </p>
        )}
      </Section>

      {crypto.has_activity && (
        <Section title={t('Kryptowaluty')} part={t('część E zeznania')}>
          <dl className="divide-y divide-slate-100 dark:divide-slate-700">
            <Row label={t('Przychód ze sprzedaży')} value={money(crypto.revenue)} />
            <Row label={t('Koszty poniesione w tym roku')} value={money(crypto.costs_this_year)} />
            <Row label={t('Koszty z lat ubiegłych')} value={money(crypto.costs_carried_in)} />
            <Row label={t('Dochód')} value={money(crypto.income)} strong />
            <Row label={t('Podatek 19% od dochodu zaokrąglonego do złotych')} value={money(crypto.tax)} />
            <Row label={t('Koszty do odliczenia w kolejnych latach')} value={money(crypto.costs_carried_out)} />
          </dl>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t(
              'Przy kryptowalutach kosztem jest każdy zakup z danego roku, także wtedy, gdy nie było żadnej sprzedaży. Dlatego zeznanie składa się również za rok, w którym były same zakupy. Zamiana jednej kryptowaluty na drugą nie jest opodatkowana i nie powinna być tu zapisana jako sprzedaż.',
            )}
          </p>
        </Section>
      )}

      {losses.length > 0 && (
        <Section title={t('Straty z poprzednich lat')} part={t('część D zeznania')}>
          <dl className="divide-y divide-slate-100 dark:divide-slate-700">
            {losses.map((entry) => (
              <Row key={entry.year} label={String(entry.year)} value={money(entry.loss)} />
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t(
              'Stratę z akcji i ETF-ów odliczasz od dochodu z tego samego źródła przez pięć kolejnych lat, pod warunkiem że została wykazana w zeznaniu za tamten rok. skieta nie wie, ile z niej zostało już odliczone, więc tej kwoty nie odejmuje sama.',
            )}
          </p>
        </Section>
      )}

      {hasSales && (
        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Sprzedaże krok po kroku')}</h2>
            <button type="button" className="btn-primary" onClick={downloadCsv} disabled={downloading}>
              {downloading ? t('Przygotowuję…') : t('Pobierz wyliczenie (CSV)')}
            </button>
          </div>
          {downloadError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t('Nie udało się pobrać pliku. Spróbuj ponownie za chwilę.')}</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
            {securities.sales.map((sale, index) => (
              <li key={index} className="py-3">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(sale.date)} · {sale.ticker} · {formatShareQuantity(sale.quantity)} {t('szt.')}
                    </span>
                    <span className="tabular-nums text-slate-700 dark:text-slate-200">
                      {sale.complete ? money(sale.result) : t('brak kursu')}
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>
                      {t('Rachunek')}: {sale.account ?? t('Bez rachunku')}
                    </p>
                    <p>
                      {t('Przychód')}: {formatShareQuantity(sale.quantity)} × {formatMoney(sale.price, sale.currency)}
                      {sale.currency !== 'PLN' && sale.rate ? ` × ${rateLabel(sale.rate, sale.rate_date)}` : ''} ={' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{sale.complete ? money(sale.revenue) : t('brak kursu')}</span>
                    </p>
                    {sale.lots.map((lot, lotIndex) => (
                      <p key={lotIndex}>
                        {t('Kupno z {0}', formatDate(lot.date))}: {formatShareQuantity(lot.quantity)} × {formatMoney(lot.price, lot.currency)}
                        {lot.currency !== 'PLN' && lot.rate ? ` × ${rateLabel(lot.rate, lot.rate_date)}` : ''} ={' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{lot.cost ? money(lot.cost) : t('brak kursu')}</span>
                      </p>
                    ))}
                    {sale.complete && (
                      <p>
                        {t('Koszty razem, z prowizjami')}: <span className="font-semibold text-slate-700 dark:text-slate-200">{money(sale.cost)}</span>
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Jak to liczymy')}</h2>
        <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <li>{t('Jako pierwsze sprzedawane są akcje kupione najwcześniej (FIFO), osobno na każdym rachunku maklerskim.')}</li>
          <li>{t('Kwoty w walutach przeliczamy po średnim kursie NBP z ostatniego dnia roboczego przed transakcją: przychód po kursie sprzed sprzedaży, koszt po kursie sprzed zakupu.')}</li>
          <li>{t('Prowizje od zakupu i od sprzedaży są kosztem. Przychodem jest cała cena sprzedaży.')}</li>
          <li>{t('Liczymy od dat wpisanych w transakcjach. Jeśli broker rozlicza transakcję dzień lub dwa później, właściwy kurs może pochodzić z innego dnia.')}</li>
          <li>{t('Transakcje na rachunkach IKE i IKZE są pominięte.')}</li>
        </ul>
        <p className="max-w-3xl text-xs text-slate-400 dark:text-slate-500">
          {t(
            'To zestawienie pomocnicze dla polskich rezydentów podatkowych, a nie porada podatkowa. Nie uwzględnia transakcji, których nie ma w skiecie, ani Twojej indywidualnej sytuacji. Oznaczenia części (C, D, E, G) odpowiadają formularzowi używanemu do rozliczenia za 2024 rok; jeśli w nowym druku są inne, kieruj się nazwami pól. Przed złożeniem zeznania porównaj liczby z dokumentami od brokera, a w razie wątpliwości zapytaj doradcę podatkowego.',
          )}
        </p>
      </section>
    </div>
  )
}
