import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function Account() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Moje konto')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('Zaloguj jako {0}', user?.username ?? '')}</p>
      </div>

      <EmailVerificationStatus />
      <ProfileForm />
      <PasswordForm />
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

function ProfileForm() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
        {t('Nazwa użytkownika')}
        <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input mt-1" />
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
