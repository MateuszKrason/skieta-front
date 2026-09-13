import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { GeminiKeyForm } from '../../components/GeminiKeyForm'
import { CardLoader, Spinner } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatDateTime, formatNumber } from '../../lib/format'
import type {
  AnalysisDividend,
  AnalysisKeyData,
  AnalysisPeriod,
  AnalysisSectionKey,
  CompanyAnalysis,
  CompanyAnalysisOverview,
  Stock,
} from '../../types'

const SELECTED_STOCK_KEY = 'skieta_company_analysis_stock'

const PERIODS: { value: AnalysisPeriod; label: string }[] = [
  { value: 'day', label: 'Dziś' },
  { value: 'week', label: 'Ten tydzień' },
]

// periodBound sections only ever describe the chosen day/week, so "nothing" there is news in itself.
const SECTIONS: { key: AnalysisSectionKey; title: string; periodBound: boolean }[] = [
  { key: 'upcoming_dates', title: 'Najważniejsze nadchodzące daty', periodBound: false },
  { key: 'espi', title: 'Komunikaty ESPI/EBI', periodBound: true },
  { key: 'transactions', title: 'Ważne transakcje', periodBound: true },
  { key: 'financial_results', title: 'Wyniki finansowe', periodBound: false },
  { key: 'rumours', title: 'Plotki i niepotwierdzone doniesienia', periodBound: true },
  { key: 'expectations', title: 'Oczekiwania wobec spółki', periodBound: false },
  { key: 'recommendations', title: 'Rekomendacje analityków', periodBound: false },
  { key: 'company_overview', title: 'Analiza spółki', periodBound: false },
]

const ERROR_MESSAGES: Record<string, string> = {
  quota:
    'Wyczerpał się darmowy dzienny limit zapytań Twojego klucza Gemini. Limit odnawia się codziennie około 9:00 czasu polskiego - wtedy spróbuj ponownie.',
  invalid_key: 'Google odrzucił Twój klucz Gemini. Sprawdź go albo wklej nowy w ustawieniach konta.',
  no_key: 'Nie ustawiono klucza Gemini.',
  timeout: 'Sprawdzanie trwało za długo i zostało przerwane. Spróbuj ponownie za chwilę.',
}

const DIVIDEND_STATUS_LABELS: Record<NonNullable<AnalysisDividend['status']>, string> = {
  recommended: 'rekomendacja zarządu',
  approved: 'uchwalona przez walne zgromadzenie',
  paid: 'wypłacona',
}

function readSavedStockId(): number | null {
  try {
    const saved = localStorage.getItem(SELECTED_STOCK_KEY)
    return saved ? Number(saved) : null
  } catch {
    return null
  }
}

function saveStockId(id: number) {
  try {
    localStorage.setItem(SELECTED_STOCK_KEY, String(id))
  } catch {
    // Storage blocked - the choice just won't survive a reload.
  }
}

/** Turns the model's "[3]" markers into links to the matching material. */
function Cited({ text, sources }: { text: string; sources: CompanyAnalysis['sources'] }) {
  return (
    <>
      {text.split(/(\[\d+\])/g).map((part, i) => {
        const match = /^\[(\d+)\]$/.exec(part)
        if (!match) return part
        const source = sources[Number(match[1]) - 1]
        if (!source) return null
        const label = `${source.source}: ${source.title}`
        return source.url ? (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={label}
            className="ml-0.5 align-super text-[10px] font-semibold text-accent-700 dark:text-accent-400 hover:underline"
          >
            [{match[1]}]
          </a>
        ) : (
          <sup key={i} title={label} className="ml-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            [{match[1]}]
          </sup>
        )
      })}
    </>
  )
}

type NumberedSource = { source: CompanyAnalysis['sources'][number]; number: number }

