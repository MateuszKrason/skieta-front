import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { CardLoader } from '../../components/Loader'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatMoney } from '../../lib/format'
import {
  apiError,
  KIND_ICONS,
  KIND_LABELS,
  MAX_MEMBERS,
  SPLIT_CURRENCIES,
  splitsApi,
  type SplitKind,
} from '../../lib/splits'
import { CARD, ErrorText, Field, NetLabel, PRIMARY, SECONDARY } from './ui'

function NewGroupForm({ onCancel }: { onCancel: () => void }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SplitKind>('trip')
  const [currency, setCurrency] = useState('PLN')
  const [description, setDescription] = useState('')
  const [myName, setMyName] = useState(user?.first_name || user?.username || '')
  const [others, setOthers] = useState<string[]>(['', ''])
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: splitsApi.create,
    onSuccess: (state) => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      queryClient.setQueryData(['split', state.group.share_token], state)
      navigate(`/wspolne/${state.group.share_token}`)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się założyć wydarzenia.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    create.mutate({
      name,
      kind,
      currency,
      description,
      my_name: myName,
      other_names: others.map((o) => o.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Nowe wydarzenie')}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label={t('Nazwa')}>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('np. Zakopane w lutym')}
              maxLength={80}
              required
              autoFocus
            />
          </Field>
        </div>
        <Field label={t('Rodzaj')}>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as SplitKind)}>
            {(Object.keys(KIND_LABELS) as SplitKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_ICONS[k]} {t(KIND_LABELS[k])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('Twoje imię')} hint={t('Tak zobaczą Cię pozostali.')}>
          <input className="input" value={myName} onChange={(e) => setMyName(e.target.value)} maxLength={40} required />
        </Field>
        <Field label={t('Waluta rozliczenia')} hint={t('Wydatki mogą być w różnych walutach, rozliczacie się w tej.')}>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {SPLIT_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Opis (opcjonalnie)')}>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </Field>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('Pozostałe osoby (opcjonalnie, do {0} razem z Tobą)', String(MAX_MEMBERS))}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {t('Możesz je wpisać od razu albo wysłać link i każdy dopisze się sam.')}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {others.map((value, i) => (
            <input
              key={i}
              className="input"
              value={value}
              maxLength={40}
              placeholder={t('Imię')}
              onChange={(e) => setOthers((list) => list.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
        {others.length < MAX_MEMBERS - 1 && (
          <button
            type="button"
            className="mt-2 text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
            onClick={() => setOthers((list) => [...list, ''])}
          >
            {t('+ kolejna osoba')}
          </button>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button type="submit" className={PRIMARY} disabled={create.isPending}>
          {create.isPending ? t('Zakładanie…') : t('Załóż i przejdź do wydarzenia')}
        </button>
        <button type="button" className={SECONDARY} onClick={onCancel}>
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

export default function WspolneLista() {
  const { t } = useLanguage()
  const [creating, setCreating] = useState(false)
  const { data: groups, isLoading } = useQuery({ queryKey: ['splits'], queryFn: splitsApi.list })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Wspólne rozliczenia')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t(
              'Wyjazd, wspólne mieszkanie albo wyjście ze znajomymi. Wysyłasz link, znajomi dołączają swoim kontem w skiecie, każdy dopisuje, co zapłacił, a skieta liczy, kto komu ile oddaje.',
            )}
          </p>
        </div>
        {!creating && (
          <button type="button" className={PRIMARY} onClick={() => setCreating(true)}>
            {t('+ Nowe wydarzenie')}
          </button>
        )}
      </div>

      {creating && <NewGroupForm onCancel={() => setCreating(false)} />}

      {isLoading ? (
        <CardLoader />
      ) : !groups || groups.length === 0 ? (
        !creating && (
          <div className={`${CARD} text-center`}>
            <p className="text-3xl">🧳🍕🏠</p>
            <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">{t('Nie masz jeszcze żadnego wspólnego rozliczenia.')}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('Załóż wydarzenie, wyślij link znajomym i dopisujcie wydatki na bieżąco.')}
            </p>
            <button type="button" className={`${PRIMARY} mt-4`} onClick={() => setCreating(true)}>
              {t('+ Nowe wydarzenie')}
            </button>
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Link
              key={g.share_token}
              to={`/wspolne/${g.share_token}`}
              className={`${CARD} block transition hover:border-accent-400 dark:hover:border-accent-600`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {KIND_ICONS[g.kind]} {g.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{g.members.join(', ')}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatMoney(g.total, g.currency)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('Wydatków: {0}', String(g.expense_count))} · {formatDate(g.updated_at)}
                </span>
                {g.my_net !== null && <NetLabel net={g.my_net} currency={g.currency} me />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
