import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../api/client'
import { PageLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { useTooltipStyle } from '../../lib/chartTooltip'
import { formatDate, formatDateTime, formatDuration } from '../../lib/format'
import type { AdminUserDetail as AdminUserDetailType, Role } from '../../types'

const VARIANT_LABELS: Record<string, string> = {
  light: 'Jasny',
  dark: 'Ciemny',
  pink: 'Lawendowy',
}

const LANGUAGE_LABELS: Record<string, string> = {
  pl: 'Polski',
  en: 'English',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: async () => (await api.get<AdminUserDetailType>(`/auth/admin/users/${id}/`)).data,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const toggleActive = useMutation({
    mutationFn: () => api.post(`/auth/admin/users/${id}/toggle-active/`),
    onSuccess: invalidate,
  })
  const toggleStaff = useMutation({
    mutationFn: () => api.post(`/auth/admin/users/${id}/toggle-staff/`),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      if (detail) window.alert(detail)
    },
  })
  const toggleEditor = useMutation({
    mutationFn: () => api.post(`/auth/admin/users/${id}/toggle-editor/`),
    onSuccess: invalidate,
  })
  const toggleArchive = useMutation({
    mutationFn: () => api.post(`/auth/admin/users/${id}/archive/`),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      if (detail) window.alert(detail)
    },
  })

  const { data: allRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get<Role[]>('/auth/admin/roles/')).data,
  })
  const setRoles = useMutation({
    mutationFn: (roleIds: number[]) => api.post(`/auth/admin/users/${id}/set-roles/`, { role_ids: roleIds }),
    onSuccess: invalidate,
  })

  function toggleRole(roleId: number) {
    // "Currently offered" = anything not revoked — pending offers still
    // count, since clicking again should withdraw the offer, not silently
    // leave it dangling for the user to accept later.
    const current = new Set(
      (user?.role_assignments ?? []).filter((a) => a.status !== 'declined').map((a) => a.role.id),
    )
    if (current.has(roleId)) current.delete(roleId)
    else current.add(roleId)
    setRoles.mutate([...current])
  }

  if (isLoading) return <PageLoader />
  if (!user) {
    return <p className="text-slate-400 dark:text-slate-500">{t('Nie znaleziono użytkownika.')}</p>
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const activityChartData = user.activity_last_30_days.map((d) => ({ date: d.date, value: d.active ? 1 : 0 }))

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/uzytkownicy')}
        className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
      >
        {t('← Wróć do listy')}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {user.username}
            {user.is_archived && (
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('zarchiwizowane')}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{fullName || t('brak imienia i nazwiska')}</p>
        </div>
        {user.login_streak > 0 && (
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
            🔥 {t('Seria logowań: {0} dni', String(user.login_streak))}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:grid-cols-3">
        <InfoRow label={t('E-mail')} value={user.email || '—'} />
        <InfoRow
          label={t('E-mail zweryfikowany')}
          value={user.email_verified ? t('tak') : t('nie')}
        />
        <InfoRow label={t('Dołączył(a)')} value={formatDate(user.date_joined)} />
        <InfoRow label={t('Ostatnie logowanie')} value={user.last_login ? formatDateTime(user.last_login) : t('nigdy')} />
        <InfoRow label={t('Ostatnie IP')} value={user.last_login_ip ?? '—'} />
        <InfoRow label={t('Status konta')} value={user.is_active ? t('aktywne') : t('zablokowane')} />
        <InfoRow label={t('Wariant kolorystyczny')} value={t(VARIANT_LABELS[user.color_variant] ?? user.color_variant)} />
        <InfoRow label={t('Język')} value={LANGUAGE_LABELS[user.language] ?? user.language} />
        <InfoRow
          label={t('Role')}
          value={
            [user.is_staff && t('administrator'), user.is_editor && t('redaktor')].filter(Boolean).join(', ') ||
            t('zwykły użytkownik')
          }
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zarządzanie kontem')}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {user.is_active ? t('Zablokuj') : t('Odblokuj')}
          </button>
          <button
            onClick={() => toggleStaff.mutate()}
            disabled={toggleStaff.isPending}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {user.is_staff ? t('Odbierz admina') : t('Nadaj admina')}
          </button>
          <button
            onClick={() => toggleEditor.mutate()}
            disabled={toggleEditor.isPending}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {user.is_editor ? t('Odbierz redaktora') : t('Nadaj redaktora')}
          </button>
          <button
            onClick={() => {
              const question = user.is_archived
                ? t('Przywrócić to konto z archiwum?')
                : t('Zarchiwizować to konto? Zostanie zablokowane, ale dane pozostaną zachowane.')
              if (window.confirm(question)) toggleArchive.mutate()
            }}
            disabled={toggleArchive.isPending}
            className="rounded-md border border-red-300 dark:border-red-700 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
          >
            {user.is_archived ? t('Przywróć z archiwum') : t('Zarchiwizuj konto')}
          </button>
        </div>
        {user.archived_at && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {t('Zarchiwizowano {0}', formatDateTime(user.archived_at))}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Role niestandardowe')}</h2>
        <p className="mb-3 mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t('Kliknięcie oferuje rolę — zaczyna obowiązywać dopiero, gdy użytkownik ją zaakceptuje.')}
        </p>
        <div className="flex flex-wrap gap-2">
          {(allRoles ?? []).map((role) => {
            const assignment = user.role_assignments.find((a) => a.role.id === role.id)
            const isPending = assignment?.status === 'pending'
            const isAccepted = assignment?.status === 'accepted'
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                disabled={setRoles.isPending}
                title={
                  isPending
                    ? t('Oczekuje na akceptację użytkownika — kliknij, aby wycofać ofertę')
                    : isAccepted
                      ? t('Zaakceptowana — kliknij, aby odebrać')
                      : t('Kliknij, aby zaoferować tę rolę')
                }
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                  isAccepted
                    ? 'border-transparent text-white'
                    : isPending
                      ? 'border-dashed text-slate-600 dark:text-slate-300'
                      : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                style={isAccepted ? { backgroundColor: role.color } : isPending ? { borderColor: role.color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isAccepted ? 'rgba(255,255,255,0.7)' : role.color }}
                />
                {role.name}
                {isPending && <span className="text-[10px]">{t('(oczekuje)')}</span>}
              </button>
            )
          })}
          {(allRoles ?? []).length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {t('Brak ról — utwórz je w zakładce "Role".')}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('Zaproszeni użytkownicy')} ({user.invited_count})
          </h2>
          <span
            className="text-xs text-slate-400 dark:text-slate-500"
            title={t('Łącznie wygenerowanych zaproszeń (linki i maile, każdy wynik) - w odróżnieniu od liczby powyżej, nie maleje, gdy wygasłe nieużyte linki znikają same z systemu.')}
          >
            {t('Wygenerowanych łącznie: {0}', String(user.invitations_generated_count))}
          </span>
        </div>
        {user.invited_users.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Nikogo jeszcze nie zaprosił(a).')}</p>
        ) : (
          <ul className="space-y-1">
            {user.invited_users.map((inv) => (
              <li key={inv.username} className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{inv.username}</span>
                <span className="text-slate-400 dark:text-slate-500">{formatDateTime(inv.accepted_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(user.is_staff || user.is_editor) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Napisane artykuły')}</h2>
          {user.articles.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">{t('Nie napisał(a) jeszcze żadnego artykułu.')}</p>
          ) : (
            <ul className="space-y-1">
              {user.articles.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{a.title}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    {!a.is_published && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5">{t('szkic')}</span>
                    )}
                    {formatDate(a.published_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Statystyki aktywności')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoRow label={t('Aktywne dni łącznie')} value={user.total_active_days} />
          <InfoRow label={t('Konta bankowe')} value={user.accounts_count} />
          <InfoRow label={t('Transakcje akcji')} value={user.stock_transactions_count} />
          <InfoRow label={t('Transakcje budżetu')} value={user.budget_transactions_count} />
          <InfoRow label={t('Średni czas sesji')} value={formatDuration(user.avg_session_duration_seconds)} />
        </div>
        <p className="mb-2 mt-5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Aktywność w ostatnich 30 dniach')}
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityChartData}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                {...tooltipStyle}
                labelFormatter={(d) => formatDate(d as string)}
                formatter={(value) => [value === 1 ? t('aktywny') : t('nieaktywny'), '']}
              />
              <Bar dataKey="value" fill="#7c3aed" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
