import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../lib/format'
import { useTheme, type Theme } from '../theme/ThemeContext'
import type { InvitationList, LoginHistoryResponse, RoleAssignment } from '../types'

export default function Account() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Moje konto')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Zaloguj jako {0}', user?.username ?? '')}</p>
        </div>
        {(user?.profile.login_streak ?? 0) > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
            🔥 {t('Seria logowań: {0} dni', String(user!.profile.login_streak))}
          </span>
        )}
      </div>

      <EmailVerificationStatus />
      <PendingRoleOffers />
      {(user?.is_staff || user?.profile.is_editor) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Redakcja')}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('Masz uprawnienia redaktora — możesz dodawać i edytować artykuły.')}
          </p>
          <Link to="/redakcja" className="btn-primary mt-3 inline-block">
            {t('Przejdź do redakcji')}
          </Link>
        </div>
      )}
      <ProfileForm />
      <AppearanceForm />
      <InterestsForm />
      <PasswordForm />
      <InviteFriends />
      <LoginHistorySection />
    </div>
  )
}

const INTEREST_OPTIONS: { field: 'interest_stocks' | 'interest_budget' | 'interest_planning'; label: string }[] = [
  { field: 'interest_stocks', label: 'Giełda' },
  { field: 'interest_budget', label: 'Budżet' },
  { field: 'interest_planning', label: 'Planowanie' },
]

function InterestsForm() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, boolean>) => {
      await api.patch('/auth/me/', payload)
      await refreshUser()
    },
  })

  // A single shared mutation handles all three checkboxes — track which
  // field's PATCH is actually in flight so only that one checkbox shows the
  // spinner, not all three at once.
  const pendingField = mutation.isPending ? Object.keys(mutation.variables ?? {})[0] : null

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Z czego korzystasz')}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('Odznaczone opcje znikają z górnego menu — możesz je włączyć z powrotem w każdej chwili.')}
      </p>
      <div className="flex flex-wrap gap-4">
        {INTEREST_OPTIONS.map((opt) => {
          const isPending = pendingField === opt.field
          return (
            <label
              key={opt.field}
              className={`flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 ${isPending ? 'opacity-70' : ''}`}
            >
              {isPending ? (
                <span
                  className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-accent-600 dark:border-slate-600"
                  aria-hidden="true"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={user?.profile[opt.field] ?? true}
                  disabled={mutation.isPending}
                  onChange={(e) => mutation.mutate({ [opt.field]: e.target.checked })}
                />
              )}
              {t(opt.label)}
            </label>
          )
        })}
      </div>
    </div>
  )
}

const VARIANT_LABELS: Record<Theme, string> = {
  light: 'Jasny',
  dark: 'Ciemny',
  pink: 'Lawendowy',
}

const LANGUAGE_LABELS: Record<'pl' | 'en', string> = {
  pl: 'Polski',
  en: 'English',
}

