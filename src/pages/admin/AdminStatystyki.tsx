import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'
import type { AdminAppStats, AdminInvitedEmail } from '../../types'

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

  const { data: invitedEmails } = useQuery({
    queryKey: ['admin-invited-emails'],
    queryFn: async () =>
      (await api.get<{ results: AdminInvitedEmail[] }>('/auth/admin/invited-emails/')).data.results,
  })

  if (isLoading || !stats) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={t('Zaproszenia wysłane')} value={stats.invitations_sent} />
        <StatCard label={t('Zaproszenia przyjęte')} value={stats.invitations_accepted} />
        <StatCard label={t('Zaproszenia mailem')} value={stats.invitation_emails_sent} />
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Zaproszenia wysłane mailem')}
        </h2>
        {!invitedEmails || invitedEmails.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak zaproszeń wysłanych mailem.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-3">{t('E-mail')}</th>
                  <th className="pb-2 pr-3">{t('Zapraszający')}</th>
                  <th className="pb-2 pr-3">{t('Wysłano')}</th>
                  <th className="pb-2 pr-3">{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {invitedEmails.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-1.5 pr-3 text-slate-700 dark:text-slate-200">{inv.email}</td>
                    <td className="py-1.5 pr-3">
                      <Link
                        to={`/admin/uzytkownicy/${inv.inviter_id}`}
                        className="text-accent-700 dark:text-accent-400 hover:underline"
                      >
                        {inv.inviter}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3 text-slate-500 dark:text-slate-400">
                      {formatDateTime(inv.created_at)}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.accepted_by
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : inv.is_expired
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {inv.accepted_by
                          ? t('Przyjęte przez {0}', inv.accepted_by)
                          : inv.is_expired
                            ? t('Wygasłe')
                            : t('Oczekuje')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
