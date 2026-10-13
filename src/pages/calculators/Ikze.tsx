import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { useLanguage } from '../../i18n/LanguageContext'
import { num } from '../../lib/calculators'
import { formatMoney } from '../../lib/format'
import { ikzeOutcome } from '../../lib/savingsMath'

const RATES: { value: string; label: string }[] = [
  { value: '12', label: '12% - pierwszy próg skali podatkowej' },
  { value: '32', label: '32% - drugi próg skali podatkowej' },
  { value: '19', label: '19% - podatek liniowy' },
]

export default function Ikze() {
  const { t } = useLanguage()
  const [contribution, setContribution] = useState('6000')
  const [rate, setRate] = useState('12')
  const [years, setYears] = useState('20')
  const [annualReturn, setAnnualReturn] = useState('5')

  const result = useMemo(
    () =>
      ikzeOutcome({
        contribution: num(contribution),
        taxRatePct: num(rate),
        years: Math.min(60, Math.max(0, num(years))),
        annualReturnPct: num(annualReturn),
      }),
    [contribution, rate, years, annualReturn],
  )
  const ahead = result.advantage >= 0

  return (
    <CalculatorShell
      path="/kalkulator/ikze"
      title="Kalkulator IKZE: zwrot podatku i wynik po latach"
      lead="Wpłatę na IKZE odliczasz od dochodu, więc część pieniędzy wraca już przy najbliższym rozliczeniu PIT. Sprawdź, ile to złotych rocznie i jak IKZE wypada po latach na tle zwykłego rachunku."
      method={[
        'Zwrot podatku to wpłata razy stawka, według której się rozliczasz: 12% albo 32% na skali, 19% na podatku liniowym.',
        'Wpłacasz raz w roku, a pieniądze rosną według wpisanej stopy zwrotu. To założenie, nie obietnica.',
        'Przy wypłacie po 65. roku życia, po co najmniej pięciu latach wpłat, od całej wypłacanej kwoty odchodzi 10% podatku. Podatku Belki na IKZE nie ma.',
        'Dla porównania liczymy te same wpłaty na zwykłym rachunku, gdzie na końcu płacisz 19% od zysku. Zwrotów podatku nie doliczamy jako reinwestowanych, więc wynik IKZE jest tu raczej zaniżony niż zawyżony.',
      ]}
      faq={[
        {
          question: 'Ile zwrotu podatku daje IKZE?',
          answer:
            'Wpłata 6 000 zł to 720 zł zwrotu w pierwszym progu, 1 140 zł na podatku liniowym i 1 920 zł w drugim progu. Pieniądze wracają po rozliczeniu PIT za rok, w którym była wpłata.',
        },
        {
          question: 'Jaki jest limit wpłat na IKZE?',
          answer:
            'Limit jest ogłaszany co roku i zależy od przeciętnego wynagrodzenia, a osoby prowadzące działalność mają wyższy. Niewykorzystany limit przepada z końcem roku, więc aktualną kwotę sprawdź przed wpłatą.',
        },
        {
          question: 'Kiedy IKZE się nie opłaca?',
          answer:
            'Gdy nie płacisz podatku dochodowego, bo wtedy nie ma czego odliczyć, a przy wypłacie i tak zapłacisz 10%. Słabo wypada też przy wypłacie przed 65. rokiem życia, bo cała wypłacona kwota jest wtedy doliczana do dochodu.',
        },
      ]}
      articles={[
        { slug: 'ike-i-ikze-jak-inwestowac-z-ulga-podatkowa-na-emeryture', title: 'IKE i IKZE - jedyny legalny sposób, żeby nie płacić Belki' },
        { slug: 'etf-y-jak-jednym-zakupem-kupic-caly-rynek', title: 'ETF-y - co naprawdę kupujesz i na co uważać' },
        { slug: 'podatek-belki-ile-realnie-zostaje-z-twojego-zysku', title: 'Podatek Belki - ile realnie zostaje z Twojego zysku' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Wpłata w roku" hint="Nie więcej niż limit na dany rok.">
            <NumberInput value={contribution} onChange={setContribution} step="500" suffix="zł" />
          </Field>
          <Field label="Twoja stawka podatku">
            <select
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-base text-slate-900 dark:text-slate-100"
            >
              {RATES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Przez ile lat">
              <NumberInput value={years} onChange={setYears} step="1" min="1" suffix={t('lat')} />
            </Field>
            <Field label="Zakładany zwrot roczny">
              <NumberInput value={annualReturn} onChange={setAnnualReturn} step="0.5" suffix="%" />
            </Field>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
            <ResultRow label="Zwrot podatku co roku" value={formatMoney(result.refundPerYear)} strong />
            <ResultRow label="Zwroty przez cały okres" value={formatMoney(result.refundTotal)} />
            <ResultRow label="Wartość IKZE na końcu" value={formatMoney(result.value)} />
            <ResultRow label="Podatek 10% przy wypłacie" value={formatMoney(result.exitTax)} />
            <ResultRow label="Z IKZE zostaje, razem ze zwrotami" value={formatMoney(result.netIkze)} />
            <ResultRow label="Ze zwykłego rachunku zostaje" value={formatMoney(result.netRegular)} />
          </dl>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {ahead
              ? t('Przy tych założeniach IKZE daje o {0} więcej niż zwykły rachunek.', formatMoney(result.advantage))
              : t('Przy tych założeniach IKZE daje o {0} mniej niż zwykły rachunek.', formatMoney(-result.advantage))}
          </p>
        </div>
      </div>
    </CalculatorShell>
  )
}
