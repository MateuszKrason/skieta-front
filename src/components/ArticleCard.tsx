import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDate } from '../lib/format'
import type { Article } from '../types'

/** One article teaser, shared by the landing page (the first few) and the
 * article index (all of them), so both read the same. The date is shown
 * without the time: a publication hour down to the second made a set of
 * articles published together look machine-generated. */
export default function ArticleCard({ article }: { article: Article }) {
  const { t } = useLanguage()
  const date = formatDate(article.published_at)
  return (
    <Link
      to={`/artykuly/${article.slug}`}
      className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-md"
    >
      <time dateTime={article.published_at} className="text-xs text-slate-500 dark:text-slate-400">
        {article.author_name ? t('Autor: {0} • {1}', article.author_name, date) : date}
      </time>
      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{article.title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{article.summary}</p>
      <span className="mt-3 inline-block text-sm font-medium text-accent-700 dark:text-accent-400">
        {t('Czytaj więcej →')}
      </span>
    </Link>
  )
}
