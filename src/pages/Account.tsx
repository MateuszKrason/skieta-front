import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_NAV_ORDER, REORDERABLE_LINKS } from '../components/Layout'
import { useLanguage, LANGUAGES, LANGUAGE_LABELS, type Language } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { COUNTRIES } from '../lib/countries'
import { formatCountdown, formatDateTime } from '../lib/format'
import { useTheme, type Theme } from '../theme/ThemeContext'
import { useTour } from '../tour/TourContext'
import type { Currency, Invitation, InvitationList, LoginHistoryResponse, RoleAssignment } from '../types'

const CURRENCY_OPTIONS: Currency[] = ['PLN', 'USD', 'EUR', 'GBP']

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
      <TourReplaySection />
      <InterestsForm />
      <NavOrderForm />
      <PasswordForm />
      <InviteFriends />
      <LoginHistorySection />
      <ExportDataSection />
      <DeleteAccountSection />
    </div>
  )
}

// RODO art. 15 (dostęp) i art. 20 (przenoszalność). Deliberately three
// separate buttons rather than one "request my data" form: the file is small
// enough to build on the spot, and a request someone has to handle by hand is
// a request that gets handled late.
//
// The download can't be a plain <a href> - the API is behind a bearer token
// that lives in localStorage, not in a cookie, so the browser would send an
// unauthenticated request. Fetch it through the same axios client everything
// else uses, then hand the blob to a throwaway link.
function ExportDataSection() {
  const { t } = useLanguage()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function download(key: string, path: string) {
    setPending(key)
    setError(null)
    try {
      const response = await api.get(path, { responseType: 'blob' })
      const disposition = String(response.headers['content-disposition'] ?? '')
      const match = disposition.match(/filename="([^"]+)"/)
      const url = URL.createObjectURL(response.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = match ? match[1] : 'skieta-dane'
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Revoking immediately can cancel the download in some browsers, so give
      // the click a moment to start it.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      trackEvent('data_exported', { dataset: key })
    } catch {
      setError(t('Nie udało się pobrać pliku. Spróbuj ponownie za chwilę.'))
    } finally {
      setPending(null)
    }
  }

  const buttons = [
    { key: 'json', label: t('Pełna kopia (JSON)'), path: '/auth/me/export/' },
    { key: 'transakcje', label: t('Transakcje (CSV)'), path: '/auth/me/export/csv/transakcje/' },
    { key: 'portfel', label: t('Portfel (CSV)'), path: '/auth/me/export/csv/portfel/' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Pobierz swoje dane')}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t(
          'Twoje dane należą do Ciebie. Pełna kopia w JSON zawiera wszystko, co przechowujemy na Twoim koncie. Pliki CSV otwierają się bezpośrednio w Excelu i arkuszach Google.',
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {buttons.map((button) => (
          <button
            key={button.key}
            type="button"
            onClick={() => download(button.key, button.path)}
            disabled={pending !== null}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            {pending === button.key ? t('Pobieranie…') : button.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

const DELETE_CONFIRM_WORD = 'USUŃ'

function DeleteAccountSection() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.delete('/auth/me/', { data: { current_password: password } }),
    onSuccess: () => {
      logout()
      navigate('/')
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się usunąć konta.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (confirmText !== DELETE_CONFIRM_WORD) {
      setError(t('Wpisz dokładnie "{0}", żeby potwierdzić.', DELETE_CONFIRM_WORD))
      return
    }
    const confirmed = window.confirm(
      t(
        'Czy na pewno chcesz usunąć konto? Zostanie zablokowane od razu, a po 30 dniach Twoje dane znikną bezpowrotnie. Link do cofnięcia wyślemy Ci mailem.',
      ),
    )
    if (!confirmed) return
    mutation.mutate()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">{t('Usuń konto')}</h2>
      <p className="text-xs text-red-700/80 dark:text-red-400/80">
        {t(
          'Konto zostanie zablokowane od razu, a po 30 dniach trwale usuniemy wszystkie Twoje dane: konta bankowe, transakcje, budżet, inwestycje i historię logowań. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wyślemy. Zanim usuniesz konto, pobierz swoje dane w sekcji wyżej.',
        )}
      </p>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Hasło')}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input mt-1"
        />
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Wpisz {0}, żeby potwierdzić', DELETE_CONFIRM_WORD)}
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          required
          className="input mt-1"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {mutation.isPending ? t('Usuwanie…') : t('Usuń konto')}
      </button>
    </form>
  )
}

const INTEREST_OPTIONS: {
  field: 'interest_stocks' | 'interest_budget' | 'interest_planning' | 'interest_analysis' | 'interest_crypto'
  label: string
}[] = [
  { field: 'interest_stocks', label: 'Giełda' },
  { field: 'interest_crypto', label: 'Krypto' },
  { field: 'interest_budget', label: 'Budżet' },
  { field: 'interest_planning', label: 'Planowanie' },
  { field: 'interest_analysis', label: 'Analiza' },
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

function NavOrderForm() {
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  const [order, setOrder] = useState<string[]>(user?.profile.nav_order ?? DEFAULT_NAV_ORDER)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  useEffect(() => {
    if (user?.profile.nav_order) setOrder(user.profile.nav_order)
  }, [user?.profile.nav_order])

  const mutation = useMutation({
    mutationFn: (nextOrder: string[]) => api.patch('/auth/me/', { nav_order: nextOrder }),
  })

  // A tab whose "Z czego korzystasz" interest is unchecked is already hidden
  // from the real nav (see Layout.tsx's getNavLinks) - hide it here too so
  // there's nothing to drag that wouldn't show up anywhere. "Konta i lokaty"
  // has no interest key, so it's always visible.
  function isVisible(key: string) {
    const link = REORDERABLE_LINKS[key]
    if (!link) return false
    return !link.interest || !user || user.profile[link.interest]
  }
  const visibleKeys = order.filter(isVisible)

  // Dragging only reorders the visible subset - a hidden (unchecked) key
  // keeps its exact array slot untouched, so wherever it lands once its
  // interest gets re-enabled is whatever was last saved, not scrambled by
  // reorders that happened while it was hidden.
  function commit(newVisibleKeys: string[]) {
    let i = 0
    const next = order.map((key) => (isVisible(key) ? newVisibleKeys[i++] : key))
    setOrder(next)
    updateProfile({ nav_order: next })
    mutation.mutate(next)
  }

  function handleDrop(targetKey: string) {
    setOverKey(null)
    if (!dragKey || dragKey === targetKey) return
    const next = [...visibleKeys]
    const from = next.indexOf(dragKey)
    const to = next.indexOf(targetKey)
    next.splice(from, 1)
    next.splice(to, 0, dragKey)
    commit(next)
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Kolejność kart w menu')}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t(
          'Przeciągnij, aby ustawić kolejność, w jakiej karty pojawiają się w górnym menu — Dashboard zawsze jest pierwszy.',
        )}
      </p>
      <ul className="space-y-1.5">
        {visibleKeys.map((key) => {
          const link = REORDERABLE_LINKS[key]
          return (
            <li
              key={key}
              draggable
              onDragStart={() => setDragKey(key)}
              onDragEnd={() => {
                setDragKey(null)
                setOverKey(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (key !== overKey) setOverKey(key)
              }}
              onDrop={() => handleDrop(key)}
              className={`flex cursor-grab items-center gap-2 rounded-md border px-3 py-2 text-sm text-slate-700 dark:text-slate-300 active:cursor-grabbing ${
                dragKey === key
                  ? 'opacity-40 border-slate-200 dark:border-slate-700'
                  : overKey === key
                    ? 'border-accent-500'
                    : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                ⠿
              </span>
              <span>{t(link.label)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const VARIANT_LABELS: Record<Theme, string> = {
  light: 'Jasny',
  dark: 'Ciemny',
  pink: 'Lawendowy',
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
    mutationFn: (lang: Language) => api.patch('/auth/me/', { language: lang }),
    onSuccess: (_, lang) => {
      setLanguage(lang)
      updateProfile({ language: lang })
      setSuccess(true)
    },
  })

  const currencyMutation = useMutation({
    mutationFn: (currency: Currency) => api.patch('/auth/me/', { base_currency: currency }),
    onSuccess: (_, currency) => {
      updateProfile({ base_currency: currency })
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
            languageMutation.mutate(e.target.value as Language)
          }}
          className="input mt-1"
        >
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Domyślna waluta')}
        <select
          value={user?.profile.base_currency ?? 'PLN'}
          onChange={(e) => {
            setSuccess(false)
            currencyMutation.mutate(e.target.value as Currency)
          }}
          className="input mt-1"
        >
          {CURRENCY_OPTIONS.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
      {success && <p className="text-sm text-emerald-600">{t('Zapisano zmiany.')}</p>}
    </div>
  )
}

function TourReplaySection() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { start } = useTour()

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Przewodnik po aplikacji')}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Krótki, interaktywny spacer po głównych sekcjach aplikacji.')}</p>
      </div>
      <button
        onClick={() => {
          navigate('/dashboard')
          start()
        }}
        className="shrink-0 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {t('Pokaż ponownie')}
      </button>
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

// Every query key that embeds a server-computed after-tax figure
// (accounts.tax.after_tax, applied per Profile.residency_country) - changing
// residency needs all of these invalidated, or the old country's numbers
// keep showing (cached) until each query's own staleTime/poll interval
// happens to catch up, which can take up to a minute.
const TAX_DEPENDENT_QUERY_KEYS = [
  'holdings',
  'portfolio-summary',
  'portfolio-analytics',
  'dividend-summary',
  'dividends',
  'deposits',
  'bonds',
  'dashboard',
]

function ProfileForm() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [residencyCountry, setResidencyCountry] = useState(user?.profile.residency_country ?? '')
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
      api.patch('/auth/me/', {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        residency_country: residencyCountry,
      }),
    onSuccess: async () => {
      setSuccess(true)
      setError(null)
      if (residencyCountry !== (user?.profile.residency_country ?? '')) {
        for (const key of TAX_DEPENDENT_QUERY_KEYS) {
          queryClient.invalidateQueries({ queryKey: [key] })
        }
      }
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
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('Kraj rezydencji podatkowej')}
        <select
          value={residencyCountry}
          onChange={(e) => setResidencyCountry(e.target.value)}
          className="input mt-1"
        >
          <option value="">{t('Nie podano')}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
          {t('Na tej podstawie szacujemy podatek od zysków kapitałowych i odsetek w całej aplikacji - to tylko orientacyjne wyliczenie, nie porada podatkowa.')}
        </span>
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
          maxLength={100}
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
          maxLength={100}
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

// Live countdown shown under an open QR code - ticks every second, and
// closes the QR itself (via onExpire) the moment the invite actually
// expires, instead of leaving a dead QR sitting on screen.
function QrCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const { t } = useLanguage()
  const target = new Date(expiresAt)
  const [label, setLabel] = useState(() => formatCountdown(target))

  useEffect(() => {
    const tick = () => {
      const next = formatCountdown(target)
      setLabel(next)
      if (next === null) {
        clearInterval(interval)
        onExpire()
      }
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  if (label === null) return null

  return (
    <div className="mt-2 text-center">
      <p className="text-3xl font-bold tabular-nums text-accent-700 dark:text-accent-400">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{t('Ważny jeszcze przez')}</p>
    </div>
  )
}

function InviteFriends() {
  const { language: siteLanguage, t } = useLanguage()
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [qrId, setQrId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [inviteLanguage, setInviteLanguage] = useState<Language>(siteLanguage)
  const [tab, setTab] = useState<'pending' | 'expired' | 'accepted' | 'emails'>('pending')

  const { data } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => (await api.get<InvitationList>('/auth/invitations/')).data,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/auth/invitations/', {
        ...(email.trim() && { email: email.trim() }),
        language: inviteLanguage,
      }),
    onSuccess: () => {
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  // "Show someone right now" flow: generate a bare link invite and jump
  // straight to its QR, skipping the extra "find the new row, click Pokaż
  // QR" step. If it's never scanned, it disappears on its own - the backend
  // already auto-deletes expired, unaccepted, link-only invites on the next
  // list fetch (see InvitationsView.get), so nothing lingers in history.
  const quickQrMutation = useMutation({
    mutationFn: async () =>
      (await api.post<Invitation>('/auth/invitations/', { language: inviteLanguage })).data,
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setTab('pending')
      setQrId(invitation.id)
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

  // Deep-link target for the "invite a friend" header nudge (see
  // InviteNudgeBubble) - jumps straight here instead of just landing on the
  // account page and leaving the user to scroll and find it themselves.
  useEffect(() => {
    if (window.location.hash === '#zaproszenia') {
      document.getElementById('zaproszenia')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div
      id="zaproszenia"
      className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm scroll-mt-20"
    >
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
        <select
          value={inviteLanguage}
          onChange={(e) => setInviteLanguage(e.target.value as Language)}
          title={t('Język zaproszenia')}
          className="input w-auto"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canInvite}
          className="btn-primary"
        >
          {email.trim() ? t('+ Wyślij zaproszenie mailem') : t('+ Wygeneruj zaproszenie')}
        </button>
        <button
          onClick={() => quickQrMutation.mutate()}
          disabled={quickQrMutation.isPending || !canInvite}
          title={t('Od razu pokaże kod QR - jeśli nikt z niego nie skorzysta, link zniknie sam po wygaśnięciu.')}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
        >
          {t('📱 Pokaż komuś QR')}
        </button>
      </div>
      {!canInvite && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('Wykorzystano limit zaproszeń na ten tydzień - odnawia się na bieżąco, 7 dni po każdym zaproszeniu.')}
        </p>
      )}
      {errorDetail && <p className="text-sm text-red-600 dark:text-red-400">{errorDetail}</p>}

      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700 pt-2">
        {(['pending', 'expired', 'accepted', 'emails'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition ${
              tab === key
                ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {key === 'pending' && t('Oczekujące zaproszenia')}
            {key === 'expired' && t('Wygasłe zaproszenia')}
            {key === 'accepted' && t('Przyjęte zaproszenia')}
            {key === 'emails' && t('Wysłane e-maile')}
            {' '}(
            {
              (data?.results ?? []).filter((inv) => {
                // Invites sent to an email live in the "Wysłane e-maile" tab
                // (which already shows their own status/email address) -
                // without this, a pending emailed invite showed up twice:
                // once here (as a bare link, not even showing which email it
                // went to) and once in that tab.
                if (key === 'emails') return !!inv.email
                // Expired link-only invites are auto-deleted by the backend
                // the moment they're fetched (see InvitationsView.get), so
                // this tab would always be empty for them - only emailed
                // invites actually persist in an expired state, so this tab
                // is email-only instead of the usual link-only split.
                if (key === 'expired') return !!inv.email && !inv.accepted_by && inv.is_expired
                if (inv.email) return false
                if (key === 'pending') return !inv.accepted_by && !inv.is_expired
                return !!inv.accepted_by
              }).length
            }
            )
          </button>
        ))}
      </div>

      {(() => {
        const filtered = (data?.results ?? []).filter((inv) => {
          if (tab === 'emails') return !!inv.email
          if (tab === 'expired') return !!inv.email && !inv.accepted_by && inv.is_expired
          if (inv.email) return false
          if (tab === 'pending') return !inv.accepted_by && !inv.is_expired
          return !!inv.accepted_by
        })
        if (filtered.length === 0) {
          return (
            <p className="pt-1 text-sm text-slate-400 dark:text-slate-500">
              {tab === 'pending' && t('Brak oczekujących zaproszeń.')}
              {tab === 'expired' && t('Brak wygasłych zaproszeń.')}
              {tab === 'accepted' && t('Brak przyjętych zaproszeń.')}
              {tab === 'emails' && t('Nie wysłano jeszcze żadnych zaproszeń mailem.')}
            </p>
          )
        }
        if (tab === 'emails' || tab === 'expired') {
          // 'expired' only ever contains emailed invites now (see the filter
          // above) - same row style as 'emails' so the recipient address is
          // actually visible, instead of the link-style row meant for the
          // bare-link invites this tab used to (and structurally can't
          // meaningfully) hold.
          return (
            <ul className="space-y-2 pt-2">
              {filtered.map((inv) => (
                <li key={inv.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{inv.email}</span>
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
                        ? t('Przyjęte')
                        : inv.is_expired
                          ? t('Wygasłe')
                          : t('Oczekuje')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {inv.accepted_by
                      ? t('Zaakceptowane przez {0} ({1})', inv.accepted_by, formatDateTime(inv.accepted_at))
                      : t('Wysłano {0}', formatDateTime(inv.created_at))}
                  </p>
                </li>
              ))}
            </ul>
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
                  <div className="mt-2">
                    <div className="flex justify-center rounded-md bg-white p-3">
                      <QRCodeSVG value={inv.invite_url} size={160} />
                    </div>
                    <QrCountdown expiresAt={inv.expires_at} onExpire={() => setQrId((prev) => (prev === inv.id ? null : prev))} />
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {inv.accepted_by
                    ? t('Zaakceptowane przez {0} ({1})', inv.accepted_by, formatDateTime(inv.accepted_at))
                    : inv.is_expired
                      ? t('Wygasło - wygenerowano {0}', formatDateTime(inv.created_at))
                      : t('Oczekuje - wygenerowano {0}, wygasa {1}', formatDateTime(inv.created_at), formatDateTime(inv.expires_at))}
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

  // The card itself is bg-white / dark:bg-slate-800 - the zero-count shade
  // must not match that or the grid's "empty" cells vanish into the card
  // background, leaving only the active days floating with no visible grid
  // around them (exactly what looked like stray dots before this fix).
  function shade(count: number) {
    if (count === 0) return 'bg-slate-200 dark:bg-slate-600'
    if (count === 1) return 'bg-accent-300 dark:bg-accent-700'
    if (count === 2) return 'bg-accent-500 dark:bg-accent-500'
    return 'bg-accent-700 dark:bg-accent-400'
  }

  return (
    <div className="flex justify-center overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${t('{0} logowań', String(cell.count))}`}
                className={`h-3 w-3 rounded-sm ${cell.date > today ? 'opacity-0' : shade(cell.count)}`}
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
  const { logoutFromAllDevices } = useAuth()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['login-history'],
    queryFn: async () => (await api.get<LoginHistoryResponse>('/auth/login-history/')).data,
  })

  const logoutAllMutation = useMutation({
    mutationFn: logoutFromAllDevices,
    onSuccess: () => navigate('/logowanie'),
  })

  function onLogoutAll() {
    if (
      window.confirm(
        t(
          'To wyloguje Cię ze wszystkich urządzeń, także z tego. Zaloguj się ponownie tam, gdzie chcesz dalej korzystać z konta. Kontynuować?',
        ),
      )
    ) {
      logoutAllMutation.mutate()
    }
  }

  const peakHourLabel = data?.stats.peak_hour !== null && data?.stats.peak_hour !== undefined
    ? `${String(data.stats.peak_hour).padStart(2, '0')}:00`
    : '—'

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia logowań')}</h2>
        <button
          type="button"
          onClick={onLogoutAll}
          disabled={logoutAllMutation.isPending}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
        >
          {logoutAllMutation.isPending ? t('Wylogowywanie…') : t('Wyloguj ze wszystkich urządzeń')}
        </button>
      </div>

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
