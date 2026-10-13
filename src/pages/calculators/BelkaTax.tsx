import { useMemo, useState } from 'react'
import CalculatorShell, { Field, NumberInput, ResultRow } from '../../components/CalculatorShell'
import { num } from '../../lib/calculators'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney, formatNumber } from '../../lib/format'
import { breakEvenRatePct, depositInterestTax, saleTax } from '../../lib/savingsMath'

type Mode = 'deposit' | 'sale'

export default function BelkaTax() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<Mode>('deposit')
  const [amount, setAmount] = useState('10000')
  const [rate, setRate] = useState('5')
  const [months, setMonths] = useState('12')
  const [proceeds, setProceeds] = useState('12500')
  const [cost, setCost] = useState('10000')
  const [inflation, setInflation] = useState('4')

  const deposit = useMemo(() => depositInterestTax(num(amount), num(rate), num(months)), [amount, rate, months])
  const sale = useMemo(() => saleTax(num(proceeds), num(cost)), [proceeds, cost])

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={
        mode === value
          ? 'rounded-md bg-accent-700 px-3 py-2 text-sm font-semibold text-white'
          : 'rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      }
    >
      {t(label)}
    </button>
  )

  return (
    <CalculatorShell
      path="/kalkulator/podatek-belki"
      title="Kalkulator podatku Belki"
      lead="Podatek Belki to 19% od zysków z oszczędności i inwestycji. Sprawdź, ile zabierze z odsetek od lokaty albo z zysku ze sprzedaży akcji i ile naprawdę zostanie Ci na rękę."
      method={[
        'Od lokat, kont oszczędnościowych i obligacji bank albo emitent pobiera podatek sam, w chwili wypłaty odsetek. Podstawę i podatek zaokrągla w górę do pełnego grosza.',
        'Od sprzedaży akcji, ETF-ów i jednostek funduszy rozliczasz się sam w PIT-38, raz w roku. Liczy się wynik z całego roku: przychód minus koszty, z podstawą i podatkiem zaokrąglonymi do pełnych złotych.',
        'Zysk i stratę z papierów wartościowych możesz zsumować w ramach jednego roku. Stratę z całego roku odliczysz od zysków przez kolejne pięć lat.',
        'Oprocentowanie po podatku to oprocentowanie nominalne razy 0,81. Żeby lokata dotrzymała kroku inflacji, musi płacić więcej niż inflacja podzielona przez 0,81.',
      ]}
      faq={[
        {
          question: 'Ile wynosi podatek Belki?',
          answer:
            '19% zysku. Dotyczy odsetek od lokat i kont oszczędnościowych, obligacji, dywidend oraz zysków ze sprzedaży akcji, ETF-ów i jednostek funduszy.',
        },
        {
          question: 'Czy podatek Belki trzeba samemu rozliczać?',
          answer:
            'Od lokat, kont i obligacji skarbowych nie, bank lub emitent pobiera go automatycznie. Sprzedaż akcji i ETF-ów rozliczasz w PIT-38 do końca kwietnia następnego roku, a polski broker przyśle Ci do tego PIT-8C.',
        },
        {
          question: 'Jak legalnie nie płacić podatku Belki?',
          answer:
            'Na koncie IKE zysk jest zwolniony z podatku, jeśli wypłacisz pieniądze po 60. roku życia i spełnisz warunek wpłat. IKZE działa inaczej: wpłaty odliczasz od dochodu, a przy wypłacie po 65. roku życia płacisz 10% ryczałtu zamiast podatku Belki. Oba konta mają roczne limity wpłat.',
        },
        {
          question: 'Czy od straty też płaci się podatek?',
          answer:
            'Nie. Jeśli sprzedałeś ze stratą, podatek wynosi zero, a stratę wykazujesz w PIT-38, żeby móc ją odliczyć w kolejnych latach.',
        },
      ]}
      articles={[
        { slug: 'podatek-belki-ile-realnie-zostaje-z-twojego-zysku', title: 'Podatek Belki - ile realnie zostaje z Twojego zysku' },
        { slug: 'lokata-terminowa-czy-konto-oszczednosciowe', title: 'Lokata czy konto oszczędnościowe - kiedy co się opłaca' },
        { slug: 'ike-i-ikze-jak-inwestowac-z-ulga-podatkowa-na-emeryture', title: 'IKE i IKZE - jedyny legalny sposób, żeby nie płacić Belki' },
      ]}
    >
      <div className="space-y-4">
        <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-lg bg-white dark:bg-slate-800 p-1 shadow-sm border border-slate-200 dark:border-slate-700">
          {tab('deposit', 'Lokata, konto, obligacje')}
          {tab('sale', 'Sprzedaż akcji lub ETF')}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {mode === 'deposit' ? (
            <form
              className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <Field label="Kwota">
                <NumberInput value={amount} onChange={setAmount} step="100" suffix="zł" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Oprocentowanie roczne">
                  <NumberInput value={rate} onChange={setRate} step="0.1" suffix="%" />
                </Field>
                <Field label="Na ile miesięcy">
                  <NumberInput value={months} onChange={setMonths} step="1" min="1" suffix={t('mies.')} />
                </Field>
              </div>
              <Field label="Inflacja, z którą chcesz porównać" hint="Wpisz ostatni odczyt GUS albo własne założenie.">
                <NumberInput value={inflation} onChange={setInflation} step="0.1" suffix="%" />
              </Field>
            </form>
          ) : (
            <form
              className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <Field label="Za ile sprzedałeś" hint="Suma ze wszystkich sprzedaży w roku.">
                <NumberInput value={proceeds} onChange={setProceeds} step="100" suffix="zł" />
              </Field>
              <Field label="Ile kosztował zakup" hint="Cena zakupu sprzedanych papierów razem z prowizjami, także tymi od sprzedaży.">
                <NumberInput value={cost} onChange={setCost} step="100" suffix="zł" />
              </Field>
            </form>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            {mode === 'deposit' ? (
              <>
                <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
                  <ResultRow label="Odsetki na rękę" value={formatMoney(deposit.net)} strong />
                  <ResultRow label="Odsetki przed podatkiem" value={formatMoney(deposit.gross)} />
                  <ResultRow label="Podatek Belki" value={formatMoney(deposit.tax)} />
                  <ResultRow label="Oprocentowanie po podatku" value={`${formatNumber(deposit.netRatePct)}%`} />
                </dl>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  {deposit.netRatePct >= num(inflation)
                    ? t(
                        'Po podatku lokata daje {0}% rocznie, czyli więcej niż inflacja {1}%. Pieniądze zachowują wartość.',
                        formatNumber(deposit.netRatePct),
                        formatNumber(num(inflation)),
                      )
                    : t(
                        'Po podatku lokata daje {0}% rocznie, czyli mniej niż inflacja {1}%. Żeby wyjść na zero, musiałaby płacić co najmniej {2}%.',
                        formatNumber(deposit.netRatePct),
                        formatNumber(num(inflation)),
                        formatNumber(breakEvenRatePct(num(inflation))),
                      )}
                </p>
              </>
            ) : (
              <>
                <dl className="divide-y divide-slate-100 dark:divide-slate-700" aria-live="polite">
                  <ResultRow label={sale.profit >= 0 ? 'Zysk na rękę' : 'Strata'} value={formatMoney(sale.net)} strong />
                  <ResultRow label={sale.profit >= 0 ? 'Zysk przed podatkiem' : 'Wynik przed podatkiem'} value={formatMoney(sale.profit)} />
                  <ResultRow label="Podatek Belki" value={formatMoney(sale.tax)} />
                </dl>
                {sale.profit < 0 && (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                    {t(
                      'Od straty nie ma podatku. Wykaż ją w PIT-38, a odliczysz ją od zysków z kolejnych pięciu lat.',
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </CalculatorShell>
  )
}
