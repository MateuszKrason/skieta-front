import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { useTooltipStyle } from '../../lib/chartTooltip'
import { formatAxisValue, formatDate, formatMoney, formatNumber } from '../../lib/format'
import type { BudgetType, InterestingStats } from '../../types'
import { TagTrendChart } from './shared'

const WEEKDAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const TREND_MONTHS_OPTIONS = [6, 12, 24]

function InsightCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

export default function Statystyki() {
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const [tagTrendType, setTagTrendType] = useState<BudgetType>('expense')
  const [tagTrendMonths, setTagTrendMonths] = useState(6)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['budget-interesting-stats'],
    queryFn: async () => (await api.get<InterestingStats>('/budget/interesting-stats/')).data,
  })

  const weekdayChartData = (data?.weekday_breakdown ?? []).map((row) => ({
    name: t(WEEKDAY_NAMES[row.weekday]),
    total: Number(row.total),
    count: row.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Statystyki')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('Ciekawostki i wzorce wyliczone z Twojej historii transakcji')}</p>
      </div>

      {isLoading ? (
        <CardLoader />
      ) : !data || data.total_transactions === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('Dodaj kilka transakcji, żeby zobaczyć tu statystyki.')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InsightCard label={t('Liczba transakcji')} value={formatNumber(data.total_transactions, 0)} />
            <InsightCard
              label={t('Średni wydatek')}
              value={formatMoney(data.avg_expense_amount, data.base_currency)}
            />
            <InsightCard
              label={t('Średni przychód')}
              value={formatMoney(data.avg_income_amount, data.base_currency)}
            />
            <InsightCard
              label={t('Najdłuższa passa bez wydatków')}
              value={
                data.longest_no_spend_streak_days === null
                  ? '—'
                  : t('{0} dni', data.longest_no_spend_streak_days)
              }
            />
            {data.biggest_expense && (
              <InsightCard
                label={t('Największy wydatek')}
                value={formatMoney(data.biggest_expense.amount, data.biggest_expense.currency)}
                hint={`${data.biggest_expense.category?.name ?? t('Bez kategorii')} · ${formatDate(data.biggest_expense.date)}`}
              />
            )}
            {data.biggest_income && (
              <InsightCard
                label={t('Największy przychód')}
                value={formatMoney(data.biggest_income.amount, data.biggest_income.currency)}
                hint={`${data.biggest_income.category?.name ?? t('Bez kategorii')} · ${formatDate(data.biggest_income.date)}`}
              />
            )}
            {data.best_month && (
              <InsightCard label={t('Najlepszy miesiąc (saldo)')} value={formatMoney(data.best_month.net, data.base_currency)} hint={data.best_month.month} />
            )}
            {data.worst_month && (
              <InsightCard label={t('Najgorszy miesiąc (saldo)')} value={formatMoney(data.worst_month.net, data.base_currency)} hint={data.worst_month.month} />
            )}
            {data.top_store_by_spend && (
              <InsightCard
                label={t('Sklep z największymi wydatkami')}
                value={data.top_store_by_spend.store?.name ?? t('—')}
                hint={formatMoney(data.top_store_by_spend.total, data.base_currency)}
              />
            )}
            {data.most_frequent_store && (
              <InsightCard
                label={t('Najczęściej odwiedzany sklep')}
                value={data.most_frequent_store.store?.name ?? t('—')}
                hint={t('{0} transakcji', data.most_frequent_store.count)}
              />
            )}
            {data.most_used_tag && (
              <InsightCard
                label={t('Najczęściej używany tag')}
                value={data.most_used_tag.tag ? `#${data.most_used_tag.tag.name}` : t('—')}
                hint={t('{0} transakcji', data.most_used_tag.count)}
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Wydatki wg dnia tygodnia')}</h2>
            <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{t('W który dzień tygodnia najczęściej wydajesz pieniądze')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={40} />
                  <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, data.base_currency)} />
                  <Bar dataKey="total" name={t('Wydatki')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
          {(['expense', 'income'] as BudgetType[]).map((type) => (
            <button
              key={type}
              onClick={() => setTagTrendType(type)}
              className={`px-3 py-1.5 text-sm font-medium ${
                tagTrendType === type
                  ? 'bg-accent-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t(type === 'expense' ? 'Wydatki' : 'Przychody')}
            </button>
          ))}
        </div>
        <select
          value={tagTrendMonths}
          onChange={(e) => setTagTrendMonths(Number(e.target.value))}
          className="input w-auto"
        >
          {TREND_MONTHS_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {t('Ostatnie {0} mies.', m)}
            </option>
          ))}
        </select>
      </div>

      <TagTrendChart type={tagTrendType} months={tagTrendMonths} onSelectTag={setSelectedTagId} selectedTagId={selectedTagId} />
    </div>
  )
}
