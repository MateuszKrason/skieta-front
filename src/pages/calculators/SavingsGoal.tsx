import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { num } from '../../lib/calculators'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import { monthlyForGoal } from '../../lib/savingsMath'

// The same goal on three other timelines, so the trade between "sooner" and
// "less per month" is visible without retyping anything.
const ALTERNATIVES = [-12, -6, 6, 12]

export default function SavingsGoal() {
  const { t } = useLanguage()
  const [target, setTarget] = useState('30000')
  const [saved, setSaved] = useState('2000')
  const [months, setMonths] = useState('24')
  const [rate, setRate] = useState('4')
  const [taxed, setTaxed] = useState(true)

  const input = useMemo(
    () => ({
      target: num(target),
      saved: num(saved),
      months: Math.min(600, Math.max(1, Math.round(num(months)))),
      annualRatePct: num(rate),
      taxed,
    }),
    [target, saved, months, rate, taxed],
  )
  const result = useMemo(() => monthlyForGoal(input), [input])
  const alternatives = ALTERNATIVES.map((delta) => input.months + delta)
    .filter((m) => m >= 1)
    .map((m) => ({ months: m, monthly: monthlyForGoal({ ...input, months: m }).monthly }))

  return (
    <CalculatorShell
      path="/kalkulator/cel-oszczednosciowy"
      title="Ile odkładać miesięcznie, żeby uzbierać na cel"
      lead="Wkład własny, wesele, samochód albo poduszka bezpieczeństwa. Wpisz kwotę i termin, a zobaczysz, ile trzeba odkładać co miesiąc i ile z tego dołożą odsetki."
      method={[
        'Wpłata trafia na konto na początku każdego miesiąca, a odsetki są dopisywane co miesiąc.',
        'Jeśli pieniądze leżą na koncie oszczędnościowym albo lokacie, od odsetek odchodzi 19% podatku Belki, więc liczymy na 81% oprocentowania.',
        'To, co już masz, też pracuje przez cały okres, dlatego liczy się na Twoją korzyść bardziej niż ta sama kwota wpłacana w ratach.',
        'Miesięczna kwota jest zaokrąglona w górę do grosza, żeby cel został osiągnięty, a nie prawie osiągnięty.',
      ]}
      faq={[
        {
          question: 'Jakie oprocentowanie wpisać?',
          answer:
            'Takie, jakie realnie dostajesz na koncie oszczędnościowym albo lokacie, a nie promocyjne na pierwsze trzy miesiące. Jeśli trzymasz pieniądze na zwykłym koncie, wpisz zero.',
        },
        {
          question: 'Co jeśli miesięczna kwota jest za wysoka?',
          answer:
            'Masz trzy ruchy: wydłużyć termin, obniżyć cel albo zacząć z większą kwotą na start. Tabela pod wynikiem pokazuje, jak zmienia się rata, gdy przesuniesz termin o pół roku albo rok.',
        },
        {
          question: 'Czy na cel za kilka lat warto inwestować zamiast oszczędzać?',
          answer:
            'Przy celu z konkretną datą w ciągu trzech do pięciu lat bezpieczniej trzymać pieniądze na lokacie, koncie oszczędnościowym albo w obligacjach skarbowych. Giełda może akurat spaść w miesiącu, w którym potrzebujesz pieniędzy.',
        },
      ]}
      articles={[
        { slug: 'ile-odkladac-z-pensji-jak-policzyc-swoja-kwote', title: 'Ile odkładać z pensji - jak policzyć swoją kwotę' },
        { slug: 'jak-zbudowac-poduszke-bezpieczenstwa-finansowego', title: 'Poduszka bezpieczeństwa - ile odłożyć i gdzie ją trzymać' },
        { slug: 'budzet-domowy-od-zera-pierwszy-miesiac', title: 'Budżet domowy od zera - pierwszy miesiąc krok po kroku' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Ile chcesz uzbierać">
            <NumberInput value={target} onChange={setTarget} step="500" suffix="zł" />
          </Field>
          <Field label="Ile już masz">
            <NumberInput value={saved} onChange={setSaved} step="100" suffix="zł" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Za ile miesięcy">
              <NumberInput value={months} onChange={setMonths} step="1" min="1" suffix={t('mies.')} />
            </Field>
            <Field label="Oprocentowanie roczne">
              <NumberInput value={rate} onChange={setRate} step="0.1" suffix="%" />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" className="mt-0.5" checked={taxed} onChange={(e) => setTaxed(e.target.checked)} />
            <span>
              {t('Od odsetek odchodzi podatek Belki')}
              <span className="block text-xs text-slate-400 dark:text-slate-500">
                {t('Zostaw zaznaczone dla konta oszczędnościowego i lokaty.')}
              </span>
            </span>
          </label>
        </form>

        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          {result.alreadyCovered ? (
            <p className="text-base font-semibold text-accent-700 dark:text-accent-400" aria-live="polite">
              {t('Masz już tyle, ile trzeba. Z samymi odsetkami dojdziesz do celu przed terminem.')}
            </p>
          ) : (
            <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
              <ResultRow label="Odkładaj co miesiąc" value={formatMoney(result.monthly)} strong />
              <ResultRow label="Z Twojej kieszeni razem" value={formatMoney(result.ownMoney)} />
              <ResultRow label="Dołożą odsetki" value={formatMoney(result.fromInterest)} />
            </dl>
          )}

          {!result.alreadyCovered && alternatives.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('A gdyby zmienić termin')}
              </h2>
              <table className="mt-2 w-full text-sm tabular-nums">
                <tbody>
                  {alternatives.map((alt) => (
                    <tr key={alt.months} className="border-t border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                      <td className="py-2">{t('{0} mies.', String(alt.months))}</td>
                      <td className="py-2 text-right font-semibold">{t('{0} miesięcznie', formatMoney(alt.monthly))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
