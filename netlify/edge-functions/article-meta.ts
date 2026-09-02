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

// Cards are served from the Netlify hostname, not from skieta.com, and that is
// deliberate. Facebook rejects every image URL it has not already cached from
// skieta.com as "Corrupted Image" - proven by pointing og:image at a
// byte-identical copy of og-image.png under a new filename, which was rejected
// while the original, cached long ago, kept working. The file was therefore
// never the problem: format, encoder settings, path shape and URL versioning
// all changed nothing, and the two URLs were identical in headers, bytes,
// compression, ranged responses and robots.txt.
//
// What remains is the domain. skieta.com is young and, per the note in
// public/_redirects, still carries a poor reputation with security vendors -
// which is also why the API is proxied through this origin. The Netlify
// hostname serves the same files from the same deploy and does not.
//
// Worth revisiting once skieta.com's reputation settles: an og:image on the
// site's own domain is tidier, and this is a workaround, not a fix.
const IMAGE_HOST = 'https://skieta.netlify.app'

interface Article {
  title: string
  slug: string
  summary: string
  body: string
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

// Mirrors the two conventions ArticleDetail.tsx renders, so the markup a
// crawler reads has the same headings and links as the page a person sees.
// Every value is escaped first, so nothing an editor types can inject markup.
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g
const INTERNAL_LINK = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/

function renderInline(text: string): string {
  return text
    .split(INLINE_TOKEN)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return `<strong>${escapeAttribute(part.slice(2, -2))}</strong>`
      }
      const link = INTERNAL_LINK.exec(part)
      if (link) {
        return `<a href="${escapeAttribute(link[2])}">${escapeAttribute(link[1])}</a>`
      }
      return escapeAttribute(part)
    })
    .join('')
}

/** The article as plain semantic HTML, placed inside #root so a crawler that
 * never runs JavaScript still reads the full text. React clears the container
 * when it mounts, so this is replaced rather than duplicated - and because the
 * same API response is also handed to the app as initial data, the swap
 * happens with no loading spinner and no visible change. */
function renderArticle(article: Article): string {
  const blocks = article.body
    .split(/\n\s*\n/)
    .map((block) =>
      block.startsWith('## ')
        ? `<h2>${escapeAttribute(block.slice(3).trim())}</h2>`
        : `<p>${renderInline(block)}</p>`,
    )
    .join('')

  const byline = article.author_name ? `${escapeAttribute(article.author_name)} · ` : ''

  return (
    `<article style="max-width:48rem;margin:0 auto;padding:3rem 1rem;font-family:system-ui,sans-serif;line-height:1.6">` +
    `<time datetime="${escapeAttribute(article.published_at)}">${byline}${escapeAttribute(article.published_at.slice(0, 10))}</time>` +
    `<h1>${escapeAttribute(article.title)}</h1>` +
    `<p>${escapeAttribute(article.summary)}</p>` +
    blocks +
    `</article>`
  )
}

/** Hands the already-fetched article to the app so React Query renders from it
 * immediately instead of showing a loader and refetching. Without this the
 * prerendered text would flash to a spinner the moment React mounts, which is
 * worse than the loader alone.
 *
 * A JSON data block, not an executable script: the site's CSP has no
 * 'unsafe-inline' in script-src (which is why gtag's config lives in its own
 * file - see index.html), so an inline script here is blocked and silently
 * does nothing. type="application/json" is never executed, so script-src does
 * not apply to it. "<" is escaped so no article text can close the tag early. */
const INITIAL_DATA_ID = 'skieta-article'

function renderInitialData(article: Article): string {
  const json = JSON.stringify(article).replace(/</g, '\\u003c')
  return `<script id="${INITIAL_DATA_ID}" type="application/json">${json}</script>`
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
  const image = `${IMAGE_HOST}/og-${slug}.jpg`

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

  // The article text itself, which until now existed only after the app had
  // booted and called the API - so the HTML a crawler first reads was an empty
  // shell. Google renders JavaScript eventually, but that pass is queued and
  // other crawlers (Bing, and the ones behind llms.txt) never run it at all.
  html = replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${renderArticle(article)}</div>${renderInitialData(article)}`,
  )

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: '/artykuly/*' }
