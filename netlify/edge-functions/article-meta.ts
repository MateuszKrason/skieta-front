// Article pages are served by the SPA fallback in _redirects, so every one of
// them returned index.html verbatim: the same <title>, the same Open Graph
// tags, and - worst of all - a canonical link pointing at the homepage, which
// tells search engines each article is a duplicate of "/" and should not be
// indexed on its own. React sets the title and description client-side, but a
// social crawler never runs JavaScript, so every shared article previewed as
// the homepage.
//
// This rewrites the <head> at the edge, before the HTML reaches the browser or
// the crawler. Any failure - a missing slug, an unpublished article, a slow or
// unreachable API - returns the untouched response, so the page still renders.

const API_BASE = 'https://api.skieta.com/api/content/articles'
const SITE = 'https://skieta.com'
const FETCH_TIMEOUT_MS = 2000

// TEMPORARY - diagnostic, not the intended value. og-diagnostyka.png is a
// byte-identical copy of og-image.png, which Facebook processes without
// complaint, under a filename it has never seen. Every generated card was
// rejected as "Corrupted Image" while that original was accepted, and the two
// were indistinguishable in format, headers, compression, ranged responses,
// robots.txt and CDN bytes - so this separates the two remaining explanations:
// whether Facebook objects to the files being generated, or to any image URL
// that is new on this site. Revert to a real card URL once that is known.

interface Article {
  title: string
  summary: string
  author_name: string | null
  published_at: string
  updated_at: string
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Replacement strings are passed as functions throughout: a literal "$&" or
// "$1" inside an article title would otherwise be read as a backreference.
function replaceOnce(html: string, pattern: RegExp, replacement: string): string {
  return html.replace(pattern, () => replacement)
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const response = await context.next()

  if (!(response.headers.get('content-type') ?? '').includes('text/html')) {
    return response
  }

  const segments = new URL(request.url).pathname.split('/').filter(Boolean)
  const slug = segments[0] === 'artykuly' ? segments[1] : undefined
  if (!slug) return response

  let article: Article
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return response
    article = await res.json()
  } catch {
    return response
  }

  const url = `${SITE}/artykuly/${slug}`
  const title = escapeAttribute(`${article.title} - skieta`)
  const description = escapeAttribute(article.summary)
  // Per-article preview card carrying the headline (see
  // scripts/generate_og_images.py). A slug with no generated file falls back
  // to the site image through the /og/* rule in _redirects, so this is always
  // a valid URL even for an article published after the last generation run.
  const image = `${SITE}/og-diagnostyka.png`

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    url,
    image,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: { '@type': 'Person', name: article.author_name ?? 'skieta' },
    publisher: { '@type': 'Organization', name: 'skieta', url: SITE },
  })

  let html = await response.text()
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceOnce(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  )
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
  )
  html = replaceOnce(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${title}" />`,
  )
  html = replaceOnce(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${description}" />`,
  )
  html = replaceOnce(
    html,
    /<meta property="og:type" content="[^"]*"\s*\/?>/,
    '<meta property="og:type" content="article" />',
  )
  html = replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`,
  )
  html = replaceOnce(
    html,
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${image}" />`,
  )
  html = replaceOnce(
    html,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${image}" />`,
  )
  html = replaceOnce(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${title}" />`,
  )
  html = replaceOnce(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${description}" />`,
  )
  html = replaceOnce(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${jsonLd}</script>`,
  )

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: '/artykuly/*' }
