import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate, formatMoney, groupAccountsByBank } from '../lib/format'
import type { BankAccount, BudgetType, Category, StatementPreview, StatementPreviewRow } from '../types'

interface RowOverride {
  include: boolean
  category_id: number | null
  type: BudgetType
}

export default function StatementImportPanel({
  accounts,
  onDone,
  onCancel,
}: {
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState<number | ''>(accounts[0]?.id ?? '')
  const [preview, setPreview] = useState<StatementPreview | null>(null)
  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({})
  const [error, setError] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['budget-categories', 'for-import', accountId],
    queryFn: async () =>
      (await api.get<Category[]>('/budget/categories/', { params: { account: accountId || undefined } })).data,
    enabled: Boolean(preview),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('no file')
      const formData = new FormData()
      formData.append('file', file)
      if (accountId) formData.append('account', String(accountId))
      return (await api.post<StatementPreview>('/budget/statements/preview/', formData)).data
    },
    onSuccess: (data) => {
      setPreview(data)
      setError(null)
      const initial: Record<string, RowOverride> = {}
      for (const row of data.rows) {
        initial[row.import_hash] = {
          include: row.default_selected,
          category_id: row.category_id,
          type: row.type,
        }
      }
      setOverrides(initial)
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { detail?: string } } }).response?.data
      setError(data?.detail ?? t('Nie udało się przetworzyć pliku.'))
    },
  })

  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error('no preview')
      const rows = Object.entries(overrides).map(([import_hash, o]) => ({ import_hash, ...o }))
      return (
        await api.post<{ imported: number; skipped: number }>('/budget/statements/commit/', {
          preview_id: preview.preview_id,
          rows,
        })
      ).data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] })
      alert(t('Zaimportowano {0} transakcji, pominięto {1}.', String(result.imported), String(result.skipped)))
      onDone()
    },
    onError: () => setError(t('Nie udało się zaimportować transakcji — spróbuj wgrać plik ponownie.')),
  })

  const includedCount = Object.values(overrides).filter((o) => o.include).length

  function updateRow(hash: string, patch: Partial<RowOverride>) {
    setOverrides((prev) => ({ ...prev, [hash]: { ...prev[hash], ...patch } }))
  }

  function selectAll(value: boolean) {
    setOverrides((prev) => {
      const next = { ...prev }
      for (const row of preview?.rows ?? []) {
        if (row.is_duplicate) continue
        next[row.import_hash] = { ...next[row.import_hash], include: value }
      }
      return next
    })
  }

  const categoriesByType = useMemo(() => {
    const grouped: Record<BudgetType, Category[]> = { income: [], expense: [] }
    for (const c of categories ?? []) grouped[c.type].push(c)
    return grouped
  }, [categories])

  if (!preview) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Importuj wyciąg z konta')}</h3>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {t(
            'Wgraj wyciąg w formacie PDF (obecnie obsługiwane: PKO Bank Polski). Zanim cokolwiek zapiszemy, pokażemy podgląd transakcji do zatwierdzenia — i sprawdzimy, czy już ich kiedyś nie zaimportowano.',
          )}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Plik PDF')}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="input mt-1"
            />
          </label>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Konto (opcjonalnie)')}
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
              className="input mt-1"
            >
              <option value="">{t('bez powiązania')}</option>
              {groupAccountsByBank(accounts).map(([bankName, group]) => (
                <optgroup key={bankName} label={bankName}>
                  {group.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="btn-primary"
          >
            {uploadMutation.isPending ? t('Wczytywanie…') : t('Wgraj i pokaż podgląd')}
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Anuluj')}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('Podgląd wyciągu')} ({formatDate(preview.period_from)} – {formatDate(preview.period_to)})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Zaznaczono {0} z {1} transakcji do importu.', String(includedCount), String(preview.rows.length))}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => selectAll(true)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Zaznacz wszystkie')}
          </button>
          <button
            onClick={() => selectAll(false)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Odznacz wszystkie')}
          </button>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-2 py-2"></th>
              <th className="px-2 py-2">{t('Data')}</th>
              <th className="px-2 py-2">{t('Opis')}</th>
              <th className="px-2 py-2 text-right">{t('Kwota')}</th>
              <th className="px-2 py-2">{t('Kategoria')}</th>
              <th className="px-2 py-2">{t('Uwagi')}</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row: StatementPreviewRow) => {
              const override = overrides[row.import_hash]
              const disabled = row.is_duplicate
              return (
                <tr
                  key={row.import_hash}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    disabled ? 'opacity-40' : ''
                  }`}
                >
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={override?.include ?? false}
                      disabled={disabled}
                      onChange={(e) => updateRow(row.import_hash, { include: e.target.checked })}
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-2 py-1.5">
                    <p className="text-slate-700 dark:text-slate-300">{row.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{row.raw_type}</p>
                  </td>
                  <td
                    className={`whitespace-nowrap px-2 py-1.5 text-right font-medium ${
                      row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {row.type === 'income' ? '+' : '-'}
                    {formatMoney(row.amount, row.currency)}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={override?.category_id ?? ''}
                      disabled={disabled}
                      onChange={(e) =>
                        updateRow(row.import_hash, { category_id: e.target.value ? Number(e.target.value) : null })
                      }
                      className="input py-1 text-xs"
                    >
                      <option value="">{t('bez kategorii')}</option>
                      {categoriesByType[row.type].map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {row.is_duplicate && (
                        <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {t('już zaimportowano')}
                        </span>
                      )}
                      {row.is_possible_duplicate && !row.is_duplicate && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          {t('możliwy duplikat')}
                        </span>
                      )}
                      {row.needs_review && !row.is_duplicate && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          {t('sprawdź — może to transfer własny')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => commitMutation.mutate()}
          disabled={includedCount === 0 || commitMutation.isPending}
          className="btn-primary"
        >
          {commitMutation.isPending
            ? t('Zapisywanie…')
            : t('Zatwierdź import ({0})', String(includedCount))}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </div>
  )
}
