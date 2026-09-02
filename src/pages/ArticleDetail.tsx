import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageLoader } from '../components/Loader'
import RequestAccessForm from '../components/RequestAccessForm'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { formatDateTime } from '../lib/format'
import { useNoindex } from '../lib/useNoindex'
import type { Article } from '../types'

// The Article.body is plain text split into paragraphs on blank lines (no
// HTML/markdown parsing on the backend). Two lightweight conventions are
// honored here so a long-form piece isn't one undifferentiated wall of text:
// a block starting with "## " becomes a subheading, and "**...**" spans
// become bold. Everything stays plain text through React's own escaping, so
// nothing an editor types can inject markup.
// Bold spans and links are split in one pass so both can appear in the same
// paragraph (they can't nest). The link pattern only matches an href starting
// with a single "/": an article can link to another article, but nothing
// written in a body can turn into an off-site link. The negative lookahead is
// what makes that true - "//evil.com" also starts with a slash and a browser
// resolves it as a protocol-relative link to another host.
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g
const INTERNAL_LINK = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE_TOKEN).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
              {part.slice(2, -2)}
            </strong>
          )
        }
        const link = INTERNAL_LINK.exec(part)
        if (link) {
          return (
            <Link
              key={i}
              to={link[2]}
              className="font-medium text-accent-700 underline decoration-accent-300 underline-offset-2 hover:decoration-accent-600 dark:text-accent-400 dark:decoration-accent-700"
            >
              {link[1]}
            </Link>
          )
        }
        return part
      })}
    </>
  )
}

function ArticleBody({ body }: { body: string }) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {body.split(/\n\s*\n/).map((block, i) =>
        block.startsWith('## ') ? (
          <h2 key={i} className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
            {block.slice(3).trim()}
          </h2>
        ) : (
          <p key={i} className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <InlineText text={block} />
          </p>
        ),
      )}
    </div>
  )
}

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
            <ArticleBody body={article.body} />

            {/* Most readers here arrived from a search engine and have no
                account - and registration is invite-only, so a bare "log in"
                button was a dead end for exactly the audience these articles
                are written to attract. Offer the access-request path first
                and keep logging in as the secondary route. */}
            <aside className="mt-12 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('Policz to na swoich danych')}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t(
                  'skieta pokazuje każdy zysk brutto i po podatku, a kalkulator porównuje lokaty, obligacje i giełdę na Twojej kwocie. Dostęp jest na zaproszenie - zostaw e-mail, a odezwiemy się.',
                )}
              </p>
              <div className="mt-4">
                <RequestAccessForm variant="prominent" source="article" article={slug} />
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t('Masz już konto?')}{' '}
                <Link
                  to="/logowanie"
                  onClick={() => trackEvent('article_login_clicked', { article: slug })}
                  className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
                >
                  {t('Zaloguj się →')}
                </Link>
              </p>
            </aside>
          </>
        )}
      </article>
    </div>
  )
}
