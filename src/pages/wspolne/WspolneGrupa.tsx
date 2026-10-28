import { useEffect, useState, type FormEvent } from 'react'
import type { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import AuthTopBar from '../../components/AuthTopBar'
import Layout from '../../components/Layout'
import { PageLoader } from '../../components/Loader'
import SockLogo from '../../components/SockLogo'
import { useLanguage } from '../../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../../lib/analytics'
import { formatMoney } from '../../lib/format'
import { rememberReturnTo } from '../../lib/returnTo'
import { apiError, KIND_ICONS, shareUrl, splitsApi, type SplitState } from '../../lib/splits'
import ExpensesTab from './ExpensesTab'
import ExportTab from './ExportTab'
import GroupSettings from './GroupSettings'
import PeopleTab from './PeopleTab'
import SettleTab from './SettleTab'
import { CARD, ErrorText, NetLabel, PRIMARY, SECONDARY } from './ui'

type Tab = 'wydatki' | 'rozliczenie' | 'osoby' | 'budzet'
const TABS: Tab[] = ['wydatki', 'rozliczenie', 'osoby', 'budzet']

/** Someone opened a shared link without being signed in. They see the summary
 * (whose event it is, the total, who pays whom) and the way in - with only a
 * sign-up form, a friend had no reason to join. Adding anything still needs an
 * account, and the link is kept, so signing in or registering brings them
 * straight back. */
function Invitation() {
  const { t } = useLanguage()
  const location = useLocation()
  const { token = '' } = useParams()
  const { data: preview, error } = useQuery({
    queryKey: ['split-preview', token],
    queryFn: () => splitsApi.preview(token),
    retry: false,
  })
  const gone = (error as AxiosError | null)?.response?.status === 404

  useEffect(() => {
    rememberReturnTo(location.pathname)
  }, [location.pathname])

  // Once per link and page load: how many people the summary reaches, to set
  // against how many of them then press "Załóż darmowe konto".
  const shown = Boolean(preview)
  useEffect(() => {
    if (shown) trackEvent('split_preview_viewed')
  }, [shown, token])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 pt-4">
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-7 w-7" />
          skieta
        </Link>
        {/* The switcher pins itself to the corner on the login pages; here it
            sits in the header so it never covers the card on a phone. */}
        <div className="*:static">
          <AuthTopBar />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-10">
        {gone ? (
          <div className={`${CARD} text-center`}>
            <p className="text-4xl">🔗</p>
            <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">{t('Ten link nie działa')}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('Mógł zostać zmieniony albo wydarzenie usunięto. Poproś znajomego o nowy link.')}
            </p>
            <Link
              to="/rozliczenia"
              className="mt-4 inline-block text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
            >
              {t('Jak działają wspólne rozliczenia →')}
            </Link>
          </div>
        ) : (
        <div className={`${CARD} text-center`}>
          {preview ? (
            <>
              <p className="text-4xl">{KIND_ICONS[preview.kind]}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-400">
                {t('Zaproszenie do wspólnego rozliczenia')}
              </p>
              <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 [text-wrap:balance]">
                {preview.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{preview.members.join(', ')}</p>
              <div className="mt-5 rounded-lg bg-slate-50 dark:bg-slate-900/60 p-4 text-left text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {t('Razem: {0}', formatMoney(preview.total, preview.currency))}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Wydatków: {0}', String(preview.expense_count))}
                  </span>
                </div>
                {preview.expense_count === 0 ? (
                  <p className="mt-3 text-slate-500 dark:text-slate-400">{t('Na razie nie ma tu wydatków.')}</p>
                ) : preview.transfers.length === 0 ? (
                  <p className="mt-3 text-slate-500 dark:text-slate-400">{t('Wszyscy są rozliczeni.')}</p>
                ) : (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('Kto komu ile')}
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {preview.transfers.map((tr) => (
                        <li key={`${tr.from}-${tr.to}`} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-slate-700 dark:text-slate-300">
                            {tr.from} → {tr.to}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatMoney(tr.amount, preview.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  'Żeby dopisać swoje wydatki i odhaczać oddane przelewy, załóż darmowe konto - zajmie to chwilę, a potem od razu wrócisz tutaj.',
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl">🧳🍕🏠</p>
              <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100 [text-wrap:balance]">
                {t('Masz zaproszenie do wspólnego rozliczenia')}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  'Ktoś ze znajomych liczy w skiecie wspólne wydatki i chce, żebyś do nich dołączył(a). Żeby zobaczyć wydarzenie, załóż darmowe konto - zajmie to chwilę, a potem od razu wrócisz tutaj.',
                )}
              </p>
            </>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/register"
              className={`${PRIMARY} py-3 text-base`}
              onClick={() => {
                trackEvent('register_clicked', { source: 'split_link' })
                rememberSignupSource('split_link')
              }}
            >
              {t('Załóż darmowe konto')}
            </Link>
            <Link to="/logowanie" className="py-2 text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
              {t('Mam już konto - zaloguj się')}
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            {t('W skiecie przeniesiesz potem swoją część wydatków do własnego budżetu jednym kliknięciem.')}
          </p>
        </div>
        )}
      </main>
    </div>
  )
}

/** The group page needs an account. Signed-in people see it inside the
 * app's usual frame; everyone else gets the invitation above. */
export function WspolneShell() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? <Layout /> : <Invitation />
}

function ShareBox({ token, name }: { token: string; name: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const url = shareUrl(token)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function share() {
    try {
      await navigator.share({ title: name, text: t('Dołącz do wspólnego rozliczenia: {0}', name), url })
    } catch {
      // Closed the share sheet - nothing to do.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="input min-w-0 basis-full font-mono text-xs sm:basis-auto sm:flex-1"
        aria-label={t('Link do wydarzenia')}
      />
      <button type="button" className={`${PRIMARY} flex-1 py-2 sm:flex-none sm:py-1.5`} onClick={copy}>
        {copied ? t('Skopiowane ✓') : t('Kopiuj link')}
      </button>
      {canShare && (
        <button type="button" className={`${SECONDARY} flex-1 py-2 sm:flex-none sm:py-1.5`} onClick={share}>
          {t('Udostępnij')}
        </button>
      )}
    </div>
  )
}

/** Signed in, holding the link, not in the group yet: pick a name or add one. */
function JoinGroup({
  state,
  token,
  onState,
}: {
  state: SplitState
  token: string
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const free = state.members.filter((m) => !m.linked)
  const [name, setName] = useState(free.length === 0 ? user?.first_name || '' : '')
  const [adding, setAdding] = useState(free.length === 0)
  const [error, setError] = useState('')
  const full = state.members.length >= state.limits.members

  const claim = useMutation({
    mutationFn: (id: number) => splitsApi.updateMember(token, id, { claim: true }),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się dołączyć.'))),
  })
  const add = useMutation({
    mutationFn: () => splitsApi.addMember(token, name, true),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się dołączyć.'))),
  })
  const busy = claim.isPending || add.isPending

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    add.mutate()
  }

  return (
    <div className={`${CARD} border-accent-300 dark:border-accent-700`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('Dołącz do wydarzenia')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('Wybierz swoje imię. Połączymy je z Twoim kontem i zobaczysz wszystkie wydatki, swój bilans i kto komu ile oddaje.')}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {state.members.map((m) =>
          m.linked ? (
            <span
              key={m.id}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 text-center text-sm text-slate-400 dark:text-slate-500"
              title={t('To imię jest już połączone z czyimś kontem')}
            >
              ✓ {m.name}
            </span>
          ) : (
            <button
              key={m.id}
              type="button"
              disabled={busy}
              onClick={() => {
                setError('')
                claim.mutate(m.id)
              }}
              className="rounded-full border border-accent-300 dark:border-accent-700 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-accent-50 dark:hover:bg-accent-900/30 disabled:opacity-60"
            >
              {t('To ja: {0}', m.name)}
            </button>
          ),
        )}
        {!adding && !full && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="col-span-2 rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:border-accent-500"
          >
            {t('Nie ma mnie na liście')}
          </button>
        )}
      </div>
      {adding && !full && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="input min-w-0 sm:max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Twoje imię')}
            maxLength={40}
            required
            autoFocus
          />
          <button type="submit" className={`${PRIMARY} py-2`} disabled={busy}>
            {t('Dołącz')}
          </button>
        </form>
      )}
      {full && free.length === 0 && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {t('Wydarzenie ma już komplet: {0} osób.', String(state.limits.members))}
        </p>
      )}
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  )
}

export default function WspolneGrupa() {
  const { token = '' } = useParams()
  // Keyed by the link, so a new link (or another group) starts from scratch.
  return <GroupPage key={token} token={token} />
}

function GroupPage({ token }: { token: string }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace('#', '') as Tab
    return TABS.includes(hash) ? hash : 'wydatki'
  })
  const [settings, setSettings] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [identityError, setIdentityError] = useState('')

  const { data: state, isLoading, error } = useQuery({
    queryKey: ['split', token],
    queryFn: () => splitsApi.get(token),
    // Others add expenses from their phones - keep the open page current.
    refetchInterval: 30_000,
    retry: (count, e) => (e as { response?: { status?: number } })?.response?.status !== 404 && count < 1,
  })

  function applyState(next: SplitState) {
    queryClient.setQueryData(['split', next.group.share_token], next)
    queryClient.invalidateQueries({ queryKey: ['splits'] })
    if (next.group.share_token !== token) navigate(`/wspolne/${next.group.share_token}`, { replace: true })
  }

  const leave = useMutation({
    mutationFn: (id: number) => splitsApi.updateMember(token, id, { claim: false }),
    onSuccess: (next) => {
      setLeaving(false)
      applyState(next)
    },
    onError: (e) => setIdentityError(apiError(e, t('Nie udało się odłączyć imienia.'))),
  })

  if (isLoading) return <PageLoader />
  if (error || !state) {
    return (
      <div className={`${CARD} mx-auto max-w-lg text-center`}>
        <p className="text-3xl">🔗</p>
        <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">
          {apiError(error, t('Nie udało się wczytać wydarzenia. Spróbuj odświeżyć stronę.'))}
        </p>
        <Link to="/wspolne" className={`${SECONDARY} mt-4 inline-block`}>
          {t('Moje wspólne rozliczenia')}
        </Link>
      </div>
    )
  }

  const meId = state.me
  const me = state.members.find((m) => m.id === meId)
  const myBalance = state.balances.find((b) => b.member === meId)

  function openTab(next: Tab) {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
  }

  const tabLabels: Record<Tab, string> = {
    wydatki: t('Wydatki ({0})', String(state.expenses.length)),
    rozliczenie: t('Kto komu ile'),
    osoby: t('Osoby ({0})', String(state.members.length)),
    budzet: t('Do budżetu'),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className={CARD}>
        <Link to="/wspolne" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
          ← {t('Wspólne rozliczenia')}
        </Link>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 [overflow-wrap:anywhere] sm:text-2xl">
              {KIND_ICONS[state.group.kind]} {state.group.name}
            </h1>
            {state.group.description && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{state.group.description}</p>
            )}
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {state.members.map((m) => m.name).join(', ')}
            </p>
          </div>
          {me && (
            <div className="flex items-baseline justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-2 sm:block sm:bg-transparent sm:p-0 sm:text-right dark:sm:bg-transparent">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('Razem')}</p>
                <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {formatMoney(state.total, state.group.currency)}
                </p>
              </div>
              {myBalance && state.expenses.length > 0 && (
                <p className="text-sm">
                  <NetLabel net={myBalance.net} currency={state.group.currency} me />
                </p>
              )}
            </div>
          )}
        </div>

        {me && (
          <>
            <div className="mt-4">
              <ShareBox token={state.group.share_token} name={state.group.name} />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t('Wyślij ten link znajomym. Po zalogowaniu do skiety wybiorą swoje imię i dołączą.')}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {t('Jesteś tu jako')} <strong className="text-slate-900 dark:text-slate-100">{me.name}</strong>
                {!me.is_owner && !leaving && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-accent-700 dark:text-accent-400 hover:underline"
                    onClick={() => setLeaving(true)}
                  >
                    {t('to nie moje imię')}
                  </button>
                )}
              </span>
              {state.group.is_owner && !settings && (
                <button
                  type="button"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline"
                  onClick={() => setSettings(true)}
                >
                  ⚙️ {t('Ustawienia')}
                </button>
              )}
            </div>
            {leaving && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
                <span className="w-full text-slate-700 dark:text-slate-300 sm:w-auto sm:flex-1">
                  {t('Odłączyć imię „{0}” od Twojego konta? Potem wybierzesz właściwe.', me.name)}
                </span>
                <button type="button" className={PRIMARY} onClick={() => leave.mutate(me.id)} disabled={leave.isPending}>
                  {t('Odłącz')}
                </button>
                <button type="button" className={SECONDARY} onClick={() => setLeaving(false)}>
                  {t('Anuluj')}
                </button>
              </div>
            )}
          </>
        )}
        <ErrorText>{identityError}</ErrorText>
      </div>

      {!me ? (
        <JoinGroup state={state} token={token} onState={applyState} />
      ) : (
        <>
          {settings && state.group.is_owner && (
            <GroupSettings state={state} token={token} onState={applyState} onClose={() => setSettings(false)} />
          )}

          <div className="flex border-b border-slate-200 dark:border-slate-700" role="tablist">
            {TABS.map((x) => (
              <button
                key={x}
                type="button"
                role="tab"
                aria-selected={tab === x}
                onClick={() => openTab(x)}
                className={`-mb-px flex-1 border-b-2 px-1 py-2.5 text-[13px] font-medium leading-tight sm:flex-none sm:px-3 sm:text-sm ${
                  tab === x
                    ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tabLabels[x]}
              </button>
            ))}
          </div>

          {tab === 'wydatki' && <ExpensesTab state={state} token={token} meId={me.id} onState={applyState} />}
          {tab === 'rozliczenie' && <SettleTab state={state} token={token} meId={me.id} onState={applyState} />}
          {tab === 'osoby' && <PeopleTab state={state} token={token} meId={me.id} onState={applyState} />}
          {tab === 'budzet' && <ExportTab state={state} token={token} onState={applyState} />}
        </>
      )}
    </div>
  )
}
