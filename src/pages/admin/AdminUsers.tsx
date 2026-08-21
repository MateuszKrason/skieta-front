import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import { Spinner } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatDateTime } from '../../lib/format'
import type { AdminActivityStats, AdminUser } from '../../types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

export default function AdminUsers() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [isStaffFilter, setIsStaffFilter] = useState('')
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get<AdminActivityStats>('/auth/admin/stats/')).data,
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, isActiveFilter, isStaffFilter, emailVerifiedFilter],
    queryFn: async () =>
      (
        await api.get<AdminUser[]>('/auth/admin/users/', {
          params: {
            search: search || undefined,
            is_active: isActiveFilter || undefined,
            is_staff: isStaffFilter || undefined,
            email_verified: emailVerifiedFilter || undefined,
          },
        })
      ).data,
  })

  const toggleActive = useMutation({
    mutationFn: (id: number) => api.post(`/auth/admin/users/${id}/toggle-active/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t('Użytkownicy łącznie')} value={stats?.total_users ?? '—'} />
        <StatCard label={t('Aktywni dzisiaj')} value={stats?.active_today ?? '—'} />
        <StatCard label={t('Nowi w tym tygodniu')} value={stats?.new_this_week ?? '—'} />
        <StatCard label={t('Zweryfikowany e-mail')} value={stats?.verified_users ?? '—'} />
        <StatCard label={t('Administratorzy')} value={stats?.staff_users ?? '—'} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Aktywni użytkownicy dziennie (30 dni)')}
        </h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.daily ?? []}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={30} />
              <Tooltip labelFormatter={(d) => formatDate(d as string)} formatter={(value) => [value, t('Aktywni')]} />
              <Bar dataKey="count" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Szukaj')}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('login lub e-mail')}
            className="input mt-1"
          />
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Status')}
          <select value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)} className="input mt-1">
            <option value="">{t('wszystkie')}</option>
            <option value="true">{t('aktywne')}</option>
            <option value="false">{t('zablokowane')}</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Rola')}
          <select value={isStaffFilter} onChange={(e) => setIsStaffFilter(e.target.value)} className="input mt-1">
            <option value="">{t('wszyscy')}</option>
            <option value="true">{t('administratorzy')}</option>
            <option value="false">{t('zwykli użytkownicy')}</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('E-mail')}
          <select
            value={emailVerifiedFilter}
            onChange={(e) => setEmailVerifiedFilter(e.target.value)}
            className="input mt-1"
          >
            <option value="">{t('wszystkie')}</option>
            <option value="true">{t('zweryfikowany')}</option>
            <option value="false">{t('niezweryfikowany')}</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">{t('Login')}</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">{t('Dołączył(a)')}</th>
              <th className="px-4 py-2">{t('Ostatnia aktywność')}</th>
              <th className="px-4 py-2">{t('Ostatnie IP')}</th>
              <th className="px-4 py-2 text-right">{t('Konta')}</th>
              <th className="px-4 py-2 text-right">{t('Transakcje akcji')}</th>
              <th className="px-4 py-2 text-right">{t('Transakcje budżetu')}</th>
              <th className="px-4 py-2">{t('E-mail')}</th>
              <th className="px-4 py-2">{t('Status')}</th>
              <th className="px-4 py-2 text-right">{t('Operacje')}</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/admin/uzytkownicy/${u.id}`} className="hover:underline">
                    {u.username}
                  </Link>{' '}
                  {u.is_staff && <span className="ml-1 text-xs text-accent-600 dark:text-accent-400">(admin)</span>}
                  {u.is_editor && <span className="ml-1 text-xs text-accent-600 dark:text-accent-400">(redaktor)</span>}
                  {u.is_archived && <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">(zarchiwizowane)</span>}
                </td>
                <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(u.date_joined)}</td>
                <td className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">
                  {u.last_seen ? formatDateTime(u.last_seen) : t('nigdy')}
                </td>
                <td className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">{u.last_login_ip ?? '—'}</td>
                <td className="px-4 py-2 text-right">{u.accounts_count}</td>
                <td className="px-4 py-2 text-right">{u.stock_transactions_count}</td>
                <td className="px-4 py-2 text-right">{u.budget_transactions_count}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.email_verified
                        ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {u.email_verified ? t('zweryfikowany') : t('niezweryfikowany')}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {u.is_active ? t('aktywne') : t('zablokowane')}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      to={`/admin/uzytkownicy/${u.id}`}
                      className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                    >
                      {t('Szczegóły')}
                    </Link>
                    <button
                      onClick={() => toggleActive.mutate(u.id)}
                      disabled={toggleActive.isPending}
                      className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline disabled:opacity-50"
                    >
                      {u.is_active ? t('Zablokuj') : t('Odblokuj')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <Spinner size="sm" /> {t('Ładowanie…')}
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && users?.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  {t('Brak użytkowników spełniających kryteria.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