function AppearanceForm() {
  const { user, updateProfile } = useAuth()
  const { setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [success, setSuccess] = useState(false)

  const themeMutation = useMutation({
    mutationFn: (variant: Theme) => api.patch('/auth/me/', { color_variant: variant }),
    onSuccess: (_, variant) => {
      setTheme(variant)
      updateProfile({ color_variant: variant })
      setSuccess(true)
    },
  })

  const languageMutation = useMutation({
    mutationFn: (lang: 'pl' | 'en') => api.patch('/auth/me/', { language: lang }),
    onSuccess: (_, lang) => {
      setLanguage(lang)
      updateProfile({ language: lang })
      setSuccess(true)
    },
  })

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Wygląd i język')}</h2>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Domyślny kolor interfejsu')}
        <select
          value={user?.profile.color_variant ?? 'light'}
          onChange={(e) => {
            setSuccess(false)
            themeMutation.mutate(e.target.value as Theme)
          }}
          className="input mt-1"
        >
          {(Object.keys(VARIANT_LABELS) as Theme[]).map((variant) => (
            <option key={variant} value={variant}>
              {t(VARIANT_LABELS[variant])}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Język interfejsu')}
        <select
          value={user?.profile.language ?? language}
          onChange={(e) => {
            setSuccess(false)
            languageMutation.mutate(e.target.value as 'pl' | 'en')
          }}
          className="input mt-1"
        >
          {(Object.keys(LANGUAGE_LABELS) as ('pl' | 'en')[]).map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </label>
      {success && <p className="text-sm text-emerald-600">{t('Zapisano zmiany.')}</p>}
    </div>
  )
}

function EmailVerificationStatus() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.post<{ detail: string }>('/auth/resend-verification/'),
    onSuccess: () => setSent(true),
  })

  if (!user || user.profile.email_verified) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4 text-sm">
      <p className="font-medium text-amber-800 dark:text-amber-300">{t('Adres e-mail nie jest jeszcze potwierdzony')}</p>
      {sent ? (
        <p className="mt-1 text-amber-700 dark:text-amber-400">{t('Wysłano nowy link weryfikacyjny — sprawdź skrzynkę.')}</p>
      ) : (
        <>
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            {user.email
              ? t('Sprawdź skrzynkę i kliknij link, który wysłaliśmy przy rejestracji.')
              : t('Dodaj adres e-mail poniżej, żeby móc go potwierdzić i odzyskać konto w razie potrzeby.')}
          </p>
          {user.email && (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="mt-2 rounded-md border border-amber-300 dark:border-amber-700 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            >
              {mutation.isPending ? t('Wysyłanie…') : t('Wyślij link ponownie')}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function PendingRoleOffers() {
  const { t } = useLanguage()
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: assignments } = useQuery({
    queryKey: ['role-assignments'],
    queryFn: async () => (await api.get<RoleAssignment[]>('/auth/role-assignments/')).data,
  })

  const pending = (assignments ?? []).filter((a) => a.status === 'pending')

  const accept = useMutation({
    mutationFn: (id: number) => api.post(`/auth/role-assignments/${id}/accept/`),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['role-assignments'] })
      await refreshUser()
    },
  })

  const decline = useMutation({
    mutationFn: (id: number) => api.post(`/auth/role-assignments/${id}/decline/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-assignments'] }),
  })

  if (pending.length === 0) return null

  return (
    <div className="rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Nowe role do zaakceptowania')}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t('Administrator zaproponował Ci nowe uprawnienia — nie zaczną obowiązywać, dopóki ich nie zaakceptujesz.')}
      </p>
      <ul className="mt-3 space-y-2">
        {pending.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.role.color }} />
              <span className="font-medium text-slate-700 dark:text-slate-300">{a.role.name}</span>
              {a.assigned_by && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{t('od {0}', a.assigned_by)}</span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => accept.mutate(a.id)}
                disabled={accept.isPending || decline.isPending}
                className="rounded-md border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
              >
                {t('Akceptuj')}
              </button>
              <button
                onClick={() => decline.mutate(a.id)}
                disabled={accept.isPending || decline.isPending}
                className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {t('Odrzuć')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const USERNAME_CHANGE_COOLDOWN_DAYS = 30

function ProfileForm() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  let usernameLockedUntil: Date | null = null
  if (user?.profile.username_changed_at) {
    const changedAt = new Date(user.profile.username_changed_at)
    const unlockAt = new Date(changedAt.getTime() + USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    if (unlockAt.getTime() > Date.now()) usernameLockedUntil = unlockAt
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.patch('/auth/me/', { username, email, first_name: firstName, last_name: lastName }),
    onSuccess: async () => {
      setSuccess(true)
      setError(null)
      await refreshUser()
    },
    onError: (err: unknown) => {
      setSuccess(false)
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać zmian.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(false)
    if (username !== user?.username) {
      const confirmed = window.confirm(
        t('Czy na pewno chcesz zmienić nazwę użytkownika? Można to zrobić tylko raz na 30 dni.'),
      )
      if (!confirmed) return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Dane konta')}</h2>
      <div className="flex gap-3">
        <label className="block flex-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Imię')}
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="input mt-1" />
        </label>
        <label className="block flex-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Nazwisko')}
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="input mt-1" />
        </label>
      </div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          {t('Nazwa użytkownika')}
          {usernameLockedUntil && (
            <span className="text-[11px] font-normal italic text-slate-400 dark:text-slate-500">
              {t('Można zmienić od {0}', usernameLockedUntil.toLocaleDateString('pl-PL'))}
            </span>
          )}
        </span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={!!usernameLockedUntil}
          className="input mt-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        />
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('E-mail')}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{t('Zapisano zmiany.')}</p>}
      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {t('Zapisz dane')}
      </button>
    </form>
  )
}

function PasswordForm() {
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: unknown) => {
      setSuccess(false)
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zmienić hasła.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    if (newPassword !== confirmPassword) {
      setError(t('Nowe hasła nie są takie same.'))
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zmiana hasła')}</h2>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Bieżące hasło')}
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="input mt-1"
        />
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Nowe hasło')}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="input mt-1"
        />
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Powtórz nowe hasło')}
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="input mt-1"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{t('Hasło zostało zmienione.')}</p>}
      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {t('Zmień hasło')}
      </button>
    </form>
  )
}

function InviteFriends() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [qrId, setQrId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending')

  const { data } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => (await api.get<InvitationList>('/auth/invitations/')).data,
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/invitations/', email.trim() ? { email: email.trim() } : {}),
    onSuccess: () => {
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/invitations/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }),
  })

  function onDelete(id: number) {
    if (window.confirm(t('Usunąć ten link z zaproszeniem?'))) {
      deleteMutation.mutate(id)
    }
  }

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
  }

  const remaining = data?.remaining
  const canInvite = remaining === null || remaining === undefined || remaining > 0
  const errorData = (mutation.error as { response?: { data?: { detail?: string; email?: string } } } | undefined)
    ?.response?.data
  const errorDetail = errorData?.detail ?? errorData?.email

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Zaproś znajomych')}</h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {remaining === null || remaining === undefined
            ? t('Limit: bez ograniczeń')
            : t('Pozostało w tym tygodniu: {0} z {1}', String(remaining), String(data?.weekly_limit ?? 3))}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('Wygeneruj link i kod QR, albo od razu podaj e-mail znajomego, żeby wysłać mu zaproszenie.')}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('E-mail znajomego (opcjonalnie)')}
          className="input max-w-xs"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canInvite}
          className="btn-primary"
        >
          {email.trim() ? t('+ Wyślij zaproszenie mailem') : t('+ Wygeneruj zaproszenie')}
        </button>
      </div>
      {!canInvite && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('Wykorzystano limit zaproszeń na ten tydzień — odnawia się na bieżąco, 7 dni po każdym zaproszeniu.')}
        </p>
      )}
      {errorDetail && <p className="text-sm text-red-600 dark:text-red-400">{errorDetail}</p>}

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 pt-2">
        {(['pending', 'accepted'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition ${
              tab === key
                ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {key === 'pending' ? t('Oczekujące zaproszenia') : t('Przyjęte zaproszenia')}
            {' '}({(data?.results ?? []).filter((inv) => (key === 'accepted') === !!inv.accepted_by).length})
          </button>
        ))}
      </div>

      {(() => {
        const filtered = (data?.results ?? []).filter((inv) => (tab === 'accepted') === !!inv.accepted_by)
        if (filtered.length === 0) {
          return (
            <p className="pt-1 text-sm text-slate-400 dark:text-slate-500">
              {tab === 'pending' ? t('Brak oczekujących zaproszeń.') : t('Brak przyjętych zaproszeń.')}
            </p>
          )
        }
        return (
          <ul className="space-y-2 pt-2">
            {filtered.map((inv) => (
              <li key={inv.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">{inv.invite_url}</span>
                  <div className="flex shrink-0 gap-2">
                    {!inv.accepted_by && (
                      <>
                        <button
                          onClick={() => copyLink(inv.id, inv.invite_url)}
                          className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {copiedId === inv.id ? t('Skopiowano!') : t('Kopiuj link')}
                        </button>
                        <button
                          onClick={() => setQrId((prev) => (prev === inv.id ? null : inv.id))}
                          className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {qrId === inv.id ? t('Ukryj QR') : t('Pokaż QR')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(inv.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {t('Usuń')}
                    </button>
                  </div>
                </div>
                {qrId === inv.id && (
                  <div className="mt-2 flex justify-center rounded-md bg-white p-3">
                    <QRCodeSVG value={inv.invite_url} size={160} />
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {inv.accepted_by
                    ? t('Zaakceptowane przez {0} ({1})', inv.accepted_by, formatDateTime(inv.accepted_at))
                    : inv.is_expired
                      ? t('Wygasło — wygenerowano {0}', formatDateTime(inv.created_at))
                      : t('Oczekuje — wygenerowano {0}, wygasa po 48h', formatDateTime(inv.created_at))}
                </p>
              </li>
            ))}
          </ul>
        )
      })()}
    </div>
  )
}

const HEATMAP_WEEKS = 26

function LoginHeatmap({ dates }: { dates: string[] }) {
  const { t } = useLanguage()
  const counts = new Map<string, number>()
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Start on a Monday, HEATMAP_WEEKS weeks back, so the grid ends on the
  // current week — same layout convention as GitHub's contribution graph.
  const start = new Date(today)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday - (HEATMAP_WEEKS - 1) * 7)

  const weeks: { date: Date; key: string; count: number }[][] = []
  const cursor = new Date(start)
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const week: { date: Date; key: string; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10)
      week.push({ date: new Date(cursor), key, count: counts.get(key) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  function shade(count: number) {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800'
    if (count === 1) return 'bg-accent-200 dark:bg-accent-900'
    if (count === 2) return 'bg-accent-400 dark:bg-accent-700'
    return 'bg-accent-600 dark:bg-accent-500'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${t('{0} logowań', String(cell.count))}`}
                className={`h-2.5 w-2.5 rounded-sm ${cell.date > today ? 'opacity-0' : shade(cell.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function LoginHistorySection() {
  const { t } = useLanguage()

  const { data } = useQuery({
    queryKey: ['login-history'],
    queryFn: async () => (await api.get<LoginHistoryResponse>('/auth/login-history/')).data,
  })

  const peakHourLabel = data?.stats.peak_hour !== null && data?.stats.peak_hour !== undefined
    ? `${String(data.stats.peak_hour).padStart(2, '0')}:00`
    : '—'

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia logowań')}</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Logowania ogółem')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{data?.stats.total_logins ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Aktualna passa')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            {data ? t('{0} dni', String(data.stats.current_streak)) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Najdłuższa passa')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            {data ? t('{0} dni', String(data.stats.longest_streak)) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Najczęstsza godzina')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{peakHourLabel}</p>
        </div>
      </div>

      {data && data.results.length > 0 && (
        <>
          <LoginHeatmap dates={data.results.map((r) => r.created_at.slice(0, 10))} />

          <ul className="space-y-1 pt-2">
            {data.results.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
              >
                <span className="text-slate-600 dark:text-slate-300">{entry.device}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {entry.ip ?? '—'} · {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
