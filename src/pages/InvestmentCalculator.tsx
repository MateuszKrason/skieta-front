import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { CardLoader } from '../components/Loader'
import { useLanguage } from '../i18n/LanguageContext'
import { useTooltipStyle } from '../lib/chartTooltip'
import { BOND_TYPE_LABELS, formatMoney, formatNumber } from '../lib/format'
import type { CurrentBondOffer } from '../lib/bonds'
import { useAuth } from '../auth/AuthContext'
import { useIsMobile } from '../lib/useIsMobile'

const BELKA_TAX_RATE = 0.19

type Risk = 'bardzo-niskie' | 'niskie' | 'srednie' | 'wysokie'
type BondNature = 'fixed' | 'variable' | 'inflation'

const RISK_META: Record<Risk, { label: string; className: string }> = {
  'bardzo-niskie': {
    label: 'Bardzo niskie',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  niskie: {
    label: 'Niskie',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  srednie: {
    label: 'Średnie',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  wysokie: {
    label: 'Wysokie',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
}

// Which bond types behave which way, drives the assumption text shown per
// row - fixed-rate bonds keep the same rate for the whole term, WIBOR-linked
// ones reset every period, inflation-indexed ones pay a fixed first year then
// inflation + margin after that. Mirrors bonds.models.ANNUALLY_CAPITALIZED_BOND_TYPES
// on the backend (COI/EDO/ROS/ROD), split further into "family" vs regular.
const BOND_NATURE: Record<string, BondNature> = {
  OTS: 'fixed',
  TOS: 'fixed',
  ROR: 'variable',
  DOR: 'variable',
  COI: 'inflation',
  EDO: 'inflation',
  ROS: 'inflation',
  ROD: 'inflation',
}

function bondNatureHint(nature: BondNature | undefined, t: (s: string, ...a: (string | number)[]) => string): string {
  switch (nature) {
    case 'fixed':
      return t('Oprocentowanie stałe przez cały okres trwania obligacji - nie zmienia się.')
    case 'variable':
      return t(
        'Oprocentowanie zmienne, oparte o stawkę WIBOR - resetowane co okres odsetkowy. Pokazana stawka dotyczy tylko pierwszego okresu, kolejne mogą być inne.',
      )
    case 'inflation':
      return t(
        'Pierwszy rok: stałe oprocentowanie. Kolejne lata: inflacja + marża. Pokazana stawka to tylko pierwszy okres - wynik w kolejnych latach zależy od przyszłej inflacji.',
      )
    default:
      return t('Aktualne oprocentowanie z pierwszego okresu odsetkowego (obligacjeskarbowe.pl).')
  }
}

// Real, sourced historical returns for a handful of major indices - used to
// derive one "giełda" assumption instead of a single made-up guess. Total
// return (dividends reinvested) where available. Checked 2026-08-23; these
// are historical figures, not a forecast, and are shown to the user broken
// down exactly like this so the assumption isn't a black box.
const STOCK_INDEX_SOURCES: { key: string; name: string; period: string; cagr: number; note: string }[] = [
  {
    key: 'wig20tr',
    name: 'Beta ETF WIG20TR (GPW, polskie blue chipy)',
    period: '10 lat',
    cagr: 8.7,
    note: 'Karta funduszu Beta ETF WIG20TR, styczeń 2026: +130,45% w 10 lat.',
  },
  {
    key: 'mwig40tr',
    name: 'Beta ETF mWIG40TR (GPW, polskie średnie spółki)',
    period: '10 lat',
    cagr: 12.0,
    note: 'Karta funduszu Beta ETF mWIG40TR, styczeń 2026: +211,43% w 10 lat.',
  },
  {
    key: 'sp500',
    name: 'ETF na S&P 500 (USA)',
    period: '20 lat',
    cagr: 11.2,
    note: 'Dane rynkowe, sierpień 2026 (z reinwestowanymi dywidendami).',
  },
  {
    key: 'nasdaq',
    name: 'ETF na Nasdaq Composite (USA)',
    period: '10 lat',
    cagr: 12.4,
    note: 'Dane rynkowe, lipiec 2026.',
  },
  {
    key: 'msciworld',
    name: 'ETF na MSCI World / FTSE All-World (cały świat)',
    period: '~22 lata',
    cagr: 8.5,
    note: 'Analiza porównawcza indeksów, maj 2026 - obie metodologie dały wynik identyczny.',
  },
]
const STOCK_AVERAGE_RATE =
  Math.round((STOCK_INDEX_SOURCES.reduce((sum, s) => sum + s.cagr, 0) / STOCK_INDEX_SOURCES.length) * 10) / 10

interface StaticInstrument {
  key: string
  label: string
  defaultRate: number
  risk: Risk
  hint: string
}

const STATIC_INSTRUMENTS: StaticInstrument[] = [
  {
    key: 'lokata',
    label: 'Lokata bankowa',
    defaultRate: 4.0,
    risk: 'bardzo-niskie',
    hint: 'Przykładowe oprocentowanie roczne - zmień na stawkę z oferty swojego banku. Środki chronione gwarancją BFG do 100 000 EUR.',
  },
  {
    key: 'oszczednosciowe',
    label: 'Konto oszczędnościowe',
    defaultRate: 3.0,
    risk: 'bardzo-niskie',
    hint: 'Przykładowe oprocentowanie - zwykle zmienne, bank może je zmienić w dowolnym momencie. Też objęte gwarancją BFG.',
  },
  {
    key: 'obligacje-korporacyjne',
    label: 'PZU Dłużny Korporacyjny',
    defaultRate: 6.8,
    risk: 'srednie',
    hint: 'PZU Dłużny Korporacyjny był jednym z 3 najlepszych polskich funduszy obligacji korporacyjnych w rankingu Analizy.pl za 2025 (obok Ipopema Obligacji Korporacyjnych i Generali Obligacji Krótkoterminowy). Pokazana stawka to średnia całej kategorii w 2025 - 6,81% (Analizy.pl), nie zweryfikowany wynik akurat tego funduszu. Wyższy potencjalny zysk niż obligacje skarbowe, ale dochodzi ryzyko kredytowe - emitent (firma) może nie spłacić długu, czego Skarb Państwa praktycznie nie ryzykuje. Kupisz go bezpośrednio na inPZU (in.pzu.pl - własna platforma TFI PZU, min. wpłata 100 zł), przez Biuro Maklerskie Pekao, albo w supermarketach funduszy typu KupFundusz.pl.',
  },
  {
    key: 'fundusz-zrownowazony',
    label: 'Investor Zrównoważony',
    defaultRate: 7.0,
    risk: 'srednie',
    hint: 'Realny, 25-letni fundusz Investors TFI (ok. 55% akcje/45% obligacje) - najlepszy polski fundusz zrównoważony w 20-letnim zestawieniu Analizy.pl, ze wzrostem wartości niemal 4-krotnym w 20 lat (~7% średniorocznie). Mniej zmienny niż czysto akcyjny portfel dzięki stałej części obligacyjnej, ale wciąż może stracić na wartości w słabym roku dla akcji - 2021-2022 było dla niego wyraźnie słabszym okresem. Kupisz go bezpośrednio przez Investors TFI (investors.pl - platforma funduszy, placówki, doradcy regionalni), przez Biuro Maklerskie Pekao, albo w supermarketach funduszy typu F-Trust czy KupFundusz.pl.',
  },
  {
    key: 'zloto',
    label: 'Złoto (np. Xetra-Gold ETC)',
    defaultRate: 12.0,
    risk: 'srednie',
    hint: 'Xetra-Gold to realny, notowany ETC fizycznie zabezpieczony złotem 1:1 (dostępny też polskim inwestorom), więc jego zwrot odpowiada bezpośrednio cenie złota. Średnioroczna stopa zwrotu złota w PLN za ostatnie 20 lat: ok. 13% (dealfin.pl/atlasETF) - zaokrąglone tu w dół dla ostrożności, bo ostatnie 5 lat (~23% rocznie) to jeden z najlepszych okresów w historii i nie powinien być traktowany jako typowy. Nie generuje odsetek ani dywidendy - zysk to wyłącznie zmiana ceny kruszcu, a TER ok. 0,36% rocznie to dodatkowy koszt nieuwzględniony tutaj.',
  },
  {
    key: 'gielda',
    label: 'Giełda (średnio, szeroki rynek)',
    defaultRate: STOCK_AVERAGE_RATE,
    risk: 'wysokie',
    hint: 'Średnia z 5 ETF-ów/indeksów pokazanych osobno niżej w tej tabeli - historyczna, nie gwarantowana. Realny wynik pojedynczego roku może być mocno na plusie albo na minusie.',
  },
]

function futureValue(amount: number, ratePct: number, years: number): number {
  return amount * (1 + ratePct / 100) ** years
}

function afterBelkaTax(profit: number): number {
  return profit > 0 ? profit * (1 - BELKA_TAX_RATE) : profit
}

export default function InvestmentCalculator() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const base = user?.profile.base_currency ?? 'PLN'
  const tooltipStyle = useTooltipStyle()
  const isMobile = useIsMobile()
  const [amount, setAmount] = useState('10000')
  const [years, setYears] = useState(5)
  const [rateOverrides, setRateOverrides] = useState<Record<string, string>>({})
  const [openHintKey, setOpenHintKey] = useState<string | null>(null)

  const { data: bondOffer, isLoading: bondsLoading } = useQuery({
    queryKey: ['bonds-current-offer'],
    queryFn: async () => (await api.get<CurrentBondOffer>('/bonds/current-offer/')).data,
    staleTime: 60 * 60 * 1000,
  })

  const amountNum = Number(amount) || 0

  const baseRows = useMemo(() => {
    const bondRows = Object.entries(bondOffer ?? {})
      .filter(([, entry]) => entry.rate !== null)
      .map(([code, entry]) => ({
        key: `bond-${code}`,
        label: t(BOND_TYPE_LABELS[code] ?? code),
        defaultRate: Number(entry.rate),
        risk: 'bardzo-niskie' as Risk,
        hint:
          entry.source === 'fallback'
            ? `${t('Ostatnia znana stawka - nie udało się pobrać bieżącej oferty.')} ${bondNatureHint(BOND_NATURE[code], t)}`
            : bondNatureHint(BOND_NATURE[code], t),
      }))
    const staticRows = STATIC_INSTRUMENTS.map((i) => ({
      key: i.key,
      label: t(i.label),
      defaultRate: i.defaultRate,
      risk: i.risk,
      hint: t(i.hint),
    }))
    // The 5 ETFs/indices behind the blended "Giełda" row above, shown
    // individually too so they're directly comparable/editable instead of
    // being buried in a separate explainer table.
    const indexRows = STOCK_INDEX_SOURCES.map((s) => ({
      key: `index-${s.key}`,
      label: s.name,
      defaultRate: s.cagr,
      risk: 'wysokie' as Risk,
      hint: t('Średnioroczna stopa zwrotu z ostatnich {0} ({1} rocznie) - {2}', s.period, `${formatNumber(s.cagr, 1)}%`, t(s.note)),
    }))
    return [...bondRows, ...staticRows, ...indexRows]
  }, [bondOffer, t])

  const rows = useMemo(() => {
    return baseRows
      .map((row) => {
        const override = rateOverrides[row.key]
        const rate = override !== undefined && override !== '' ? Number(override) || 0 : row.defaultRate
        const finalValue = futureValue(amountNum, rate, years)
        const profit = finalValue - amountNum
        const profitAfterTax = afterBelkaTax(profit)
        return { ...row, rate, finalValue, profit, profitAfterTax, finalValueAfterTax: amountNum + profitAfterTax }
      })
      .sort((a, b) => b.finalValueAfterTax - a.finalValueAfterTax)
  }, [baseRows, rateOverrides, amountNum, years])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('Kalkulator inwestycyjny')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t(
            'Podaj kwotę i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów, po podatku Belki (19%). Stawki obligacji skarbowych są pobierane na bieżąco, pozostałe oprocentowania możesz dowolnie zmienić.',
          )}
        </p>
        <p className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          {t(
            'To nie jest porada inwestycyjna ani rekomendacja - to tylko symulacja na podstawie oprocentowań, które sam(a) wybierasz lub które są historyczne. Realne wyniki mogą się różnić, szczególnie dla giełdy.',
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Kwota do zainwestowania')}</span>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input w-40"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Horyzont (lata)')}</span>
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))}
              className="input w-24"
            />
          </label>
        </div>
      </div>

      {bondsLoading ? (
        <CardLoader />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('Wynik po {0} {1} (po podatku Belki)', years, years === 1 ? t('roku') : t('latach'))}
            </p>
            <div style={{ height: Math.max(256, rows.length * (isMobile ? 48 : 34)) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ left: 8, right: isMobile ? 46 : 90 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={isMobile ? 90 : 170}
                    tick={{ fontSize: isMobile ? 10 : 11 }}
                    interval={0}
                  />
                  <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, base)} />
                  <Bar
                    dataKey="finalValueAfterTax"
                    name={t('Wartość końcowa po podatku')}
                    fill="#059669"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="finalValueAfterTax"
                      position="right"
                      formatter={(value: unknown) => formatMoney(value as number, base)}
                      style={{ fontSize: isMobile ? 9 : 11, fill: 'currentColor' }}
                      className="fill-slate-700 dark:fill-slate-200"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-3">{t('Instrument')}</th>
                  <th className="pb-2 pr-3">{t('Ryzyko')}</th>
                  <th className="pb-2 pr-3">{t('Oprocentowanie')}</th>
                  <th className="pb-2 pr-3">{t('Zysk (brutto)')}</th>
                  <th className="pb-2 pr-3">{t('Zysk po podatku Belki')}</th>
                  <th className="pb-2 pr-3">{t('Wartość końcowa po podatku')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-slate-100 dark:border-slate-700 align-top">
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        {row.label}
                        <button
                          type="button"
                          title={row.hint}
                          onClick={() => setOpenHintKey((prev) => (prev === row.key ? null : row.key))}
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                            openHintKey === row.key
                              ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                              : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-accent-500 hover:text-accent-600 dark:text-slate-500 dark:hover:text-accent-400'
                          }`}
                        >
                          i
                        </button>
                      </span>
                      {openHintKey === row.key && (
                        <p className="mt-1 max-w-xs text-xs font-normal text-slate-400 dark:text-slate-500">{row.hint}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_META[row.risk].className}`}>
                        {t(RISK_META[row.risk].label)}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        step="0.01"
                        value={rateOverrides[row.key] ?? String(row.defaultRate)}
                        onChange={(e) => setRateOverrides((prev) => ({ ...prev, [row.key]: e.target.value }))}
                        className="input w-24 tabular-nums"
                      />
                      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">%</span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {formatMoney(row.profit, base)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatMoney(row.profitAfterTax, base)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {formatMoney(row.finalValueAfterTax, base)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('Skąd wzięło się założenie dla giełdy ({0}% rocznie)?', formatNumber(STOCK_AVERAGE_RATE, 1))}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t(
                'To średnia z historycznych, średniorocznych stóp zwrotu 5 głównych indeksów akcyjnych (z reinwestowanymi dywidendami, gdzie dostępne) - nie prognoza, tylko punkt odniesienia. Te same 5 pozycji jest też pokazanych osobno w tabeli powyżej.',
              )}
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400">
                    <th className="pb-1.5 pr-3">{t('Indeks')}</th>
                    <th className="pb-1.5 pr-3">{t('Okres')}</th>
                    <th className="pb-1.5 pr-3">{t('Średniorocznie')}</th>
                    <th className="pb-1.5 pr-3">{t('Źródło')}</th>
                  </tr>
                </thead>
                <tbody>
                  {STOCK_INDEX_SOURCES.map((s) => (
                    <tr key={s.key} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-200">{s.name}</td>
                      <td className="py-1.5 pr-3 text-slate-500 dark:text-slate-400">{s.period}</td>
                      <td className="py-1.5 pr-3 tabular-nums text-slate-700 dark:text-slate-200">
                        {formatNumber(s.cagr, 1)}%
                      </td>
                      <td className="py-1.5 pr-3 text-slate-400 dark:text-slate-500">{s.note}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 dark:border-slate-600 font-semibold">
                    <td className="py-1.5 pr-3 text-slate-800 dark:text-slate-100" colSpan={2}>
                      {t('Średnia z powyższych')}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums text-slate-900 dark:text-slate-100">
                      {formatNumber(STOCK_AVERAGE_RATE, 1)}%
                    </td>
                    <td className="py-1.5 pr-3" />
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {t(
                'WIG20 i mWIG40 to indeksy warszawskiej giełdy (duże i średnie spółki), S&P 500 i Nasdaq to główne indeksy amerykańskie, a MSCI World / FTSE All-World obejmuje akcje z całego świata. Powyższe okresy to najdłuższe, dla których znalazłem wiarygodne, publicznie dostępne dane - dla WIG20/mWIG40 to karty funduszy śledzących te indeksy. Historyczne wyniki nie gwarantują przyszłych - pojedyncze lata potrafią być mocno ujemne.',
              )}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
