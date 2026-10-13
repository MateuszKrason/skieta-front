import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { useLanguage } from '../../i18n/LanguageContext'
import { num } from '../../lib/calculators'
import { formatMoney, formatNumber } from '../../lib/format'
import { depositOutcome } from '../../lib/savingsMath'

const PERIODS: { value: number; label: string }[] = [
  { value: 0, label: 'na koniec lokaty' },
  { value: 12, label: 'co miesiąc' },
  { value: 4, label: 'co kwartał' },
  { value: 1, label: 'raz w roku' },
]

export default function Deposit() {
  const { t } = useLanguage()
  const [amount, setAmount] = useState('10000')
  const [rate, setRate] = useState('5')
  const [months, setMonths] = useState('12')
  const [periods, setPeriods] = useState(0)

  const result = useMemo(
    () =>
      depositOutcome({
        amount: num(amount),
        annualRatePct: num(rate),
        months: Math.min(600, Math.max(0, num(months))),
        periodsPerYear: periods,
      }),
    [amount, rate, months, periods],
  )

  return (
    <CalculatorShell
      path="/kalkulator/lokata"
      title="Kalkulator lokaty po podatku Belki"
      lead="Bank podaje oprocentowanie przed podatkiem i w skali roku. Wpisz kwotę, oprocentowanie i czas, a zobaczysz, ile złotych naprawdę wpłynie na konto i ile to jest rocznie po podatku."
      method={[
        'Odsetki liczymy od wpisanej kwoty przez podaną liczbę miesięcy, według oprocentowania w skali roku.',
        'Od każdej wypłaty odsetek bank pobiera 19% podatku Belki. Przy kapitalizacji w trakcie lokaty do kapitału dopisywane są odsetki już po podatku.',
        'Oprocentowanie po podatku w skali roku pozwala porównać lokaty o różnej długości: trzymiesięczną z roczną albo promocję na 90 dni ze zwykłą ofertą.',
      ]}
      faq={[
        {
          question: 'Ile zarobię na lokacie 10 000 zł?',
          answer:
            'Przy 5% w skali roku i wypłacie odsetek na koniec roczna lokata daje 500 zł odsetek, z czego 95 zł to podatek. Na konto wpływa 405 zł. Dla innej kwoty, oprocentowania i czasu wpisz swoje liczby wyżej.',
        },
        {
          question: 'Czy bank sam odprowadza podatek od lokaty?',
          answer: 'Tak. Podatek Belki od odsetek pobiera bank w chwili ich wypłaty. Nie wpisujesz go do żadnego zeznania.',
        },
        {
          question: 'Dlaczego lokata na 7% przez trzy miesiące daje mniej niż 5% przez rok?',
          answer:
            'Bo oprocentowanie zawsze podaje się w skali roku. 7% przez trzy miesiące to jedna czwarta rocznych odsetek, czyli około 1,75% kwoty przed podatkiem. Liczy się też to, na ile procent będą pracować pieniądze po zakończeniu promocji.',
        },
      ]}
      articles={[
        { slug: 'lokata-terminowa-czy-konto-oszczednosciowe', title: 'Lokata czy konto oszczędnościowe - kiedy co się opłaca' },
        { slug: 'lokata-obligacje-czy-gielda-co-wychodzi-lepiej-w-5-lat', title: 'Lokata, obligacje czy giełda - co wychodzi lepiej w 5 lat' },
        { slug: 'podatek-belki-ile-realnie-zostaje-z-twojego-zysku', title: 'Podatek Belki - ile realnie zostaje z Twojego zysku' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Kwota lokaty">
            <NumberInput value={amount} onChange={setAmount} step="500" suffix="zł" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Oprocentowanie roczne">
              <NumberInput value={rate} onChange={setRate} step="0.1" suffix="%" />
            </Field>
            <Field label="Na ile miesięcy">
              <NumberInput value={months} onChange={setMonths} step="1" min="1" suffix={t('mies.')} />
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
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
            <ResultRow label="Odsetki na rękę" value={formatMoney(result.netInterest)} strong />
            <ResultRow label="Odsetki przed podatkiem" value={formatMoney(result.grossInterest)} />
            <ResultRow label="Podatek Belki" value={formatMoney(result.tax)} />
            <ResultRow label="Na koncie po zakończeniu" value={formatMoney(result.finalValue)} />
            <ResultRow label="Oprocentowanie po podatku, w skali roku" value={`${formatNumber(result.netRatePct)}%`} />
          </dl>
        </div>
      </div>
    </CalculatorShell>
  )
}
