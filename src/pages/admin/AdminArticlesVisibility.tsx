import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { LANGUAGE_LABELS, useLanguage, type Language } from '../../i18n/LanguageContext'

interface VisibilityRow {
  language: Language
  enabled: boolean
}

export default function AdminArticlesVisibility() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles-visibility'],
    queryFn: async () => (await api.get<VisibilityRow[]>('/content/admin/articles-visibility/')).data,
  })

  const toggle = useMutation({
    mutationFn: (row: VisibilityRow) => api.patch('/content/admin/articles-visibility/', row),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-articles-visibility'] }),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Widoczność artykułów')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t(
            'Artykuły są dziś pisane wyłącznie po polsku - wyłącz sekcję artykułów na stronie głównej dla języków, w których nie ma jeszcze tłumaczeń.',
          )}
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>}

      <div className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {(data ?? []).map((row) => (
          <label
            key={row.language}
            className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300"
          >
            <span className="font-medium">{LANGUAGE_LABELS[row.language] ?? row.language}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {row.enabled ? t('widoczne') : t('ukryte')}
              </span>
              <input
                type="checkbox"
                checked={row.enabled}
                disabled={toggle.isPending}
                onChange={(e) => toggle.mutate({ language: row.language, enabled: e.target.checked })}
                className="h-4 w-4"
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
