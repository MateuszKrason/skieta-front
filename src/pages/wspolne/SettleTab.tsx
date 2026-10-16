import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AmountInput } from '../../components/AmountInput'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatMoney } from '../../lib/format'
import { apiError, memberName, splitsApi, summaryText, todayIso, type SplitState, type SplitTransfer } from '../../lib/splits'
import { CARD, DANGER, ErrorText, Field, Money, NetLabel, PRIMARY, SECONDARY } from './ui'

function TransferRow({
  transfer,
  state,
  token,
  meId,
  onState,
}: {
  transfer: SplitTransfer
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const [error, setError] = useState('')
  const currency = state.group.currency
  const from = memberName(state.members, transfer.from_member, null, t)
  const to = memberName(state.members, transfer.to_member, null, t)
  const settle = useMutation({
    mutationFn: () =>
      splitsApi.addSettlement(token, {
        from_member: transfer.from_member,
        to_member: transfer.to_member,
        amount: transfer.amount,
        acting_member: meId,
      }),
    onSuccess: onState,
    onError: (e) => setError(apiError(e, t('Nie udało się zapisać zwrotu.'))),
  })
  const involvesMe = meId !== null && (transfer.from_member === meId || transfer.to_member === meId)

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${
        involvesMe
          ? 'border-accent-300 dark:border-accent-700 bg-accent-50/60 dark:bg-accent-900/20'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <p className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">
        {transfer.from_member === meId ? (
          <>
            <strong>{t('Ty')}</strong> → <strong>{to}</strong>
          </>
        ) : transfer.to_member === meId ? (
          <>
            <strong>{from}</strong> → <strong>{t('Ty')}</strong>
          </>
        ) : (
          <>
            <strong>{from}</strong> → <strong>{to}</strong>
          </>
        )}
      </p>
      <span className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {formatMoney(transfer.amount, currency)}
      </span>
      <button type="button" className={SECONDARY} onClick={() => settle.mutate()} disabled={settle.isPending}>
        {settle.isPending ? t('Zapisywanie…') : t('✓ Oddane')}
      </button>
      {error && (
        <div className="w-full">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </li>
  )
}

function ManualSettlement({
  state,
  token,
  meId,
  onState,
  onClose,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const members = state.members
  const [from, setFrom] = useState<number>(meId ?? members[0]?.id)
  const [to, setTo] = useState<number>(members.find((m) => m.id !== (meId ?? members[0]?.id))?.id ?? members[0]?.id)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const save = useMutation({
    mutationFn: () =>
      splitsApi.addSettlement(token, { from_member: from, to_member: to, amount, date, note, acting_member: meId }),
    onSuccess: (next) => {
      onState(next)
      onClose()
    },
    onError: (e) => setError(apiError(e, t('Nie udało się zapisać zwrotu.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t('Kto oddaje')}>
          <select className="input" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberName(members, m.id, meId, t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Komu')}>
          <select className="input" value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberName(members, m.id, meId, t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Kwota ({0})', state.group.currency)}>
          <AmountInput className="input" value={amount} onChange={setAmount} required placeholder="0,00" />
        </Field>
        <Field label={t('Data')}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
      </div>
      <Field label={t('Notatka (opcjonalnie)')}>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder={t('np. BLIK, gotówka')}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button type="submit" className={PRIMARY} disabled={save.isPending}>
          {t('Zapisz zwrot')}
        </button>
        <button type="button" className={SECONDARY} onClick={onClose}>
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function SettlementHistory({
  state,
  token,
  meId,
  onState,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState<number | null>(null)
  const [error, setError] = useState('')
  const remove = useMutation({
    mutationFn: (id: number) => splitsApi.removeSettlement(token, id),
    onSuccess: (next) => {
      setConfirming(null)
      onState(next)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się usunąć zwrotu.'))),
  })
  const settlements = [...state.settlements].sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1))

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
      {settlements.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
          <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-300">
            {memberName(state.members, s.from_member, meId, t)} → {memberName(state.members, s.to_member, meId, t)}
            <span className="ml-2 text-xs text-slate-400">
              {formatDate(s.date)}
              {s.note && ` · ${s.note}`}
            </span>
          </span>
          <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {formatMoney(s.amount, s.currency)}
          </span>
          {confirming === s.id ? (
            <span className="flex gap-1">
              <button type="button" className={DANGER} onClick={() => remove.mutate(s.id)} disabled={remove.isPending}>
                {t('Usuń')}
              </button>
              <button type="button" className={SECONDARY} onClick={() => setConfirming(null)}>
                {t('Nie')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-red-600"
              onClick={() => setConfirming(s.id)}
              title={t('Cofnij ten zwrot')}
            >
              {t('cofnij')}
            </button>
          )}
        </li>
      ))}
      {error && (
        <li className="py-2">
          <ErrorText>{error}</ErrorText>
        </li>
      )}
    </ul>
  )
}

export default function SettleTab({
  state,
  token,
  meId,
  onState,
}: {
  state: SplitState
  token: string
  meId: number | null
  onState: (s: SplitState) => void
}) {
  const { t } = useLanguage()
  const [manual, setManual] = useState(false)
  const [copied, setCopied] = useState(false)
  const currency = state.group.currency
  const myBalance = meId !== null ? state.balances.find((b) => b.member === meId) : undefined

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText(state, t))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      {myBalance && state.expenses.length > 0 && (
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('Twój bilans')}</p>
            <p className="mt-1 text-xl">
              <NetLabel net={myBalance.net} currency={currency} me />
            </p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Wyłożone: {0} · Twoja część: {1}', formatMoney(myBalance.paid, currency), formatMoney(myBalance.share, currency))}
          </p>
        </div>
      )}

      <div className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Kto komu ile')}</h2>
          {state.expenses.length > 0 && (
            <button type="button" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline" onClick={copySummary}>
              {copied ? t('Skopiowane ✓') : t('Kopiuj podsumowanie na czat')}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('Najmniej przelewów, jakie wystarczą, żeby wszyscy wyszli na zero. Kliknij „Oddane”, gdy pieniądze dotrą.')}
        </p>
        {state.expenses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('Najpierw dodajcie wydatki.')}</p>
        ) : state.transfers.length === 0 ? (
          <p className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            🎉 {t('Wszyscy są rozliczeni.')}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {state.transfers.map((tr) => (
              <TransferRow
                key={`${tr.from_member}-${tr.to_member}`}
                transfer={tr}
                state={state}
                token={token}
                meId={meId}
                onState={onState}
              />
            ))}
          </ul>
        )}
        <div className="mt-4">
          {manual ? (
            <ManualSettlement state={state} token={token} meId={meId} onState={onState} onClose={() => setManual(false)} />
          ) : (
            state.members.length > 1 && (
              <button
                type="button"
                className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
                onClick={() => setManual(true)}
              >
                {t('+ Zapisz inny zwrot (np. część kwoty)')}
              </button>
            )
          )}
        </div>
      </div>

      <div className={CARD}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Bilans osób')}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="py-1 pr-3 font-medium">{t('Osoba')}</th>
                <th className="py-1 pr-3 text-right font-medium">{t('Wyłożone')}</th>
                <th className="py-1 pr-3 text-right font-medium">{t('Część')}</th>
                <th className="py-1 pr-3 text-right font-medium">{t('Zwroty')}</th>
                <th className="py-1 text-right font-medium">{t('Saldo')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {state.balances.map((b) => {
                return (
                  <tr key={b.member} className={b.member === meId ? 'font-medium' : ''}>
                    <td className="py-2 pr-3 text-slate-800 dark:text-slate-200">{memberName(state.members, b.member, meId, t)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoney(b.paid, currency)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoney(b.share, currency)}
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-700 dark:text-slate-300">
                      {Number(b.sent) === 0 && Number(b.received) === 0 ? (
                        '—'
                      ) : (
                        <span className="flex flex-col items-end text-xs tabular-nums">
                          {Number(b.sent) > 0 && <span>{t('oddane {0}', formatMoney(b.sent, currency))}</span>}
                          {Number(b.received) > 0 && <span>{t('otrzymane {0}', formatMoney(b.received, currency))}</span>}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Money value={b.net} currency={currency} tone="signed" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {t('Saldo na plus: tyle ta osoba ma dostać. Na minus: tyle ma oddać. Wydatki w innych walutach są przeliczone na {0}.', currency)}
        </p>
      </div>

      {state.settlements.length > 0 && (
        <div className={CARD}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Oddane pieniądze')}</h2>
          <SettlementHistory state={state} token={token} meId={meId} onState={onState} />
        </div>
      )}
    </div>
  )
}
