import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageLoader } from '../components/Loader'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate } from '../lib/format'
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

  useEffect(() => {
    if (!article) return
    const previousTitle = document.title
    document.title = `${article.title} – Skieta`
    setMetaDescription(article.summary)
    return () => {
      document.title = previousTitle
    }
  }, [article])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/witaj" className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
            <SockLogo className="h-7 w-7" />
            Skieta
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('Zaloguj się do aplikacji')}
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/witaj" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
          {t('← Wszystkie artykuły')}
        </Link>

        {isLoading && <PageLoader />}

        {!isLoading && !article && (
          <p className="mt-6 text-slate-400 dark:text-slate-500">{t('Nie znaleziono artykułu.')}</p>
        )}

        {article && (
          <>
            <time dateTime={article.published_at} className="mt-6 block text-xs text-slate-400 dark:text-slate-500">
              {formatDate(article.published_at)}
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
              to="/register"
              className="mt-10 inline-block rounded-md bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700"
            >
              {t('Zacznij zarządzać swoimi finansami →')}
            </Link>
          </>
        )}
      </article>
    </div>
  )
}
