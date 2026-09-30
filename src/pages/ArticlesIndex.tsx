import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import ArticleCard from '../components/ArticleCard'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import type { Article } from '../types'

// Every article, in the editor's order. The landing page shows only the first
// few, so this is what the rest are linked from inside the site - and what the
// RSS channel's <link> and each article's "all articles" link point at. Title
// and description for crawlers come from netlify/edge-functions/page-meta.ts.
export default function ArticlesIndex() {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => (await api.get<Article[]>('/content/articles/')).data,
  })
  // Same guard as the landing page: the SPA fallback answering /api/* with
  // index.html is a 200 full of HTML, and .map on a string takes the page down.
  const articles = Array.isArray(data) ? data : []

  // The tab title comes from App's PAGE_TITLES, like every other route's.
  const heading = t('Artykuły o finansach osobistych')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link to="/register" className="rounded-full bg-accent-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-800">
            {t('Załóż konto')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{heading}</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          {t('Oszczędzanie i inwestowanie w polskich realiach: podatek Belki, obligacje skarbowe, lokaty, ETF-y, IKE i IKZE, budżet domowy.')}
        </p>

        {isLoading ? (
          <p className="mt-10 text-slate-500 dark:text-slate-400">{t('Ładowanie…')}</p>
        ) : articles.length === 0 ? (
          <p className="mt-10 text-slate-500 dark:text-slate-400">{t('Wkrótce pojawią się tu pierwsze artykuły.')}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <p className="mt-12">
          <Link to="/" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('← Strona główna')}
          </Link>
        </p>
      </main>
    </div>
  )
}
