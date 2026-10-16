import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import AuthTopBar from '../../components/AuthTopBar'
import Layout from '../../components/Layout'
import { PageLoader } from '../../components/Loader'
import SockLogo from '../../components/SockLogo'
import { useLanguage } from '../../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../../lib/analytics'
import { formatMoney } from '../../lib/format'
import { apiError, KIND_ICONS, rememberedMember, rememberMember, shareUrl, splitsApi, type SplitState } from '../../lib/splits'
import ExpensesTab from './ExpensesTab'
import ExportTab from './ExportTab'
import GroupSettings from './GroupSettings'
import PeopleTab from './PeopleTab'
import SettleTab from './SettleTab'
import { CARD, ErrorText, NetLabel, PRIMARY, SECONDARY } from './ui'

type Tab = 'wydatki' | 'rozliczenie' | 'osoby' | 'budzet'
const TABS: Tab[] = ['wydatki', 'rozliczenie', 'osoby', 'budzet']

/** The group page is open to anyone with the link. Signed-in people see it
 * inside the app's usual frame; guests get a bare page with the logo. */
export function WspolneShell() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Layout />
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-4">
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
          <SockLogo className="h-7 w-7" />
          skieta
        </Link>
        {/* The switcher pins itself to the corner on the login pages; here it
            scrolls away with the header instead of covering the form. */}
        <div className="*:static">
          <AuthTopBar />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
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
      await navigator.share({ title: name, text: t('Dopisz swoje wydatki: {0}', name), url })
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
        className="input min-w-0 flex-1 font-mono text-xs"
        aria-label={t('Link do wydarzenia')}
      />
      <button type="button" className={PRIMARY} onClick={copy}>
        {copied ? t('Skopiowane ✓') : t('Kopiuj link')}
      </button>
      {canShare && (
        <button type="button" className={SECONDARY} onClick={share}>
          {t('Udostępnij')}
        </button>
      )}
    </div>
  )
}

