import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate } from '../lib/format'

interface TwoFactorStatus {
  enabled: boolean
  enabled_at: string | null
  recovery_codes_left: number
}

interface Setup {
  secret: string
  otpauth_uri: string
}

/** The first message the server sent back, whichever field it was filed under. */
function serverMessage(err: unknown): string | null {
  const data = (err as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return null
  const first = Object.values(data as Record<string, unknown>).flat()[0]
  return typeof first === 'string' ? first : null
}

/** The secret in groups of four, the way authenticator apps show it back. */
function grouped(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret
}

// Two-step login: a code from an authenticator app on top of the password
// (accounts.two_factor). Three states on one card - off, being set up, on -
// because each has exactly one thing to do next.
export default function TwoFactorSettings() {
  const { t } = useLanguage()
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const status = useQuery({
    queryKey: ['two-factor'],
    queryFn: async () => (await api.get<TwoFactorStatus>('/auth/two-factor/')).data,
  })

  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['two-factor'] }), refreshUser()])
  }

  const start = useMutation({
    mutationFn: async () => (await api.post<Setup>('/auth/two-factor/setup/')).data,
    onSuccess: (data) => {
      setSetup(data)
      setCode('')
      setError(null)
    },
    onError: (err) => setError(serverMessage(err) ?? t('Nie udało się rozpocząć konfiguracji.')),
  })

  const confirm = useMutation({
    mutationFn: async () =>
      (await api.post<{ recovery_codes: string[] }>('/auth/two-factor/confirm/', { code: code.trim() })).data,
    onSuccess: async (data) => {
      setRecoveryCodes(data.recovery_codes)
      setSetup(null)
      setCode('')
      setError(null)
      await refresh()
    },
    onError: (err) => setError(serverMessage(err) ?? t('Nie udało się potwierdzić kodu.')),
  })

  const disable = useMutation({
    mutationFn: () => api.post('/auth/two-factor/disable/', { current_password: password, code: code.trim() }),
    onSuccess: async () => {
      setDisabling(false)
      setPassword('')
      setCode('')
      setError(null)
      await refresh()
    },
    onError: (err) => setError(serverMessage(err) ?? t('Nie udało się wyłączyć logowania dwuetapowego.')),
  })

  function onConfirm(e: FormEvent) {
    e.preventDefault()
    confirm.mutate()
  }

  function onDisable(e: FormEvent) {
    e.preventDefault()
    disable.mutate()
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes) return
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      setCopied(true)
    } catch {
      // No clipboard access - the codes are on screen and can be selected by hand.
    }
  }

  const card = 'space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm'
  const heading = (
    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Logowanie dwuetapowe')}</h2>
  )

  if (recoveryCodes) {
    return (
      <div className={card}>
        {heading}
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('Logowanie dwuetapowe jest włączone.')}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t(
            'Zapisz kody zapasowe w bezpiecznym miejscu. Każdy działa jeden raz i pozwala się zalogować, gdy nie masz telefonu. Nie pokażemy ich drugi raz.',
          )}
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 dark:bg-slate-900 p-3 font-mono text-sm text-slate-800 dark:text-slate-200">
          {recoveryCodes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={copyRecoveryCodes}>
            {copied ? t('Skopiowano') : t('Kopiuj kody')}
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => {
              setRecoveryCodes(null)
              setCopied(false)
            }}
          >
            {t('Mam je zapisane')}
          </button>
        </div>
      </div>
    )
  }

  if (setup) {
    return (
      <form onSubmit={onConfirm} className={card}>
        {heading}
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>{t('Otwórz aplikację uwierzytelniającą, na przykład Google Authenticator, Aegis albo 1Password.')}</li>
          <li>{t('Zeskanuj kod QR albo przepisz klucz ręcznie.')}</li>
          <li>{t('Wpisz sześć cyfr, które pokaże aplikacja.')}</li>
        </ol>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-md bg-white p-2">
            <QRCodeSVG value={setup.otpauth_uri} size={148} />
          </div>
          <div className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
            {t('Klucz do wpisania ręcznie')}
            <p className="mt-1 break-all font-mono text-sm text-slate-800 dark:text-slate-200">{grouped(setup.secret)}</p>
          </div>
        </div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Kod z aplikacji uwierzytelniającej')}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            required
            className="input mt-1 tracking-widest"
          />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={confirm.isPending}>
            {t('Włącz')}
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => {
              setSetup(null)
              setError(null)
            }}
          >
            {t('Anuluj')}
          </button>
        </div>
      </form>
    )
  }

  if (status.data?.enabled) {
    return (
      <form onSubmit={onDisable} className={card}>
        {heading}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('Włączone od {0}. Przy logowaniu oprócz hasła podajesz kod z aplikacji.', formatDate(status.data.enabled_at))}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('Niewykorzystane kody zapasowe: {0}', String(status.data.recovery_codes_left))}
        </p>
        {disabling ? (
          <>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('Bieżące hasło')}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input mt-1"
              />
            </label>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('Kod z aplikacji albo kod zapasowy')}
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                required
                className="input mt-1 tracking-widest"
              />
            </label>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                disabled={disable.isPending}
              >
                {t('Wyłącz logowanie dwuetapowe')}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => {
                  setDisabling(false)
                  setError(null)
                }}
              >
                {t('Anuluj')}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => {
              setDisabling(true)
              setCode('')
              setError(null)
            }}
          >
            {t('Wyłącz')}
          </button>
        )}
      </form>
    )
  }

  return (
    <div className={card}>
      {heading}
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t(
          'Dodaj drugi krok do logowania: oprócz hasła podasz sześciocyfrowy kod z aplikacji w telefonie. Nawet jeśli ktoś pozna Twoje hasło, nie wejdzie na konto.',
        )}
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="button" className="btn-primary" disabled={start.isPending || status.isLoading} onClick={() => start.mutate()}>
        {t('Włącz logowanie dwuetapowe')}
      </button>
    </div>
  )
}
