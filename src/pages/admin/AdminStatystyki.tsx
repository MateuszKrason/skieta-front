import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import type { AdminAppStats } from '../../types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

const COLOR_VARIANT_LABELS: Record<string, string> = {
  light: 'Jasny',
  dark: 'Ciemny',
  pink: 'Lawendowy',
}

export default function AdminStatystyki() {
  const { t } = useLanguage()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-app-stats'],
    queryFn: async () => (await api.get<AdminAppStats>('/auth/admin/app-stats/')).data,
  })

  if (isLoading || !stats) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={t('Zaproszenia wysłane')} value={stats.invitations_sent} />
        <StatCard label={t('Zaproszenia przyjęte')} value={stats.invitations_accepted} />
        <StatCard label={t('Redaktorzy')} value={stats.editor_count} />
        <StatCard label={t('Zarchiwizowane konta')} value={stats.archived_count} />
        <StatCard label={t('Transakcje budżetowe')} value={stats.budget_transaction_count} />
        <StatCard label={t('Transakcje giełdowe')} value={stats.stock_transaction_count} />
        <StatCard label={t('Konta bankowe')} value={stats.bank_account_count} />
        <StatCard label={t('Role niestandardowe')} value={stats.role_count} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Wariant kolorystyczny użytkowników')}
        </h2>
        <div className="space-y-2">
          {Object.entries(stats.color_variant_counts).map(([variant, count]) => {
            const total = Object.values(stats.color_variant_counts).reduce((a, b) => a + b, 0)
            const pct = total ? (count / total) * 100 : 0
            return (
              <div key={variant}>
                <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t(COLOR_VARIANT_LABELS[variant] ?? variant)}</span>
                  <span>
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                  <div className="h-1.5 rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