function WhoAmI({
  state,
  token,
  onPick,
  onState,
}: {
  state: SplitState
  token: string
  onPick: (id: number) => void
  onState: (s: SplitState, created?: number) => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(state.members.length <= 1)
  const [error, setError] = useState('')
  const full = state.members.length >= state.limits.members

  const add = useMutation({
    mutationFn: () => splitsApi.addMember(token, name, !!user),
    onSuccess: (next) => onState(next, next.created_member),
    onError: (e) => setError(apiError(e, t('Nie udało się dopisać.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    add.mutate()
  }

  return (
    <div className={`${CARD} border-accent-300 dark:border-accent-700`}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Kim jesteś?')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t('Wybierz swoje imię, żeby widzieć swój bilans i swoją część każdego wydatku.')}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {state.members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onPick(m.id)}
            className="rounded-full border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/30"
          >
            {m.name}
          </button>
        ))}
        {!adding && !full && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:border-accent-500"
          >
            {t('Nie ma mnie na liście')}
          </button>
        )}
      </div>
      {adding && !full && (
        <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
          <input
            className="input min-w-0 flex-1 sm:max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Twoje imię')}
            maxLength={40}
            required
          />
          <button type="submit" className={PRIMARY} disabled={add.isPending}>
            {t('Dopisz mnie')}
          </button>
        </form>
      )}
      <ErrorText>{error}</ErrorText>
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [localMe, setLocalMe] = useState<number | null>(() => rememberedMember(token))
  const [tab, setTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace('#', '') as Tab
    return TABS.includes(hash) ? hash : 'wydatki'
  })
  const [settings, setSettings] = useState(false)
  const [identityError, setIdentityError] = useState('')

  const { data: state, isLoading, error } = useQuery({
    queryKey: ['split', token],
    queryFn: () => splitsApi.get(token),
    // Others add expenses from their phones - keep the open page current.
    refetchInterval: 30_000,
    retry: (count, e) => (e as { response?: { status?: number } })?.response?.status !== 404 && count < 1,
  })


  function applyState(next: SplitState, created?: number) {
    queryClient.setQueryData(['split', next.group.share_token], next)
    queryClient.invalidateQueries({ queryKey: ['splits'] })
    if (created !== undefined) {
      rememberMember(next.group.share_token, created)
      setLocalMe(created)
    }
    if (next.group.share_token !== token) {
      rememberMember(next.group.share_token, rememberedMember(token))
      navigate(`/wspolne/${next.group.share_token}`, { replace: true })
    }
  }

  const claim = useMutation({
    mutationFn: ({ id, value }: { id: number; value: boolean }) => splitsApi.updateMember(token, id, { claim: value }),
    onSuccess: (next) => applyState(next),
    onError: (e) => setIdentityError(apiError(e, t('Nie udało się połączyć imienia z kontem.'))),
  })

  if (isLoading) return <PageLoader />
  if (error || !state) {
    return (
      <div className={`${CARD} mx-auto max-w-lg text-center`}>
        <p className="text-3xl">🔗</p>
        <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">
          {apiError(error, t('Nie udało się wczytać wydarzenia. Spróbuj odświeżyć stronę.'))}
        </p>
        <Link to={user ? '/budzet/wspolne' : '/'} className={`${SECONDARY} mt-4 inline-block`}>
          {user ? t('Moje wspólne rozliczenia') : t('Strona główna skiety')}
        </Link>
      </div>
    )
  }

  const meId = state.me ?? (localMe !== null && state.members.some((m) => m.id === localMe) ? localMe : null)
  const me = state.members.find((m) => m.id === meId)
  const myBalance = state.balances.find((b) => b.member === meId)

  function pick(id: number) {
    setIdentityError('')
    const member = state!.members.find((m) => m.id === id)
    rememberMember(token, id)
    setLocalMe(id)
    // Signed in: tie the name to the account, so the group shows up on the
    // person's own list and its expenses can go into their budget.
    if (user && member && !member.linked) claim.mutate({ id, value: true })
  }

  function forgetMe() {
    rememberMember(token, null)
    setLocalMe(null)
    if (user && state!.me !== null && me && !me.is_owner) claim.mutate({ id: me.id, value: false })
  }

  function openTab(next: Tab) {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
  }

  const tabLabels: Record<Tab, string> = {
    wydatki: t('Wydatki ({0})', String(state.expenses.length)),
    rozliczenie: t('Kto komu ile'),
    osoby: t('Osoby ({0})', String(state.members.length)),
    budzet: t('Do mojego budżetu'),
  }
  const visibleTabs = TABS.filter((x) => x !== 'budzet' || (user && state.me !== null))

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className={CARD}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {user && (
              <Link to="/budzet/wspolne" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                ← {t('Wspólne rozliczenia')}
              </Link>
            )}
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100 [overflow-wrap:anywhere]">
              {KIND_ICONS[state.group.kind]} {state.group.name}
            </h1>
            {state.group.description && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{state.group.description}</p>
            )}
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {state.members.map((m) => m.name).join(', ')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('Razem')}</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {formatMoney(state.total, state.group.currency)}
            </p>
            {myBalance && state.expenses.length > 0 && (
              <p className="text-sm">
                <NetLabel net={myBalance.net} currency={state.group.currency} me />
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ShareBox token={state.group.share_token} name={state.group.name} />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t('Każdy, kto ma ten link, widzi wydarzenie i może dopisywać wydatki. Nie potrzeba konta.')}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          {me ? (
            <span className="text-slate-600 dark:text-slate-400">
              {t('Jesteś tu jako')} <strong className="text-slate-900 dark:text-slate-100">{me.name}</strong>
              {!me.is_owner && (
                <button type="button" className="ml-2 text-xs text-accent-700 dark:text-accent-400 hover:underline" onClick={forgetMe}>
                  {t('to nie ja')}
                </button>
              )}
            </span>
          ) : (
            <span />
          )}
          {state.group.is_owner && !settings && (
            <button type="button" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline" onClick={() => setSettings(true)}>
              ⚙️ {t('Ustawienia')}
            </button>
          )}
        </div>
        <ErrorText>{identityError}</ErrorText>
      </div>

      {settings && state.group.is_owner && (
        <GroupSettings state={state} token={token} onState={applyState} onClose={() => setSettings(false)} />
      )}

      {meId === null && <WhoAmI state={state} token={token} onPick={pick} onState={applyState} />}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700" role="tablist">
        {visibleTabs.map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            onClick={() => openTab(x)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
              tab === x
                ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tabLabels[x]}
          </button>
        ))}
      </div>

      {tab === 'wydatki' && <ExpensesTab state={state} token={token} meId={meId} onState={applyState} />}
      {tab === 'rozliczenie' && <SettleTab state={state} token={token} meId={meId} onState={applyState} />}
      {tab === 'osoby' && <PeopleTab state={state} token={token} meId={meId} onState={applyState} onPick={pick} />}
      {tab === 'budzet' && user && state.me !== null && <ExportTab state={state} token={token} onState={applyState} />}

      {!user && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              'Prowadzisz budżet? W skiecie przeniesiesz swoją część tych wydatków do własnych transakcji jednym kliknięciem i odczytasz paragon ze zdjęcia. Za darmo.',
            )}
          </p>
          <Link
            to="/register"
            className={PRIMARY}
            onClick={() => {
              trackEvent('register_clicked', { source: 'split_link' })
              rememberSignupSource('split_link')
            }}
          >
            {t('Załóż konto')}
          </Link>
        </div>
      )}
    </div>
  )
}
