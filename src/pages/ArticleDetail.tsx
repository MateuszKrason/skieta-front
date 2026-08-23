import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageLoader } from '../components/Loader'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../lib/format'
import { useNoindex } from '../lib/useNoindex'
import type { Article } from '../types'

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function ArticleDetail() {
  const { t } = useLanguage()
  const { slug } = useParams<{ slug: string }>()

  const { data: article, isLoading } = useQuery({
    queryKey: ['content-article', slug],
    queryFn: async () => (await api.get<Article>(`/content/articles/${slug}/`)).data,
    enabled: Boolean(slug),
  })

  useNoindex(!isLoading && !article)

  useEffect(() => {
    if (!article) return
    const previousTitle = document.title
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
    document.title = `${article.title} - skieta`
    setMetaDescription(article.summary)
    return () => {
      document.title = previousTitle
      setMetaDescription(previousDescription)
    }
  }, [article])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link
            to="/logowanie"
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
          >
            {t('Zaloguj się do aplikacji')}
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
          {t('← Wszystkie artykuły')}
        </Link>

        {/* A real <h1> in every branch, not just the loaded-article one - a
            crawler that snapshots before the fetch resolves (or never runs
            JS at all) used to see a heading-less page while loading or on a
            bad slug. */}
        {isLoading && (
          <>
            <h1 className="sr-only">{t('Ładowanie artykułu…')}</h1>
            <PageLoader />
          </>
        )}

        {!isLoading && !article && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Nie znaleziono artykułu.')}</h1>
            <p className="mt-2 text-slate-400 dark:text-slate-500">
              {t('Może został usunięty albo link jest nieprawidłowy.')}
            </p>
          </>
        )}

        {article && (
          <>
            <time dateTime={article.published_at} className="mt-6 block text-xs text-slate-400 dark:text-slate-500">
              {article.author_name
                ? t('Autor: {0} • {1}', article.author_name, formatDateTime(article.published_at))
                : formatDateTime(article.published_at)}
            </time>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{article.title}</h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{article.summary}</p>
            <div className="mt-6 space-y-4">
              {article.body.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                  {paragraph}
                </p>
              ))}
            </div>
            <Link
              to="/logowanie"
              className="mt-10 inline-block rounded-md bg-accent-600 px-6 py-3 text-base font-semibold text-white hover:bg-accent-700"
            >
              {t('Zacznij zarządzać swoimi finansami →')}
            </Link>
          </>
        )}
      </article>
    </div>
  )
}
