import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { apiError, splitsApi, type SplitMember, type SplitState } from '../../lib/splits'
import { CARD, DANGER, ErrorText, PRIMARY, SECONDARY } from './ui'

function MemberRow({
  member,
  token,
  meId,
  onState,
  onPick,
}: {
  member: SplitMember
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onPick: (id: number) => void
}) {
  const { t } = useLanguage()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(member.name)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const rename = useMutation({
    mutationFn: () => splitsApi.updateMember(token, member.id, { name }),
    onSuccess: (next) => {
      setRenaming(false)
      onState(next)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się zmienić imienia.'))),
  })
  const remove = useMutation({
    mutationFn: () => splitsApi.removeMember(token, member.id),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się usunąć osoby.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    rename.mutate()
  }

  return (
    <li className="py-2.5">
      {renaming ? (
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <input className="input min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoFocus />
          <button type="submit" className={PRIMARY} disabled={rename.isPending}>
            {t('Zapisz')}
          </button>
          <button
            type="button"
            className={SECONDARY}
            onClick={() => {
              setRenaming(false)
              setName(member.name)
            }}
          >
            {t('Anuluj')}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {member.name}
            {member.id === meId && (
              <span className="ml-2 rounded-full bg-accent-100 dark:bg-accent-900/40 px-2 py-0.5 text-xs font-medium text-accent-800 dark:text-accent-300">
                {t('Ty')}
              </span>
            )}
            {member.is_owner && (
              <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                {t('admin')}
              </span>
            )}
            {member.linked && !member.is_owner && (
              <span className="ml-2 text-xs text-slate-400" title={t('Ta osoba ma konto w skiecie')}>
                {t('konto w skiecie')}
              </span>
            )}
          </span>
          {member.id !== meId && (
            <button type="button" className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline" onClick={() => onPick(member.id)}>
              {t('To ja')}
            </button>
          )}
          <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setRenaming(true)}>
            {t('Zmień imię')}
          </button>
          {member.can_delete && !member.is_owner && (
            confirming ? (
              <span className="flex gap-1">
                <button type="button" className={DANGER} onClick={() => remove.mutate()} disabled={remove.isPending}>
                  {t('Usuń')}
                </button>
                <button type="button" className={SECONDARY} onClick={() => setConfirming(false)}>
                  {t('Nie')}
                </button>
              </span>
            ) : (
              <button type="button" className="text-xs text-slate-400 hover:text-red-600" onClick={() => setConfirming(true)}>
                {t('Usuń')}
              </button>
            )
          )}
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </li>
  )
}

export default function PeopleTab({
  state,
  token,
  meId,
  onState,
  onPick,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onPick: (id: number) => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const full = state.members.length >= state.limits.members

  const add = useMutation({
    mutationFn: () => splitsApi.addMember(token, name, false),
    onSuccess: (next) => {
      setName('')
      onState(next)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się dodać osoby.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    add.mutate()
  }

  return (
    <div className={`${CARD} space-y-3`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('Osoby ({0} z {1})', String(state.members.length), String(state.limits.members))}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('Usunąć można tylko osobę bez wydatków i zwrotów. Nowe imię od razu widzą wszyscy.')}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {state.members.map((m) => (
          <MemberRow key={m.id} member={m} token={token} meId={meId} onState={onState} onPick={onPick} />
        ))}
      </ul>
      {full ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Wydarzenie ma już komplet: {0} osób.', String(state.limits.members))}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <input
            className="input min-w-0 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Imię kolejnej osoby')}
            maxLength={40}
            required
          />
          <button type="submit" className={PRIMARY} disabled={add.isPending}>
            {t('Dodaj osobę')}
          </button>
        </form>
      )}
      <ErrorText>{error}</ErrorText>
      {user && state.me === null && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('Kliknij „To ja” przy swoim imieniu, a wydarzenie pojawi się na Twojej liście w skiecie.')}
        </p>
      )}
    </div>
  )
}
