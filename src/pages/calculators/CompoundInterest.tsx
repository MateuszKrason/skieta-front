import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { num } from '../../lib/calculators'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import { compoundGrowth, type TaxMode } from '../../lib/savingsMath'

const TAX_MODES: { value: TaxMode; label: string; hint: string }[] = [
  { value: 'each', label: 'Lokata albo konto oszczędnościowe', hint: 'podatek od każdych dopisanych odsetek' },
  { value: 'end', label: 'Fundusz albo ETF akumulujący', hint: 'podatek raz, przy wypłacie' },
  { value: 'none', label: 'IKE albo bez podatku', hint: 'cały zysk zostaje' },
]

const PERIODS: { value: number; label: string }[] = [
  { value: 12, label: 'co miesiąc' },
  { value: 4, label: 'co kwartał' },
  { value: 1, label: 'raz w roku' },
]

export default function CompoundInterest() {
  const { t } = useLanguage()
  const [initial, setInitial] = useState('10000')
  const [monthly, setMonthly] = useState('300')
  const [rate, setRate] = useState('5')
  const [years, setYears] = useState('10')
  const [periods, setPeriods] = useState(12)
  const [taxMode, setTaxMode] = useState<TaxMode>('each')

  const result = useMemo(
    () =>
      compoundGrowth({
        initial: num(initial),
        monthly: num(monthly),
        annualRatePct: num(rate),
        years: Math.min(60, Math.max(0, num(years))),
        periodsPerYear: periods,
        taxMode,
      }),
    [initial, monthly, rate, years, periods, taxMode],
  )
  const peak = Math.max(1, ...result.rows.map((row) => row.value))

  return (
    <CalculatorShell
      path="/kalkulator/procent-skladany"
      title="Kalkulator procentu składanego"
      lead="Wpisz, ile masz, ile dokładasz co miesiąc i na ile procent. Zobaczysz, ile z końcowej kwoty to Twoje wpłaty, a ile dopisały odsetki, już po podatku Belki."
      method={[
        'Wpłata trafia na konto na początku każdego miesiąca i od razu zaczyna pracować.',
        'Odsetki naliczają się co miesiąc, a do kapitału są dopisywane tak często, jak wybierzesz: co miesiąc, co kwartał albo raz w roku.',
        'Przy lokacie i koncie oszczędnościowym bank zabiera 19% z każdych dopisanych odsetek, więc pieniądze rosną w tempie 81% oprocentowania.',
        'Przy funduszu albo ETF-ie akumulującym podatek płacisz raz, od całego zysku przy wypłacie. Do tego czasu pracuje także ta część, którą później oddasz.',
      ]}
      faq={[
        {
          question: 'Co to jest procent składany?',
          answer:
            'To odsetki od odsetek. Po pierwszym okresie zarabia już nie tylko Twoja wpłata, ale też to, co do niej dopisano. Na krótkim dystansie różnica jest mała, po kilkunastu latach odsetki potrafią dopisać więcej niż Ty sam.',
        },
        {
          question: 'Dlaczego wynik jest niższy niż w innych kalkulatorach?',
          answer:
            'Bo większość kalkulatorów pokazuje kwotę przed podatkiem. Tu od razu widzisz to, co naprawdę zostaje: po 19% podatku od zysków kapitałowych.',
        },
        {
          question: 'Czy częstsza kapitalizacja dużo zmienia?',
          answer:
            'Mniej, niż się wydaje. Przy 5% rocznie różnica między kapitalizacją miesięczną a roczną to około 0,1 punktu procentowego. Znacznie więcej zmienia wysokość wpłat i liczba lat.',
        },
      ]}
      articles={[
        { slug: 'procent-skladany-na-przykladach-w-zlotych', title: 'Procent składany na przykładach w złotych' },
        { slug: 'podatek-belki-ile-realnie-zostaje-z-twojego-zysku', title: 'Podatek Belki - ile realnie zostaje z Twojego zysku' },
        { slug: 'ile-odkladac-z-pensji-jak-policzyc-swoja-kwote', title: 'Ile odkładać z pensji - jak policzyć swoją kwotę' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Kwota na start">
            <NumberInput value={initial} onChange={setInitial} step="100" suffix="zł" />
          </Field>
          <Field label="Wpłata co miesiąc">
            <NumberInput value={monthly} onChange={setMonthly} step="50" suffix="zł" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Oprocentowanie roczne">
              <NumberInput value={rate} onChange={setRate} step="0.1" suffix="%" />
            </Field>
            <Field label="Na ile lat">
              <NumberInput value={years} onChange={setYears} step="1" min="1" suffix={t('lat')} />
            </Field>
          </div>
          <Field label="Odsetki dopisywane">
            <select
              value={periods}
              onChange={(e) => setPeriods(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-base text-slate-900 dark:text-slate-100"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.label)}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Gdzie trzymasz pieniądze')}</legend>
            {TAX_MODES.map((mode) => (
              <label key={mode.value} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="tax-mode"
                  className="mt-1"
                  checked={taxMode === mode.value}
                  onChange={() => setTaxMode(mode.value)}
                />
                <span>
                  {t(mode.label)}
                  <span className="block text-xs text-slate-400 dark:text-slate-500">{t(mode.hint)}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </form>

        <div className="space-y-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
            <ResultRow label="Zostaje po podatku" value={formatMoney(result.finalValue)} strong />
            <ResultRow label="Twoje wpłaty" value={formatMoney(result.contributed)} />
            <ResultRow label="Dopisane odsetki na rękę" value={formatMoney(result.gain)} />
            <ResultRow label="Podatek Belki" value={formatMoney(result.tax)} />
          </dl>

          {result.rows.length > 0 && (
            <div>
              <div className="flex h-40 items-end gap-1" aria-hidden="true">
                {result.rows.map((row) => (
                  <div key={row.year} className="flex h-full flex-1 flex-col justify-end" title={`${row.year}: ${formatMoney(row.value)}`}>
                    <div
                      className="rounded-t-sm bg-accent-500"
                      style={{ height: `${(Math.max(0, row.value - row.contributed) / peak) * 100}%` }}
                    />
                    <div
                      className="bg-slate-300 dark:bg-slate-600"
                      style={{ height: `${(Math.min(row.contributed, row.value) / peak) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                  {t('wpłaty')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-500" />
                  {t('odsetki')}
                </span>
                <span>{t('rok po roku, od 1 do {0}', String(result.rows.length))}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {result.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full min-w-[24rem] text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <th className="px-4 py-2.5 font-medium">{t('Po roku')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('Wpłacone')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('Na koncie')}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <td className="px-4 py-2">{row.year}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(row.contributed)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{formatMoney(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {taxMode === 'end' && (
            <p className="border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              {t('Kolumna „Na koncie” pokazuje wartość przed podatkiem, który zapłacisz dopiero przy wypłacie.')}
            </p>
          )}
        </div>
      )}
    </CalculatorShell>
  )
}
