import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLanguage } from '../../i18n/LanguageContext'
import { apiError, splitsApi, type SplitMember, type SplitState } from '../../lib/splits'
import { CARD, DANGER, ErrorText, PRIMARY, SECONDARY } from './ui'

function MemberRow({
  member,
  token,
  meId,
  isOwner,
  onState,
}: {
  member: SplitMember
  token: string
  meId: number
  isOwner: boolean
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(member.name)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const isMe = member.id === meId
  // A name tied to someone's account is theirs; the event's creator can
  // still tidy up. Names nobody has taken yet anyone in the group may fix.
  const mayEdit = !member.linked || isMe || isOwner

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
  const switchTo = useMutation({
    mutationFn: () => splitsApi.updateMember(token, member.id, { claim: true }),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się połączyć imienia z kontem.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    rename.mutate()
  }

  return (
    <li className="py-3">
      {renaming ? (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input className="input min-w-0 sm:flex-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoFocus />
          <div className="flex gap-2">
            <button type="submit" className={`${PRIMARY} flex-1 sm:flex-none`} disabled={rename.isPending}>
              {t('Zapisz')}
            </button>
            <button
              type="button"
              className={`${SECONDARY} flex-1 sm:flex-none`}
              onClick={() => {
                setRenaming(false)
                setName(member.name)
              }}
            >
              {t('Anuluj')}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
              <span className="[overflow-wrap:anywhere]">{member.name}</span>
              {isMe && (
                <span className="rounded-full bg-accent-100 dark:bg-accent-900/40 px-2 py-0.5 text-xs font-medium text-accent-800 dark:text-accent-300">
                  {t('Ty')}
                </span>
              )}
              {member.is_owner && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {t('admin')}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {member.linked ? t('dołączono kontem w skiecie') : t('czeka na dołączenie przez link')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {!member.linked && !isMe && (
              <button
                type="button"
                className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
                onClick={() => switchTo.mutate()}
                disabled={switchTo.isPending}
                title={t('Połącz to imię ze swoim kontem zamiast obecnego')}
              >
                {t('To ja')}
              </button>
            )}
            {mayEdit && (
              <button type="button" className="text-slate-500 hover:underline" onClick={() => setRenaming(true)}>
                {t('Zmień imię')}
              </button>
            )}
            {mayEdit && member.can_delete && !member.is_owner && !confirming && (
              <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => setConfirming(true)}>
                {t('Usuń')}
              </button>
            )}
          </div>
          {confirming && (
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{t('Usunąć tę osobę z wydarzenia?')}</span>
              <button type="button" className={DANGER} onClick={() => remove.mutate()} disabled={remove.isPending}>
                {t('Usuń')}
              </button>
              <button type="button" className={SECONDARY} onClick={() => setConfirming(false)}>
                {t('Nie')}
              </button>
            </div>
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
}: {
  state: SplitState
  token: string
  meId: number
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
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
          {t(
            'Każdy dołącza swoim kontem: otwiera link, loguje się i wybiera swoje imię. Imiona, które jeszcze czekają, możesz już uwzględniać w wydatkach.',
          )}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {state.members.map((m) => (
          <MemberRow key={m.id} member={m} token={token} meId={meId} isOwner={state.group.is_owner} onState={onState} />
        ))}
      </ul>
      {full ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Wydarzenie ma już komplet: {0} osób.', String(state.limits.members))}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input min-w-0 sm:flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Imię kolejnej osoby')}
            maxLength={40}
            required
          />
          <button type="submit" className={`${PRIMARY} py-2 sm:py-1.5`} disabled={add.isPending}>
            {t('Dodaj osobę')}
          </button>
        </form>
      )}
      <ErrorText>{error}</ErrorText>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t('Usunąć można tylko osobę bez wydatków i zwrotów.')}
      </p>
    </div>
  )
}
