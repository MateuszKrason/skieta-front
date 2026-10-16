import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { apiError, KIND_ICONS, KIND_LABELS, SPLIT_CURRENCIES, splitsApi, type SplitKind, type SplitState } from '../../lib/splits'
import { CARD, DANGER, ErrorText, Field, PRIMARY, SECONDARY } from './ui'

export default function GroupSettings({
  state,
  token,
  onState,
  onClose,
}: {
  state: SplitState
  token: string
  onState: (s: SplitState) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState(state.group.name)
  const [kind, setKind] = useState<SplitKind>(state.group.kind)
  const [description, setDescription] = useState(state.group.description)
  const [currency, setCurrency] = useState(state.group.currency)
  const [confirm, setConfirm] = useState<'rotate' | 'delete' | null>(null)
  const [error, setError] = useState('')
  const currencyLocked = state.expenses.length > 0 || state.settlements.length > 0

  const save = useMutation({
    mutationFn: () => splitsApi.update(token, { name, kind, description, currency }),
    onSuccess: (next) => {
      onState(next)
      onClose()
    },
    onError: (e) => setError(apiError(e, t('Nie udało się zapisać zmian.'))),
  })
  const rotate = useMutation({
    mutationFn: () => splitsApi.rotateLink(token),
    onSuccess: (next) => {
      setConfirm(null)
      onState(next)
    },
    onError: (e) => setError(apiError(e, t('Nie udało się zmienić linku.'))),
  })
  const remove = useMutation({
    mutationFn: () => splitsApi.remove(token),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['split', token] })
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      navigate('/budzet/wspolne', { replace: true })
    },
    onError: (e) => setError(apiError(e, t('Nie udało się usunąć wydarzenia.'))),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <form onSubmit={submit} className={`${CARD} space-y-4`}>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('Ustawienia wydarzenia')}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label={t('Nazwa')}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
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
        <div className="sm:col-span-2">
          <Field label={t('Opis (opcjonalnie)')}>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </Field>
        </div>
        <Field
          label={t('Waluta rozliczenia')}
          hint={currencyLocked ? t('Walutę rozliczenia można zmienić tylko przed dodaniem pierwszego wydatku.') : undefined}
        >
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={currencyLocked}>
            {SPLIT_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={PRIMARY} disabled={save.isPending}>
          {t('Zapisz zmiany')}
        </button>
        <button type="button" className={SECONDARY} onClick={onClose}>
          {t('Anuluj')}
        </button>
      </div>

      <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
        {confirm === 'rotate' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {t('Stary link przestanie działać od razu. Nowy trzeba będzie wysłać znajomym jeszcze raz.')}
            </span>
            <button type="button" className={PRIMARY} onClick={() => rotate.mutate()} disabled={rotate.isPending}>
              {t('Zmień link')}
            </button>
            <button type="button" className={SECONDARY} onClick={() => setConfirm(null)}>
              {t('Nie')}
            </button>
          </div>
        ) : (
          <button type="button" className={SECONDARY} onClick={() => setConfirm('rotate')}>
            {t('Wygeneruj nowy link')}
          </button>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t('Przydaje się, gdy link trafił do kogoś, kto nie powinien go mieć.')}
        </p>
        {confirm === 'delete' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-red-700 dark:text-red-400">
              {t('Usunąć całe wydarzenie razem z wydatkami i zwrotami? Zniknie u wszystkich i nie da się tego cofnąć.')}
            </span>
            <button type="button" className={DANGER} onClick={() => remove.mutate()} disabled={remove.isPending}>
              {t('Tak, usuń wydarzenie')}
            </button>
            <button type="button" className={SECONDARY} onClick={() => setConfirm(null)}>
              {t('Nie')}
            </button>
          </div>
        ) : (
          <button type="button" className={DANGER} onClick={() => setConfirm('delete')}>
            {t('Usuń wydarzenie')}
          </button>
        )}
      </div>
    </form>
  )
}
