import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../api/client'
import { LANGUAGES, LANGUAGE_LABELS, useLanguage, type Language } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'
import type { InviteBatch, LandingPromotion } from '../../types'

function defaultCountdown() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 16)
}

interface PromotionFormState {
  batchId: string
  titlePl: string
  titleEn: string
  titleDe: string
  titleEs: string
  messagePl: string
  messageEn: string
  messageDe: string
  messageEs: string
  countdownEndsAt: string
}

function emptyForm(): PromotionFormState {
  return {
    batchId: '',
    titlePl: '',
    titleEn: '',
    titleDe: '',
    titleEs: '',
    messagePl: '',
    messageEn: '',
    messageDe: '',
    messageEs: '',
    countdownEndsAt: defaultCountdown(),
  }
}

function formFromPromotion(p: LandingPromotion): PromotionFormState {
  return {
    batchId: String(p.batch.id),
    titlePl: p.title_pl,
    titleEn: p.title_en,
    titleDe: p.title_de,
    titleEs: p.title_es,
    messagePl: p.message_pl,
    messageEn: p.message_en,
    messageDe: p.message_de,
    messageEs: p.message_es,
    // datetime-local input wants "YYYY-MM-DDTHH:mm", the API gives back a
    // full ISO timestamp with seconds/offset.
    countdownEndsAt: p.countdown_ends_at.slice(0, 16),
  }
}

function formToPayload(f: PromotionFormState) {
  return {
    batch_id: Number(f.batchId),
    title_pl: f.titlePl,
    title_en: f.titleEn,
    title_de: f.titleDe,
    title_es: f.titleEs,
    message_pl: f.messagePl,
    message_en: f.messageEn,
    message_de: f.messageDe,
    message_es: f.messageEs,
    countdown_ends_at: new Date(f.countdownEndsAt).toISOString(),
  }
}

const FIELD_KEYS: Record<Language, { title: keyof PromotionFormState; message: keyof PromotionFormState }> = {
  pl: { title: 'titlePl', message: 'messagePl' },
  en: { title: 'titleEn', message: 'messageEn' },
  de: { title: 'titleDe', message: 'messageDe' },
  es: { title: 'titleEs', message: 'messageEs' },
}

// Same idea, but keyed to LandingPromotion's own (snake_case, API) field
// names — used when reading an already-fetched promotion, as opposed to
// PromotionFormState's camelCase form fields above.
const PROMOTION_TITLE_KEYS: Record<Language, keyof LandingPromotion> = {
  pl: 'title_pl',
  en: 'title_en',
  de: 'title_de',
  es: 'title_es',
}

