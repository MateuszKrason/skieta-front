import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../api/client'
import { LANGUAGES, LANGUAGE_LABELS, useLanguage, type Language } from '../../i18n/LanguageContext'
import { formatDateTime } from '../../lib/format'
import type { InviteBatch } from '../../types'

function defaultExpiry() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 16)
}

export default function AdminGroupInvites() {
  const { language: siteLanguage, t } = useLanguage()
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [capacity, setCapacity] = useState('10')
  const [expiresAt, setExpiresAt] = useState(defaultExpiry())
  const [batchLanguage, setBatchLanguage] = useState<Language>(siteLanguage)
  const [qrId, setQrId] = useState<number | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invite-batches'],
    queryFn: async () => (await api.get<{ results: InviteBatch[] }>('/auth/admin/invite-batches/')).data.results,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-invite-batches'] })
  }

  const create = useMutation({
    mutationFn: () =>
      api.post('/auth/admin/invite-batches/', {
        label,
        capacity: Number(capacity),
        expires_at: new Date(expiresAt).toISOString(),
        language: batchLanguage,
      }),
    onSuccess: () => {
      invalidate()
      setLabel('')
      setCapacity('10')
      setExpiresAt(defaultExpiry())
      setBatchLanguage(siteLanguage)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/invite-batches/${id}/`),
    onSuccess: invalidate,
  })

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('Nowe zaproszenie grupowe')}
        </h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t('Jeden link/kod QR, z którego może skorzystać wybrana liczba osób do wskazanej daty.')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Notatka (opcjonalnie)')}</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('np. Meetup marcowy')}
              className="input w-52"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Liczba miejsc')}</span>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="input w-28"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Ważne do')}</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="input w-56"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Język zaproszenia')}</span>
            <select
              value={batchLanguage}
              onChange={(e) => setBatchLanguage(e.target.value as Language)}
              className="input w-36"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || Number(capacity) < 1 || !expiresAt}
            className="btn-primary"
          >
            {t('Utwórz')}
          </button>
        </div>
        {create.isError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {t('Nie udało się utworzyć zaproszenia — sprawdź dane.')}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak zaproszeń grupowych.')}</p>
        ) : (
          <ul className="space-y-2">
            {(data ?? []).map((batch) => (
              <li key={batch.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {batch.label || t('(bez nazwy)')}
                    </span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        batch.is_expired
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          : batch.remaining === 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {batch.is_expired
                        ? t('Wygasło')
                        : batch.remaining === 0
                          ? t('Wyczerpane')
                          : t('Aktywne')}
                    </span>
                    <span className="ml-2 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {LANGUAGE_LABELS[batch.language] ?? batch.language}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => copyLink(batch.id, batch.invite_url)}
                      className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {copiedId === batch.id ? t('Skopiowano!') : t('Kopiuj link')}
                    </button>
                    <button
                      onClick={() => setQrId((prev) => (prev === batch.id ? null : batch.id))}
                      className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {qrId === batch.id ? t('Ukryj QR') : t('Pokaż QR')}
                    </button>
                    <button
                      onClick={() => setOpenId((prev) => (prev === batch.id ? null : batch.id))}
                      className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {openId === batch.id ? t('Ukryj listę') : t('Kto skorzystał')}
                    </button>
                    {batch.used_count === 0 && (
                      <button
                        onClick={() => remove.mutate(batch.id)}
                        disabled={remove.isPending}
                        className="rounded-md border border-red-300 dark:border-red-700 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      >
                        {t('Usuń')}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {t('Utworzył {0}, {1}', batch.created_by, formatDateTime(batch.created_at))}
                  {' · '}
                  {t('Wykorzystano {0} z {1} ({2} wolnych)', String(batch.used_count), String(batch.capacity), String(batch.remaining))}
                  {' · '}
                  {t('Ważne do {0}', formatDateTime(batch.expires_at))}
                </p>

                {qrId === batch.id && (
                  <div className="mt-2 flex justify-center rounded-md bg-white p-3">
                    <QRCodeSVG value={batch.invite_url} size={160} />
                  </div>
                )}

                {openId === batch.id && (
                  <div className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 p-2">
                    {batch.redemptions.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t('Nikt jeszcze się nie zarejestrował.')}</p>
                    ) : (
                      <ul className="space-y-1">
                        {batch.redemptions.map((r, i) => (
                          <li key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-medium">{r.username}</span>
                            <span className="text-slate-400 dark:text-slate-500">{formatDateTime(r.created_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
