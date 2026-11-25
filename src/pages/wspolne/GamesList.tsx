import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatMoney, formatNumber } from '../../lib/format'
import { apiError, GAME_ICONS, GAME_LABELS, memberName, splitsApi, type SplitGame, type SplitState } from '../../lib/splits'
import { GameResult } from './GameForm'
import { CARD, DANGER, ErrorText, SECONDARY } from './ui'

function cents(value: string) {
  return Math.round(Number(value) * 100)
}

/** One line about the rules of this game, under its title. */
function rulesLine(game: SplitGame, state: SplitState, t: (s: string, ...a: string[]) => string) {
  const currency = state.group.currency
  if (game.kind === 'tournament') {
    const fee = game.entries[0]?.stake ?? '0'
    return t('wpisowe {0} · pula {1}%', formatMoney(fee, currency), (game.params.payouts ?? []).join(' / '))
  }
  if (game.kind === 'bet') {
    return game.params.result ? t('wynik: {0}', game.params.result) : t('wynik: jeszcze nie wiadomo')
  }
  if (game.kind === 'points') {
    const value = formatMoney(game.params.point_value ?? '0', currency)
    return game.params.lower_wins ? t('punkt = {0} · wygrywa mniej punktów', value) : t('punkt = {0}', value)
  }
  if (game.kind === 'loser') {
    const expense = state.expenses.find((e) => e.id === game.expense)
    return expense ? t('stawia: {0} ({1})', expense.title, formatMoney(expense.amount, expense.currency)) : ''
  }
  const pot = game.entries.reduce((sum, e) => sum + Number(e.stake), 0)
  return t('w puli {0}', formatMoney(pot, currency))
}

/** What one player put in or scored, for the expanded game. */
function entryLine(game: SplitGame, entry: SplitGame['entries'][number], currency: string, t: (s: string, ...a: string[]) => string) {
  switch (game.kind) {
    case 'poker':
      return t('wrzucone {0} · żetony {1}', formatMoney(entry.stake, currency), formatNumber(Number(entry.score ?? 0)))
    case 'tournament':
      return entry.place ? t('{0}. miejsce', String(entry.place)) : t('bez nagrody')
    case 'bet':
      return t('{0} · stawia {1}', entry.pick, formatMoney(entry.stake, currency))
    case 'points':
      return t('{0} pkt', formatNumber(Number(entry.score ?? 0)))
    default:
      return entry.lost ? t('przegrywa i stawia') : t('wygrywa')
  }
}

function GameRow({
  game,
  state,
  token,
  meId,
  onState,
  onEdit,
}: {
  game: SplitGame
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onEdit: () => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const currency = state.group.currency
  const ranked = [...game.entries].sort((a, b) => Number(b.result) - Number(a.result))
  const mine = meId !== null ? game.entries.find((e) => e.member === meId) : undefined

  const remove = useMutation({
    mutationFn: () => splitsApi.removeGame(token, game.id),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się usunąć gry.'))),
  })

  return (
    <li className="py-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <span className="text-xl leading-none">{GAME_ICONS[game.kind]}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{game.title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatDate(game.date)} · {rulesLine(game, state, t)}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {ranked.map((e) => (
              <span key={e.member} className="whitespace-nowrap">
                <span className="text-slate-600 dark:text-slate-300">{memberName(state.members, e.member, null, t)}</span>{' '}
                <GameResult cents={cents(e.result)} currency={currency} />
              </span>
            ))}
          </p>
          {game.problem && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">⚠ {t(game.problem)}</p>}
        </div>
        {mine && (
          <div className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
            {t('Twój wynik')}
            <p className="text-sm">
              <GameResult cents={cents(mine.result)} currency={currency} />
            </p>
          </div>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t(GAME_LABELS[game.kind])}</p>
          <ul className="space-y-1">
            {ranked.map((e) => (
              <li key={e.member} className="flex flex-wrap justify-between gap-x-3 text-slate-700 dark:text-slate-300">
                <span>
                  {memberName(state.members, e.member, meId, t)}
                  <span className="ml-2 text-xs text-slate-400">{entryLine(game, e, currency, t)}</span>
                </span>
                <GameResult cents={cents(e.result)} currency={currency} />
              </li>
            ))}
          </ul>
          <ErrorText>{error}</ErrorText>
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{t('Usunąć tę grę dla wszystkich?')}</span>
              <button type="button" className={DANGER} onClick={() => remove.mutate()} disabled={remove.isPending}>
                {t('Tak, usuń')}
              </button>
              <button type="button" className={SECONDARY} onClick={() => setConfirming(false)}>
                {t('Nie')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" className={SECONDARY} onClick={onEdit}>
                {t('Edytuj')}
              </button>
              <button type="button" className={DANGER} onClick={() => setConfirming(true)}>
                {t('Usuń')}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function GamesList({
  state,
  token,
  meId,
  onState,
  onEdit,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onEdit: (id: number) => void
}) {
  const { t } = useLanguage()
  if (state.games.length === 0) return null
  const games = [...state.games].sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))
  return (
    <div className={CARD}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Gry i zakłady')}</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {t('Wygrane i przegrane są już w „Kto komu ile”, razem z wydatkami.')}
      </p>
      <ul className="mt-1 divide-y divide-slate-100 dark:divide-slate-700">
        {games.map((game) => (
          <GameRow
            key={game.id}
            game={game}
            state={state}
            token={token}
            meId={meId}
            onState={onState}
            onEdit={() => onEdit(game.id)}
          />
        ))}
      </ul>
    </div>
  )
}