// Shared by the create form and the inline edit form — one title/message
// pair per supported language. Polish is the required source text (mirrors
// the rest of the app's i18n convention); the others fall back to it on the
// public landing page when left blank, so they're optional here.
function LanguageFields({
  form,
  onChange,
  onAutoTranslate,
  isTranslating,
  translateError,
}: {
  form: PromotionFormState
  onChange: (patch: Partial<PromotionFormState>) => void
  onAutoTranslate?: () => void
  isTranslating?: boolean
  translateError?: string | null
}) {
  const { t } = useLanguage()
  return (
    <div>
      {onAutoTranslate && (
        <div className="mb-3">
          <button
            type="button"
            onClick={onAutoTranslate}
            disabled={!form.titlePl || isTranslating}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {isTranslating ? t('Tłumaczenie…') : t('✨ Przetłumacz automatycznie')}
          </button>
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
            {t('Wypełni EN/DE/ES na podstawie polskiego tekstu - możesz je potem dowolnie poprawić ręcznie.')}
          </span>
          {translateError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{translateError}</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map((lang) => {
          const keys = FIELD_KEYS[lang]
          return (
            <div key={lang} className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {LANGUAGE_LABELS[lang]}
                {lang === 'pl' && <span className="text-red-500"> *</span>}
              </p>
              <label className="mb-2 block text-xs text-slate-500 dark:text-slate-400">
                {t('Tytuł')}
                <input
                  type="text"
                  value={form[keys.title]}
                  onChange={(e) => onChange({ [keys.title]: e.target.value })}
                  placeholder={lang !== 'pl' ? t('Opcjonalnie - domyślnie użyty zostanie polski tekst') : undefined}
                  className="input mt-1 w-full"
                />
              </label>
              <label className="block text-xs text-slate-500 dark:text-slate-400">
                {t('Wiadomość')}
                <input
                  type="text"
                  value={form[keys.message]}
                  onChange={(e) => onChange({ [keys.message]: e.target.value })}
                  placeholder={lang !== 'pl' ? t('Opcjonalnie - domyślnie użyty zostanie polski tekst') : undefined}
                  className="input mt-1 w-full"
                />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TranslationResult {
  en: { title: string; message: string }
  de: { title: string; message: string }
  es: { title: string; message: string }
}

// Shared by the create and edit forms - calls the backend's machine
// translation endpoint (free Google Translate web endpoint, no API key —
// best-effort, see accounts/translate.py) and fills in whichever EN/DE/ES
// fields it got a non-empty result for, leaving anything already typed (or
// any failed language) untouched.
function useAutoTranslate(setForm: (updater: (f: PromotionFormState) => PromotionFormState) => void) {
  return useMutation({
    mutationFn: async (form: PromotionFormState) =>
      (
        await api.post<TranslationResult>('/auth/admin/landing-promotions/auto-translate/', {
          title: form.titlePl,
          message: form.messagePl,
        })
      ).data,
    onSuccess: (data) => {
      setForm((f) => ({
        ...f,
        titleEn: data.en.title || f.titleEn,
        messageEn: data.en.message || f.messageEn,
        titleDe: data.de.title || f.titleDe,
        messageDe: data.de.message || f.messageDe,
        titleEs: data.es.title || f.titleEs,
        messageEs: data.es.message || f.messageEs,
      }))
    },
  })
}

export default function AdminLandingPromotions() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [createForm, setCreateForm] = useState<PromotionFormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PromotionFormState>(emptyForm)
  const [qrId, setQrId] = useState<number | null>(null)

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin-landing-promotions'],
    queryFn: async () =>
      (await api.get<{ results: LandingPromotion[] }>('/auth/admin/landing-promotions/')).data.results,
  })

  // Reused so the admin can point a new promotion at any existing group
  // invite (see AdminGroupInvites.tsx) instead of creating a parallel invite
  // mechanism just for the banner.
  const { data: batches } = useQuery({
    queryKey: ['admin-invite-batches'],
    queryFn: async () => (await api.get<{ results: InviteBatch[] }>('/auth/admin/invite-batches/')).data.results,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-landing-promotions'] })
  }

  const create = useMutation({
    mutationFn: () => api.post('/auth/admin/landing-promotions/', formToPayload(createForm)),
    onSuccess: () => {
      invalidate()
      setCreateForm(emptyForm())
    },
  })

  const update = useMutation({
    mutationFn: (id: number) => api.patch(`/auth/admin/landing-promotions/${id}/`, formToPayload(editForm)),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/auth/admin/landing-promotions/${id}/`, { is_active: isActive }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/landing-promotions/${id}/`),
    onSuccess: invalidate,
  })

  const createTranslate = useAutoTranslate(setCreateForm)
  const editTranslate = useAutoTranslate(setEditForm)

  function translateErrorMessage(mutation: { isError: boolean }) {
    return mutation.isError
      ? t('Usługa tłumaczenia jest chwilowo niedostępna - spróbuj ponownie później albo uzupełnij ręcznie.')
      : null
  }

  function startEdit(promo: LandingPromotion) {
    setQrId(null)
    setEditingId(promo.id)
    setEditForm(formFromPromotion(promo))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Nowy baner na stronie głównej')}
        </h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t(
            'Wskaż istniejące zaproszenie grupowe — baner pokaże jego link/kod QR i odliczanie do podanej daty. Liczba wykorzystań to liczba osób zarejestrowanych przez to zaproszenie.',
          )}
        </p>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Zaproszenie grupowe')}</span>
            <select
              value={createForm.batchId}
              onChange={(e) => setCreateForm((f) => ({ ...f, batchId: e.target.value }))}
              className="input w-56"
            >
              <option value="">{t('Wybierz…')}</option>
              {(batches ?? []).map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.label || batch.token.slice(0, 8)} ({LANGUAGE_LABELS[batch.language] ?? batch.language})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Koniec odliczania')}</span>
            <input
              type="datetime-local"
              value={createForm.countdownEndsAt}
              onChange={(e) => setCreateForm((f) => ({ ...f, countdownEndsAt: e.target.value }))}
              className="input w-56"
            />
          </label>
        </div>
        <LanguageFields
          form={createForm}
          onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
          onAutoTranslate={() => createTranslate.mutate(createForm)}
          isTranslating={createTranslate.isPending}
          translateError={translateErrorMessage(createTranslate)}
        />
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !createForm.batchId || !createForm.titlePl || !createForm.countdownEndsAt}
          className="btn-primary mt-3"
        >
          {t('Utwórz')}
        </button>
        {create.isError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {t('Nie udało się utworzyć promocji — sprawdź dane.')}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
        ) : (promotions ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak promocji.')}</p>
        ) : (
          <ul className="space-y-2">
            {(promotions ?? []).map((promo) => {
              const expired = new Date(promo.countdown_ends_at).getTime() <= Date.now()
              if (editingId === promo.id) {
                return (
                  <li key={promo.id} className="rounded-md border border-accent-300 dark:border-accent-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm">
                    <div className="mb-3 flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('Zaproszenie grupowe')}</span>
                        <select
                          value={editForm.batchId}
                          onChange={(e) => setEditForm((f) => ({ ...f, batchId: e.target.value }))}
                          className="input w-56"
                        >
                          {(batches ?? []).map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.label || batch.token.slice(0, 8)} ({LANGUAGE_LABELS[batch.language] ?? batch.language})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('Koniec odliczania')}</span>
                        <input
                          type="datetime-local"
                          value={editForm.countdownEndsAt}
                          onChange={(e) => setEditForm((f) => ({ ...f, countdownEndsAt: e.target.value }))}
                          className="input w-56"
                        />
                      </label>
                    </div>
                    <LanguageFields
                      form={editForm}
                      onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                      onAutoTranslate={() => editTranslate.mutate(editForm)}
                      isTranslating={editTranslate.isPending}
                      translateError={translateErrorMessage(editTranslate)}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => update.mutate(promo.id)}
                        disabled={update.isPending || !editForm.batchId || !editForm.titlePl || !editForm.countdownEndsAt}
                        className="btn-primary"
                      >
                        {t('Zapisz zmiany')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {t('Anuluj')}
                      </button>
                    </div>
                    {update.isError && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {t('Nie udało się zapisać zmian.')}
                      </p>
                    )}
                  </li>
                )
              }
              return (
                <li key={promo.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{promo.title_pl}</span>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          !promo.is_active
                            ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : expired
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {!promo.is_active ? t('Wyłączona') : expired ? t('Wygasła') : t('Aktywna')}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setQrId((prev) => (prev === promo.id ? null : promo.id))}
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {qrId === promo.id ? t('Ukryj QR') : t('Pokaż QR')}
                      </button>
                      <button
                        onClick={() => startEdit(promo)}
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {t('Edytuj')}
                      </button>
                      <button
                        onClick={() => toggleActive.mutate({ id: promo.id, isActive: !promo.is_active })}
                        disabled={toggleActive.isPending}
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        {promo.is_active ? t('Wyłącz') : t('Włącz')}
                      </button>
                      <button
                        onClick={() => remove.mutate(promo.id)}
                        disabled={remove.isPending}
                        className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      >
                        {t('Usuń')}
                      </button>
                    </div>
                  </div>

                  {promo.message_pl && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{promo.message_pl}</p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-1 text-xs text-slate-400 dark:text-slate-500">
                    {LANGUAGES.filter((lang) => lang !== 'pl' && promo[PROMOTION_TITLE_KEYS[lang]]).map(
                      (lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          {LANGUAGE_LABELS[lang]}
                        </span>
                      ),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {t('Zaproszenie {0}', promo.batch.label || promo.batch.token.slice(0, 8))}
                    {' · '}
                    {t('Wykorzystano {0} z {1}', String(promo.batch.used_count), String(promo.batch.capacity))}
                    {' · '}
                    {t('Odliczanie do {0}', formatDateTime(promo.countdown_ends_at))}
                  </p>

                  {qrId === promo.id && (
                    <div className="mt-2 flex justify-center rounded-md bg-white p-3">
                      <QRCodeSVG value={promo.batch.invite_url} size={160} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
