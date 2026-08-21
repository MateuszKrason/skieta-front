import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../lib/format'
import type { Article } from '../types'

type FormState = {
  title: string
  summary: string
  body: string
  is_published: boolean
  order: number
}

const EMPTY_FORM: FormState = { title: '', summary: '', body: '', is_published: true, order: 0 }

export default function Redakcja() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const { data: articles, isLoading } = useQuery({
    queryKey: ['crm-articles'],
    queryFn: async () => (await api.get<Article[]>('/content/articles/')).data,
  })

  const createMutation = useMutation({
    mutationFn: (payload: FormState) => api.post('/content/articles/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-articles'] })
      setCreating(false)
      setForm(EMPTY_FORM)
      setError(null)
    },
    onError: () => setError(t('Nie udało się zapisać artykułu.')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: FormState }) =>
      api.patch(`/content/articles/${slug}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-articles'] })
      setEditingSlug(null)
      setError(null)
    },
    onError: () => setError(t('Nie udało się zapisać artykułu.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/content/articles/${slug}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-articles'] }),
  })

  function startEdit(article: Article) {
    setCreating(false)
    setEditingSlug(article.slug)
    setForm({
      title: article.title,
      summary: article.summary,
      body: article.body,
      is_published: article.is_published,
      order: article.order,
    })
  }

  function startCreate() {
    setEditingSlug(null)
    setCreating(true)
    setForm(EMPTY_FORM)
  }

  function cancel() {
    setCreating(false)
    setEditingSlug(null)
    setError(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (editingSlug) {
      updateMutation.mutate({ slug: editingSlug, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const showForm = creating || editingSlug !== null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Redakcja artykułów')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('Dodawaj i edytuj artykuły widoczne na stronie głównej.')}
          </p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn-primary">
            {t('+ Nowy artykuł')}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {editingSlug ? t('Edytuj artykuł') : t('Nowy artykuł')}
          </h2>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Tytuł')}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Krótki opis')}
            <input
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              required
              maxLength={300}
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('Treść')}
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              rows={10}
              className="input mt-1"
            />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              />
              {t('Opublikowany')}
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('Kolejność')}
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                className="input w-20"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('Zapisz')}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('Anuluj')}
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>}

      <ul className="space-y-2">
        {(articles ?? []).map((article) => (
          <li
            key={article.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{article.title}</span>
                  {!article.is_published && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('szkic')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {article.author_name
                    ? t('Autor: {0} • {1}', article.author_name, formatDateTime(article.published_at))
                    : formatDateTime(article.published_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => startEdit(article)}
                  className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                >
                  {t('Edytuj')}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t('Czy na pewno chcesz usunąć ten artykuł?'))) {
                      deleteMutation.mutate(article.slug)
                    }
                  }}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('Usuń')}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
