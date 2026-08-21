import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../lib/format'
import type { Article } from '../types'

export default function Landing() {
  const { t } = useLanguage()

  const { data: articles } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => (await api.get<Article[]>('/content/articles/')).data,
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/witaj" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            Skieta
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
          >
            {t('Zaloguj się do aplikacji')}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          {t('Panuj nad swoimi finansami')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          {t(
            'Skieta łączy konta bankowe, inwestycje, lokaty i obligacje w jednym miejscu — zobacz, jak naprawdę rośnie Twój majątek.',
          )}
        </p>
        <Link
          to="/login"
          className="mt-8 inline-block rounded-md bg-accent-600 px-6 py-3 text-base font-semibold text-white hover:bg-accent-700"
        >
          {t('Zaloguj się')}
        </Link>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {t('Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika.')}
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('Artykuły o finansach osobistych')}
        </h2>
        {!articles?.length ? (
          <p className="text-slate-400 dark:text-slate-500">{t('Wkrótce pojawią się tu pierwsze artykuły.')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to={`/artykuly/${a.slug}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-md"
              >
                <time dateTime={a.published_at} className="text-xs text-slate-400 dark:text-slate-500">
                  {a.author_name
                    ? t('Autor: {0} • {1}', a.author_name, formatDateTime(a.published_at))
                    : formatDateTime(a.published_at)}
                </time>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a.summary}</p>
                <span className="mt-3 inline-block text-sm font-medium text-accent-700 dark:text-accent-400">
                  {t('Czytaj więcej →')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