function SourceList({ items }: { items: NumberedSource[] }) {
  return (
    <ol className="mt-3 space-y-1.5 text-sm">
      {items.map(({ source, number }) => (
        <li key={number} className="flex gap-2">
          <span className="w-8 shrink-0 text-right tabular-nums text-slate-400 dark:text-slate-500">[{number}]</span>
          <span className="min-w-0">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {[source.source, source.published_at ? formatDateTime(source.published_at) : null].filter(Boolean).join(' · ')}
            </span>{' '}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer" className="text-accent-700 dark:text-accent-400 hover:underline">
                {source.title}
              </a>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">{source.title}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

function KeyDataCard({ keyData }: { keyData: CompanyAnalysisOverview['key_data'] }) {
  const { t } = useLanguage()
  const rows: { label: string; value: string; detail?: string; asOf: string }[] = []

  if (keyData.dividend) {
    const d = keyData.dividend.value
    const details = [
      d.status ? t(DIVIDEND_STATUS_LABELS[d.status]) : null,
      d.fiscal_year ? t('za rok {0}', d.fiscal_year) : null,
      d.record_date ? t('dzień dywidendy {0}', formatDate(d.record_date)) : null,
      d.payment_date ? t('wypłata {0}', formatDate(d.payment_date)) : null,
    ].filter(Boolean)
    rows.push({
      label: t('Dywidenda na akcję'),
      value: d.amount_per_share ? `${formatNumber(d.amount_per_share, 2)} ${d.currency ?? ''}`.trim() : '-',
      detail: details.join(', '),
      asOf: keyData.dividend.as_of,
    })
  }
  if (keyData.next_results_date) {
    rows.push({ label: t('Najbliższe wyniki'), value: formatDate(keyData.next_results_date.value), asOf: keyData.next_results_date.as_of })
  }
  if (keyData.next_general_meeting_date) {
    rows.push({
      label: t('Walne zgromadzenie'),
      value: formatDate(keyData.next_general_meeting_date.value),
      asOf: keyData.next_general_meeting_date.as_of,
    })
  }
  if (keyData.target_price) {
    const price = keyData.target_price.value
    rows.push({
      label: t('Średnia cena docelowa'),
      value: `${formatNumber(price.amount, 2)} ${price.currency ?? ''}`.trim(),
      asOf: keyData.target_price.as_of,
    })
  }
  if (keyData.analyst_consensus) {
    rows.push({ label: t('Konsensus analityków'), value: keyData.analyst_consensus.value, asOf: keyData.analyst_consensus.as_of })
  }

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Najważniejsze dane')}</h2>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        {t('Zapamiętane z Twoich analiz - każda wartość pochodzi z najnowszej analizy, która ją znalazła.')}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{row.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">{row.value}</dd>
            {row.detail && <dd className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</dd>}
            <dd className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{t('wg analizy z {0}', formatDate(row.asOf))}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function SimilarCompanies({
  peers,
  companies,
  onPick,
}: {
  peers: NonNullable<AnalysisKeyData['similar_companies']>
  companies: Stock[]
  onPick: (stockId: number) => void
}) {
  const { t } = useLanguage()
  if (peers.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Podobne spółki')}</h2>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        {t('Spółki z tej samej branży zaproponowane przez model i sprawdzone w wyszukiwarce notowań - to nie jest rekomendacja.')}
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {peers.map((peer) => {
          const tracked = companies.find((company) => company.ticker.toUpperCase() === peer.ticker && company.market === peer.market)
          return (
            <li key={`${peer.market}-${peer.ticker}`} className="rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{peer.ticker}</span>{' '}
                  <span className="text-xs text-slate-400 dark:text-slate-500">({peer.market})</span> {peer.name}
                </p>
                {tracked && (
                  <button
                    type="button"
                    onClick={() => onPick(tracked.id)}
                    className="shrink-0 text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                  >
                    {t('Analizuj')}
                  </button>
                )}
              </div>
              {peer.reason && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{peer.reason}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AnalysisResult({ analysis, market }: { analysis: CompanyAnalysis; market: Stock['market'] | undefined }) {
  const { t } = useLanguage()
  const { sources } = analysis
  // Filings exist for GPW (ESPI/EBI) and US (SEC EDGAR) companies only; elsewhere the section could only be empty.
  const sections = SECTIONS.filter((section) => section.key !== 'espi' || market === 'GPW' || market === 'US')
  const middleCount = sections.filter((section) => section.key !== 'company_overview').length

  // Most gathered headlines never make it into a bullet; the cited ones are what a reader wants to check.
  const { cited, uncited } = useMemo(() => {
    const numbers = new Set<number>()
    for (const text of [analysis.summary, ...Object.values(analysis.sections).flat()]) {
      for (const match of (text ?? '').matchAll(/\[(\d+)\]/g)) numbers.add(Number(match[1]))
    }
    const numbered = sources.map((source, i) => ({ source, number: i + 1 }))
    const citedSources = numbered.filter((item) => numbers.has(item.number))
    return citedSources.length
      ? { cited: citedSources, uncited: numbered.filter((item) => !numbers.has(item.number)) }
      : { cited: numbered, uncited: [] }
  }, [analysis, sources])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t('Stan na {0}', formatDateTime(analysis.finished_at ?? analysis.created_at))}
          {' · '}
          {sources.length > 0
            ? t('źródła: {0} (komunikaty spółki i wiadomości)', sources.length)
            : t('nie znalazłem żadnych komunikatów ani wiadomości o tej spółce z tego okresu')}
        </p>
        {analysis.summary && (
          <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            <Cited text={analysis.summary} sources={sources} />
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section, index) => {
          const items = analysis.sections[section.key] ?? []
          const fullWidth =
            section.key === 'company_overview' || (middleCount % 2 === 1 && index === middleCount - 1)
          return (
            <div
              key={section.key}
              className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm ${
                fullWidth ? 'lg:col-span-2' : ''
              }`}
            >
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {section.key === 'espi' && market === 'US' ? t('Raporty dla SEC') : t(section.title)}
              </h3>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                  {section.periodBound ? t('Nic nowego w tym okresie.') : t('Brak informacji.')}
                </p>
              ) : (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 marker:text-accent-500">
                  {items.map((item, i) => (
                    <li key={i}>
                      <Cited text={item} sources={sources} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {sources.length > 0 && (
        <details className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('Źródła ({0})', cited.length)}
          </summary>
          <SourceList items={cited} />
          {uncited.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('Pozostałe zebrane materiały, które nie weszły do podsumowania ({0})', uncited.length)}
              </summary>
              <SourceList items={uncited} />
            </details>
          )}
        </details>
      )}
    </div>
  )
}

export default function AnalizaSpolek() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const hasKey = !!user?.profile.has_gemini_api_key
  const [period, setPeriod] = useState<AnalysisPeriod>('day')
  const [pickedStockId, setPickedStockId] = useState<number | null>(readSavedStockId)

  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await api.get<Stock[]>('/stocks/tickers/')).data,
  })
  // ETFs have no filings, results or analyst coverage of their own to report on.
  const companies = useMemo(() => (stocks ?? []).filter((s) => s.instrument_type !== 'ETF'), [stocks])
  const stockId = companies.some((s) => s.id === pickedStockId) ? pickedStockId : (companies[0]?.id ?? null)
  const stock = companies.find((s) => s.id === stockId)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['company-analysis', stockId],
    queryFn: async () =>
      (await api.get<CompanyAnalysisOverview>('/news/analysis/', { params: { stock: stockId } })).data,
    enabled: stockId !== null,
    refetchInterval: (query) => {
      const periods = query.state.data?.periods
      return periods && (periods.day.latest?.status === 'pending' || periods.week.latest?.status === 'pending') ? 3000 : false
    },
  })

  const start = useMutation({
    mutationFn: async ({ force }: { force: boolean }) =>
      (await api.post<CompanyAnalysis>('/news/analysis/', { stock: stockId, period, force })).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['company-analysis', stockId] }),
  })

  const state = overview?.periods[period]
  const latest = state?.latest ?? null
  const running = latest?.status === 'pending' || start.isPending
  const failed = latest?.status === 'failed' ? latest : null
  const shown = state?.last_done ?? null

  // The first visit of the day brings the chosen company up to date without a click; later visits don't re-spend quota.
  const autoStarted = useRef(new Set<string>())
  useEffect(() => {
    if (!overview || stockId === null || !hasKey) return
    const key = `${stockId}-${period}`
    if (overview.periods[period].checked_today || autoStarted.current.has(key)) return
    autoStarted.current.add(key)
    start.mutate({ force: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview, stockId, period, hasKey])

  function confirmRecheck(lastCheckedAt: string) {
    return window.confirm(
      t(
        'Ta spółka była już dziś sprawdzana ({0}). Każde sprawdzenie zużywa zapytanie z darmowego dziennego limitu Twojego klucza Gemini - tego samego, z którego korzysta skanowanie paragonów. Gdy się wyczerpie, oba działają dopiero po odnowieniu limitu, około 9:00 czasu polskiego. Na pewno sprawdzić jeszcze raz?',
        formatDateTime(lastCheckedAt),
      ),
    )
  }

  function checkNow() {
    if (state?.checked_today && latest) {
      if (confirmRecheck(latest.created_at)) start.mutate({ force: true })
      return
    }
    start.mutate(
      { force: false },
      {
        onError: (error) => {
          const data = error instanceof AxiosError ? error.response?.data : null
          if (data?.code === 'checked_today' && confirmRecheck(data.last_checked_at)) start.mutate({ force: true })
        },
      },
    )
  }

  const startErrorCode = start.error instanceof AxiosError ? start.error.response?.data?.code : null
  const startError = start.isError && startErrorCode !== 'checked_today'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Analiza spółek')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t(
            'Co dzieje się w wybranej spółce: nadchodzące daty, komunikaty, transakcje, wyniki, plotki, oczekiwania i rekomendacje analityków. skieta zbiera komunikaty spółki i wiadomości z serwisów finansowych, a Google Gemini streszcza je w punktach na Twoim własnym kluczu - przy każdym punkcie jest numer źródła.',
          )}
        </p>
        <p className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          {t(
            'To nie jest rekomendacja inwestycyjna. Podsumowanie pisze model językowy, który może się pomylić albo coś pominąć - zanim na jego podstawie cokolwiek zrobisz, sprawdź informację w źródle.',
          )}
        </p>
      </div>

      {stocksLoading ? (
        <CardLoader />
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('Nie masz jeszcze w portfelu żadnej spółki do przeanalizowania.')}{' '}
          <Link to="/gielda/portfel" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Przejdź do portfela')}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Spółka')}</span>
              <select
                value={stockId ?? ''}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setPickedStockId(id)
                  saveStockId(id)
                }}
                className="input w-auto max-w-full"
              >
                {companies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ticker} ({s.market}){s.name && ` - ${s.name}`}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Informacje z')}</span>
              <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-600 p-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`rounded px-3 py-1 text-sm font-medium transition ${
                      period === p.value
                        ? 'bg-accent-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(p.label)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={checkNow}
              disabled={!hasKey || running || isLoading}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              {running ? t('Sprawdzam…') : t('⟳ Sprawdź teraz')}
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 sm:ml-auto">
              {latest && latest.status !== 'pending'
                ? t('Ostatnio sprawdzane: {0}', formatDateTime(latest.created_at))
                : !latest && !running
                  ? t('Jeszcze nie sprawdzano')
                  : null}
            </p>
          </div>

          {!hasKey ? (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('Analiza potrzebuje Twojego klucza Gemini')}
              </h2>
              <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  'Komunikaty i wiadomości o spółce streszcza Google Gemini, na Twoim własnym, darmowym kluczu - tym samym, którego używa skanowanie paragonów. Ustawisz go raz, w dwie minuty, bez karty płatniczej.',
                )}
              </p>
              <GeminiKeyForm />
            </div>
          ) : (
            <>
              {isLoading && <CardLoader />}

              {running && (
                <div className="flex items-center gap-3 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 p-4 text-sm text-accent-800 dark:text-accent-300">
                  <Spinner size="sm" />
                  {t(
                    'Zbieram komunikaty i wiadomości o spółce i przygotowuję podsumowanie… Zwykle trwa to do minuty - możesz w tym czasie przejść do innej zakładki.',
                  )}
                </div>
              )}

              {!running && (failed || startError) && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                  {t(
                    ERROR_MESSAGES[failed?.error ?? startErrorCode ?? ''] ??
                      'Nie udało się przygotować analizy. Spróbuj ponownie za chwilę.',
                  )}
                  {shown && ` ${t('Poniżej ostatnia udana analiza.')}`}
                </div>
              )}

              {overview && <KeyDataCard keyData={overview.key_data} />}

              {overview?.key_data.similar_companies && (
                <SimilarCompanies
                  peers={overview.key_data.similar_companies.value}
                  companies={companies}
                  onPick={(id) => {
                    setPickedStockId(id)
                    saveStockId(id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              )}

              {shown ? (
                <AnalysisResult analysis={shown} market={stock?.market} />
              ) : (
                !isLoading &&
                !running &&
                !failed && (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {t('Kliknij „Sprawdź teraz”, żeby przygotować pierwszą analizę tej spółki.')}
                  </p>
                )
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
