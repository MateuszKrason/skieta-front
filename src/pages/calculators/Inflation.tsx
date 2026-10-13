import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { useLanguage } from '../../i18n/LanguageContext'
import { num } from '../../lib/calculators'
import { formatMoney, formatNumber } from '../../lib/format'
import { breakEvenRatePct, realValue } from '../../lib/savingsMath'

export default function Inflation() {
  const { t } = useLanguage()
  const [amount, setAmount] = useState('10000')
  const [inflation, setInflation] = useState('4')
  const [years, setYears] = useState('10')

  const result = useMemo(
    () => realValue(num(amount), num(inflation), Math.min(60, Math.max(0, num(years)))),
    [amount, inflation, years],
  )
  const needed = breakEvenRatePct(num(inflation))

  return (
    <CalculatorShell
      path="/kalkulator/inflacja"
      title="Kalkulator inflacji: ile będą warte Twoje pieniądze"
      lead="Pieniądze, które leżą bez odsetek, co roku kupują trochę mniej. Wpisz kwotę, inflację i liczbę lat, a zobaczysz, ile zostanie z ich siły nabywczej i ile musiałaby płacić lokata, żeby to wyrównać."
      method={[
        'Siła nabywcza to kwota podzielona przez wzrost cen w kolejnych latach: przy inflacji 4% po roku za 10 000 zł kupisz tyle, ile dziś za 9 615 zł.',
        'Inflacja działa jak procent składany, tylko w drugą stronę. Każdy kolejny rok liczy się od wartości już pomniejszonej.',
        'Żeby lokata dotrzymała kroku inflacji, musi płacić więcej niż sama inflacja, bo od odsetek odchodzi 19% podatku. Potrzebne oprocentowanie to inflacja podzielona przez 0,81.',
        'Inflację na przyszłe lata wpisujesz sam. To założenie, a nie prognoza.',
      ]}
      faq={[
        {
          question: 'Ile będzie warte 10 000 zł za 10 lat?',
          answer:
            'Przy inflacji 4% rocznie za 10 000 zł kupisz za dziesięć lat tyle, ile dziś za około 6 756 zł. Na koncie nadal będzie 10 000 zł, ale ceny pójdą w górę o prawie połowę.',
        },
        {
          question: 'Jakie oprocentowanie pokonuje inflację?',
          answer:
            'Takie, które po podatku Belki jest wyższe od inflacji. Przy inflacji 4% lokata musi dawać co najmniej około 4,94% w skali roku, żeby wyjść na zero.',
        },
        {
          question: 'Skąd wziąć wysokość inflacji?',
          answer:
            'Aktualny wskaźnik cen publikuje co miesiąc GUS. Do liczenia na wiele lat lepiej wpisać ostrożną średnią niż ostatni odczyt, bo inflacja z jednego roku rzadko utrzymuje się przez dekadę.',
        },
      ]}
      articles={[
        { slug: 'lokata-obligacje-czy-gielda-co-wychodzi-lepiej-w-5-lat', title: 'Lokata, obligacje czy giełda - co wychodzi lepiej w 5 lat' },
        { slug: 'coi-edo-rod-tos-ktora-obligacje-skarbowa-wybrac', title: 'COI, EDO, ROD, TOS - którą obligację skarbową wybrać' },
        { slug: 'obligacje-skarbowe-jak-dzialaja-i-dla-kogo-sa', title: 'Jak kupić obligacje skarbowe krok po kroku' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Kwota dzisiaj">
            <NumberInput value={amount} onChange={setAmount} step="500" suffix="zł" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inflacja roczna" hint="Twoje założenie na kolejne lata.">
              <NumberInput value={inflation} onChange={setInflation} step="0.1" suffix="%" />
            </Field>
            <Field label="Za ile lat">
              <NumberInput value={years} onChange={setYears} step="1" min="1" suffix={t('lat')} />
            </Field>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
            <ResultRow label="Tyle będą warte w dzisiejszych cenach" value={formatMoney(result.real)} strong />
            <ResultRow label="Utracona siła nabywcza" value={formatMoney(result.lost)} />
            <ResultRow label="Lokata musi dawać co najmniej" value={`${formatNumber(needed)}%`} />
          </dl>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {t('Tyle oprocentowania w skali roku potrzeba, żeby po podatku Belki pieniądze zachowały wartość.')}
          </p>
        </div>
      </div>

      {result.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full min-w-[20rem] text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <th className="px-4 py-2.5 font-medium">{t('Po roku')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('Warte w dzisiejszych cenach')}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <td className="px-4 py-2">{row.year}</td>
                  <td className="px-4 py-2 text-right font-semibold">{formatMoney(row.real)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CalculatorShell>
  )
}
