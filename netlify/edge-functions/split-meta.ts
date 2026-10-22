// A shared-expenses link (/wspolne/<token>) is the one thing people paste into
// a group chat on purpose, and as of 22.10.2026 it was the only source that had
// brought in an account at all. Until now it previewed as the homepage - "a
// budget app, Belka tax" - which tells the friends in that chat nothing about
// why the link is there. Worse, robots.txt kept every crawler out of
// /wspolne/, and Messenger builds its preview with Facebook's crawler, which
// obeys that file, so there it showed no preview at all.
//
// This gives every such link the same preview: what the page is for and what
// to do there. Deliberately without the group's name or anything else from
// the group - its contents are for signed-in members only, and a preview is
// fetched by the chat app's servers, not by a member. So nothing is fetched
// here either.
//
// The links are not meant for search results: they carry noindex both as a
// header and in the page, and lose the homepage's canonical.

const SITE = 'https://skieta.com'

// Same reason as IMAGE_HOST in article-meta.ts: Facebook rejects new image
// URLs on skieta.com, while the Netlify hostname serves the same deploy.
const IMAGE = 'https://skieta.netlify.app/og-wspolne.jpg'

const TITLE = 'Wspólne rozliczenie - skieta'
const SHARE_TITLE = 'Wspólne wydatki: kto komu ile oddaje?'
const DESCRIPTION =
  'Dopisz swoje wydatki, a skieta policzy, kto komu ile oddaje, najmniejszą liczbą przelewów. Za darmo i bez reklam.'

// Replacement strings are passed as functions: a literal "$&" would otherwise be read as a backreference.
function replaceOnce(html: string, pattern: RegExp, replacement: string): string {
  return html.replace(pattern, () => replacement)
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const response = await context.next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

  const url = `${SITE}${new URL(request.url).pathname}`

  let html = await response.text()
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${DESCRIPTION}" />`)
  html = replaceOnce(html, /<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex, follow" />')
  html = replaceOnce(html, /\s*<link rel="canonical" href="[^"]*"\s*\/?>/, '')
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${SHARE_TITLE}" />`)
  html = replaceOnce(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${DESCRIPTION}" />`,
  )
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
  html = replaceOnce(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${IMAGE}" />`)
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${SHARE_TITLE}" />`)
  html = replaceOnce(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${DESCRIPTION}" />`,
  )
  html = replaceOnce(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${IMAGE}" />`)

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: '/wspolne/*' }
