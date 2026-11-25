import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AmountInput } from '../../components/AmountInput'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'
import {
  apiError,
  GAME_HINTS,
  GAME_ICONS,
  GAME_KINDS,
  GAME_LABELS,
  parsePayouts,
  previewGame,
  splitsApi,
  todayIso,
  type GameInput,
  type GameKind,
  type SplitGame,
  type SplitState,
} from '../../lib/splits'
import { CARD, ErrorText, Field, PRIMARY, SECONDARY } from './ui'

interface Row {
  playing: boolean
  stake: string
  score: string
  place: string
  pick: string
  lost: boolean
}

const PAYOUT_PRESETS = ['100', '70 / 30', '50 / 30 / 20', '50 / 25 / 15 / 10']

function plain(value: string | null | undefined) {
  if (value === null || value === undefined) return ''
  const n = Number(value)
  return Number.isFinite(n) && n === 0 ? '' : String(value)
}

/** Signed money with a colour: what a player won or lost. */
export function GameResult({ cents, currency }: { cents: number; currency: string }) {
  if (cents === 0) return <span className="tabular-nums text-slate-500 dark:text-slate-400">0</span>
  return (
    <span
      className={`font-semibold tabular-nums ${cents > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
    >
      {cents > 0 ? '+' : '−'}
      {formatMoney(Math.abs(cents) / 100, currency)}
    </span>
  )
}

function KindPicker({
  hasExpenses,
  onPick,
  onCancel,
}: {
  hasExpenses: boolean
  onPick: (kind: GameKind) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className={`${CARD} space-y-3`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Gra lub zakład')}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {t('Nikt nie płaci przy stole: wynik każdego gracza wchodzi do rozliczenia, razem z wydatkami.')}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {GAME_KINDS.map((kind) => {
          const disabled = kind === 'loser' && !hasExpenses
          return (
            <button
              key={kind}
              type="button"
              disabled={disabled}
              onClick={() => onPick(kind)}
              className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-left hover:border-accent-500 hover:bg-accent-50/50 dark:hover:bg-accent-900/20 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
            >
              <span className="text-2xl leading-none">{GAME_ICONS[kind]}</span>
              <span className="min-w-0">
                <span className="block font-medium text-slate-900 dark:text-slate-100">{t(GAME_LABELS[kind])}</span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {disabled ? t('Najpierw dodaj wydatek, który ktoś ma postawić.') : t(GAME_HINTS[kind])}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" className={SECONDARY} onClick={onCancel}>
        {t('Anuluj')}
      </button>
    </div>
  )
}

export default function GameForm({
  state,
  token,
  meId,
  game,
  onDone,
  onCancel,
}: {
  state: SplitState
  token: string
  meId: number | null
  game?: SplitGame
  onDone: (next: SplitState) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const members = state.members
  const currency = state.group.currency
  const [kind, setKind] = useState<GameKind | null>(game?.kind ?? null)
  const [title, setTitle] = useState(game?.title ?? '')
  const [date, setDate] = useState(game?.date ?? todayIso())
  const [rows, setRows] = useState<Record<number, Row>>(() => {
    const byMember = new Map(game?.entries.map((e) => [e.member, e]))
    return Object.fromEntries(
      members.map((m) => {
        const entry = byMember.get(m.id)
        return [
          m.id,
          {
            playing: game ? Boolean(entry) : true,
            stake: plain(entry?.stake),
            score: entry?.score ?? '',
            place: entry?.place ? String(entry.place) : '',
            pick: entry?.pick ?? '',
            lost: entry?.lost ?? false,
          },
        ]
      }),
    )
  })
  // Poker: the buy-in typed once and given to everyone, and to "+" for a rebuy.
  const [buyIn, setBuyIn] = useState(() => (game?.kind === 'poker' ? plain(game.entries[0]?.stake) : ''))
  const [chipValue, setChipValue] = useState(game?.params.chip_value ?? '')
  // Tournament: everyone pays the same entry fee.
  const [fee, setFee] = useState(() => (game?.kind === 'tournament' ? plain(game.entries[0]?.stake) : ''))
  const [payoutsText, setPayoutsText] = useState(
    game?.params.payouts?.join(' / ') ?? (members.length >= 4 ? '50 / 30 / 20' : '70 / 30'),
  )
  const [options, setOptions] = useState<string[]>(game?.params.options ?? ['', ''])
  const [result, setResult] = useState(game?.params.result ?? '')
  const [pointValue, setPointValue] = useState(game?.params.point_value ?? '')
  const [lowerWins, setLowerWins] = useState(game?.params.lower_wins ?? false)
  const [expenseId, setExpenseId] = useState<number | ''>(game?.expense ?? '')
  const [error, setError] = useState('')

  const cleanOptions = useMemo(
    () => options.map((o) => o.split(/\s+/).join(' ').trim()).filter((o, i, all) => o && all.indexOf(o) === i),
    [options],
  )
  const expense = state.expenses.find((e) => e.id === expenseId)

  function setRow(id: number, patch: Partial<Row>) {
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  function pick(next: GameKind) {
    setKind(next)
    if (!title.trim()) setTitle(t(GAME_LABELS[next]))
  }

  function chooseExpense(id: number | '') {
    setExpenseId(id)
    const chosen = state.expenses.find((e) => e.id === id)
    if (!chosen) return
    // Only people with a part in the expense can win it off someone.
    const inSplit = new Set(chosen.shares.map((s) => s.member))
    setRows((current) =>
      Object.fromEntries(
        Object.entries(current).map(([member, row]) => [member, { ...row, playing: inSplit.has(Number(member)), lost: false }]),
      ),
    )
    if (!title.trim() || title === t(GAME_LABELS.loser)) setTitle(t('Kto stawia: {0}', chosen.title).slice(0, 120))
  }

  const playing = members.filter((m) => rows[m.id]?.playing)
  const params: SplitGame['params'] =
    kind === 'poker'
      ? chipValue
        ? { chip_value: chipValue }
        : {}
      : kind === 'tournament'
        ? { payouts: parsePayouts(payoutsText).map(String) }
        : kind === 'bet'
          ? { options: cleanOptions, result: cleanOptions.includes(result) ? result : '' }
          : kind === 'points'
            ? { point_value: pointValue, lower_wins: lowerWins }
            : {}
  const entries: GameInput['entries'] = playing.map((m) => {
    const row = rows[m.id]
    return {
      member: m.id,
      stake: kind === 'tournament' ? fee || '0' : kind === 'poker' || kind === 'bet' ? row.stake || '0' : '0',
      score: kind === 'poker' || kind === 'points' ? (row.score.trim() === '' ? null : row.score) : null,
      place: kind === 'tournament' && row.place ? Number(row.place) : null,
      pick: kind === 'bet' ? row.pick : '',
      lost: kind === 'loser' ? row.lost : false,
    }
  })
  const expenseParts = useMemo(
    () => Object.fromEntries((expense?.shares ?? []).map((s) => [s.member, Math.round(Number(s.owed_group) * 100)])),
    [expense],
  )
  const preview = kind ? previewGame(kind, params, entries, expenseParts) : { results: {}, problem: null }

  const pot = entries.reduce((sum, e) => sum + (Number(e.stake) || 0), 0)
  const chips = entries.reduce((sum, e) => sum + (Number(e.score) || 0), 0)
  const expectedChips = kind === 'poker' && Number(chipValue) > 0 ? pot / Number(chipValue) : null

  const save = useMutation({
    mutationFn: (body: GameInput) => (game ? splitsApi.updateGame(token, game.id, body) : splitsApi.addGame(token, body)),
    onSuccess: onDone,
    onError: (e) => setError(apiError(e, t('Nie udało się zapisać gry.'))),
  })

  if (!kind) return <KindPicker hasExpenses={state.expenses.length > 0} onPick={pick} onCancel={onCancel} />

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!kind) return
    save.mutate({ kind, title, date, params, expense: kind === 'loser' ? (expenseId || null) : null, entries })
  }

  const name = (id: number) => {
    const m = members.find((x) => x.id === id)
    return m ? `${m.name}${id === meId ? ` (${t('Ty')})` : ''}` : '?'
  }
  const places = Array.from({ length: Math.max(playing.length, 1) }, (_v, i) => i + 1)

  return (
    <form onSubmit={submit} className={`${CARD} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {GAME_ICONS[kind]} {game ? t('Edytuj grę') : t(GAME_LABELS[kind])}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(GAME_HINTS[kind])}</p>
        </div>
        {!game && (
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
            onClick={() => setKind(null)}
          >
            {t('zmień grę')}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label={t('Nazwa')}>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </Field>
        </div>
        <Field label={t('Data')}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>

      {kind === 'poker' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('Wpisowe ({0})', currency)} hint={t('Wpisz raz i daj wszystkim. Dokupienie dodasz przyciskiem +.')}>
            <div className="flex gap-2">
              <AmountInput className="input min-w-0 flex-1" value={buyIn} onChange={setBuyIn} placeholder="50" />
              <button
                type="button"
                className={SECONDARY}
                disabled={!(Number(buyIn) > 0)}
                onClick={() => playing.forEach((m) => setRow(m.id, { stake: buyIn }))}
              >
                {t('Wszystkim')}
              </button>
            </div>
          </Field>
          <Field
            label={t('Wartość żetonu (opcjonalnie)')}
            hint={t('Np. 0,10. Sprawdzimy tylko, czy liczba żetonów zgadza się z pulą.')}
          >
            <AmountInput className="input" value={chipValue} onChange={setChipValue} placeholder="0,10" />
          </Field>
        </div>
      )}

      {kind === 'tournament' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('Wpisowe od osoby ({0})', currency)}>
            <AmountInput className="input" value={fee} onChange={setFee} placeholder="20" required />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('Podział puli na miejsca (%)')} hint={t('Np. 50 / 30 / 20: pierwsze miejsce bierze połowę puli.')}>
              <input className="input" value={payoutsText} onChange={(e) => setPayoutsText(e.target.value)} required />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPayoutsText(preset)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    payoutsText === preset
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-accent-500'
                  }`}
                >
                  {preset === '100' ? t('zwycięzca bierze wszystko') : preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {kind === 'bet' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Możliwe wyniki')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map((option, i) => (
              <input
                key={i}
                className="input"
                value={option}
                maxLength={60}
                placeholder={i === 0 ? t('np. Polska wygra') : i === 1 ? t('np. Remis') : t('Kolejny wynik')}
                onChange={(e) => setOptions((list) => list.map((o, j) => (j === i ? e.target.value : o)))}
              />
            ))}
          </div>
          {options.length < 8 && (
            <button
              type="button"
              className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
              onClick={() => setOptions((list) => [...list, ''])}
            >
              {t('+ kolejny wynik')}
            </button>
          )}
          <Field label={t('Jak się skończyło')} hint={t('Zostaw „jeszcze nie wiadomo”, a wynik wpiszesz po meczu.')}>
            <select className="input sm:max-w-xs" value={cleanOptions.includes(result) ? result : ''} onChange={(e) => setResult(e.target.value)}>
              <option value="">{t('jeszcze nie wiadomo')}</option>
              {cleanOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {kind === 'points' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('Wartość punktu ({0})', currency)} hint={t('Liczone od średniej: kto ma 10 punktów powyżej, dostaje 10 razy tyle.')}>
            <AmountInput className="input" value={pointValue} onChange={setPointValue} placeholder="0,10" required />
          </Field>
          <label className="flex items-center gap-2 self-center text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={lowerWins} onChange={(e) => setLowerWins(e.target.checked)} />
            {t('Wygrywa mniej punktów (np. golf, kierki)')}
          </label>
        </div>
      )}

      {kind === 'loser' && (
        <Field label={t('Który wydatek stawia przegrany')}>
          <select
            className="input"
            value={expenseId}
            onChange={(e) => chooseExpense(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">{t('wybierz wydatek')}</option>
            {state.expenses.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {formatMoney(e.amount, e.currency)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Kto gra')}</p>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
          {members.map((m) => {
            const row = rows[m.id]
            const cents = preview.results[m.id]
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <label className="order-1 flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <input type="checkbox" checked={row.playing} onChange={(e) => setRow(m.id, { playing: e.target.checked })} />
                  <span className="truncate">{name(m.id)}</span>
                </label>
                {/* On a phone the result sits next to the name and the inputs
                    take the line below; from sm up they share one row. */}
                {row.playing && (
                  <span className="order-2 shrink-0 text-right text-sm sm:order-3 sm:w-24">
                    {cents !== undefined && !preview.problem ? <GameResult cents={cents} currency={currency} /> : null}
                  </span>
                )}
                {row.playing && (
                  <div className="order-3 flex basis-full flex-wrap items-center gap-2 pl-6 sm:order-2 sm:basis-auto sm:pl-0">
                    {(kind === 'poker' || kind === 'bet') && (
                      <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {kind === 'poker' ? t('wrzucone') : t('stawia')}
                        <AmountInput
                          className="input w-20 text-right"
                          value={row.stake}
                          onChange={(v) => setRow(m.id, { stake: v })}
                          placeholder="0"
                          aria-label={t('Wrzucone: {0}', m.name)}
                        />
                      </label>
                    )}
                    {kind === 'poker' && Number(buyIn) > 0 && (
                      <button
                        type="button"
                        title={t('Dokupienie: +{0}', formatMoney(buyIn, currency))}
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => setRow(m.id, { stake: String(Math.round(((Number(row.stake) || 0) + Number(buyIn)) * 100) / 100) })}
                      >
                        +{buyIn}
                      </button>
                    )}
                    {kind === 'poker' && (
                      <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('żetony')}
                        <AmountInput
                          className="input w-20 text-right"
                          value={row.score}
                          onChange={(v) => setRow(m.id, { score: v })}
                          placeholder="0"
                          aria-label={t('Żetony na koniec: {0}', m.name)}
                        />
                      </label>
                    )}
                    {kind === 'points' && (
                      <label className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('punkty')}
                        <button
                          type="button"
                          title={t('Zmień znak')}
                          className="rounded-md border border-slate-300 dark:border-slate-600 px-1.5 py-1 text-xs text-slate-600 dark:text-slate-300"
                          onClick={() =>
                            setRow(m.id, { score: row.score.startsWith('-') ? row.score.slice(1) : `-${row.score}` })
                          }
                        >
                          ±
                        </button>
                        <AmountInput
                          className="input w-20 text-right"
                          value={row.score}
                          onChange={(v) => setRow(m.id, { score: v })}
                          placeholder="0"
                          aria-label={t('Punkty: {0}', m.name)}
                        />
                      </label>
                    )}
                    {kind === 'tournament' && (
                      <select
                        className="input w-28"
                        value={row.place}
                        onChange={(e) => setRow(m.id, { place: e.target.value })}
                        aria-label={t('Miejsce: {0}', m.name)}
                      >
                        <option value="">{t('miejsce')}</option>
                        {places.map((p) => (
                          <option key={p} value={p}>
                            {t('{0}. miejsce', String(p))}
                          </option>
                        ))}
                      </select>
                    )}
                    {kind === 'bet' && (
                      <select
                        className="input w-36"
                        value={row.pick}
                        onChange={(e) => setRow(m.id, { pick: e.target.value })}
                        aria-label={t('Typ: {0}', m.name)}
                      >
                        <option value="">{t('typuje…')}</option>
                        {cleanOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}
                    {kind === 'loser' && (
                      <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={row.lost} onChange={(e) => setRow(m.id, { lost: e.target.checked })} />
                        {t('przegrywa i stawia')}
                      </label>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-2 space-y-1 text-xs">
          {(kind === 'poker' || kind === 'tournament' || kind === 'bet') && pot > 0 && (
            <p className="text-slate-500 dark:text-slate-400">
              {t('W puli: {0}', formatMoney(pot, currency))}
              {kind === 'poker' && chips > 0 && ` · ${t('żetonów na stole: {0}', String(chips))}`}
            </p>
          )}
          {expectedChips !== null && chips > 0 && Math.abs(expectedChips - chips) > 0.001 && (
            <p className="text-amber-700 dark:text-amber-400">
              {t(
                'Z wpisowego wynika {0} żetonów, a na stole jest {1}. Pula i tak dzieli się według żetonów, więc wynik się zgadza.',
                String(Math.round(expectedChips * 100) / 100),
                String(chips),
              )}
            </p>
          )}
          {kind === 'bet' && !preview.problem && !(cleanOptions.includes(result) && result) && (
            <p className="text-slate-500 dark:text-slate-400">{t('Dopóki nie wpiszecie wyniku, zakład nic nie zmienia w rozliczeniu.')}</p>
          )}
          {preview.problem ? (
            <p className="text-amber-700 dark:text-amber-400">{t(preview.problem)}</p>
          ) : (
            <p className="text-emerald-700 dark:text-emerald-400">
              {t('Wygrane i przegrane się równoważą. Trafią do „Kto komu ile”.')}
            </p>
          )}
        </div>
      </div>

      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button type="submit" className={`${PRIMARY} flex-1 py-2.5 sm:flex-none sm:py-1.5`} disabled={save.isPending}>
          {save.isPending ? t('Zapisywanie…') : game ? t('Zapisz zmiany') : t('Dodaj do rozliczenia')}
        </button>
        <button type="button" className={`${SECONDARY} py-2.5 sm:py-1.5`} onClick={onCancel}>
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}
