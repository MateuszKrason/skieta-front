// The public pages other than articles (those are article-meta.ts) are served by
// the same SPA fallback, so each of them arrived with the homepage's <head> -
// including a canonical link pointing at "/", which tells Google that
// /kalkulator, /regulamin and /polityka-prywatnosci are copies of the homepage.
// The body was an empty <div id="root">, so a crawler that reads the HTML before
// running the app (or never runs it) found no text at all.
//
// This gives each page its own title, description and canonical at the edge,
// and puts the text of the two pages with real content inside #root as plain
// HTML. React replaces it when it mounts, exactly as with the articles. Nothing
// here fetches anything, so the pages cost no extra time to serve.

const SITE = 'https://skieta.com'

interface Page {
  title: string
  description: string
  /** Plain-HTML version of the page's own text, for crawlers; omitted where the head is all that was wrong. */
  body?: string
}

const WRAPPER_STYLE = 'max-width:48rem;margin:0 auto;padding:3rem 1rem;font-family:system-ui,sans-serif;line-height:1.6'

const PAGES: Record<string, Page> = {
  '/': {
    title: 'Darmowa aplikacja do budżetu domowego - skieta',
    description:
      'Darmowa aplikacja do budżetu domowego, bez reklam. Wydatki dodasz zdjęciem paragonu, a obok budżetu policzysz też akcje, obligacje i lokaty.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Zobacz, gdzie znika Twoja wypłata</h1>' +
      '<p>skieta - Twoja wirtualna skarpeta z oszczędnościami. Bezpłatnie, bez reklam, bez karty.</p>' +
      '<p>Zapisuj wydatki zdjęciem paragonu i zobacz, gdzie naprawdę idą Twoje pieniądze. A jeśli inwestujesz - skieta doliczy do tego akcje, lokaty i obligacje i pokaże realny zysk, a nie samo saldo.</p>' +
      '<p><a href="/register">Załóż darmowe konto</a> · <a href="/kalkulator">Kalkulator: lokata, obligacje czy giełda</a></p>' +
      '<h2>Przychody, wydatki i budżet</h2>' +
      '<p>Budżet miesiąc po miesiącu, kategorie, sklepy i tagi, a w osobnej zakładce koszty samochodu: paliwo, ubezpieczenie, przeglądy i naprawy.</p>' +
      '<h2>Cele oszczędnościowe</h2>' +
      '<p>Ustaw cel, rezerwuj kwoty z konkretnych wypłat lub z bieżących oszczędności i śledź postęp na żywo.</p>' +
      '<h2>Wszystko w jednym miejscu</h2>' +
      '<p>Konta bankowe, akcje, obligacje i lokaty - jeden widok na cały majątek, bez podawania danych logowania do banku.</p>' +
      '<h2>Realny zwrot, dywidendy i podatki</h2>' +
      '<p>Zysk liczony osobno od wpłaconego kapitału, po podatku Belki, historia i prognoza dywidend oraz podsumowanie komunikatów o Twoich spółkach.</p>' +
      '</main>',
  },
  '/kalkulator': {
    title: 'Kalkulator inwestycyjny - lokata, obligacje czy giełda - skieta',
    description:
      'Porównaj lokatę, obligacje skarbowe i giełdę na własnej kwocie - wynik po podatku Belki i po inflacji. Za darmo i bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator inwestycyjny: lokata, obligacje czy giełda</h1>' +
      '<p>Podaj kwotę, wpłatę co miesiąc i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów po podatku Belki i po inflacji.</p>' +
      '<p>Stawki obligacji skarbowych (m.in. OTS, ROR, DOR, TOS, COI, EDO, ROS, ROD) są pobierane na bieżąco, obligacje indeksowane inflacją liczone są z marżą od drugiego roku, a pozostałe oprocentowania możesz dowolnie zmienić.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna.</p>' +
      '<p><a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/regulamin': {
    title: 'Regulamin - skieta',
    description: 'Zasady korzystania z aplikacji skieta: rejestracja, konto demonstracyjne, odpowiedzialność i usuwanie konta.',
  },
  '/polityka-prywatnosci': {
    title: 'Polityka prywatności - skieta',
    description: 'Jakie dane zbiera skieta, w jakim celu, jak długo je przechowuje i jak możesz je pobrać lub usunąć.',
  },
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Replacement strings are passed as functions: a literal "$&" in a title would otherwise be read as a backreference.
function replaceOnce(html: string, pattern: RegExp, replacement: string): string {
  return html.replace(pattern, () => replacement)
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const response = await context.next()
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/'
  const page = PAGES[path]
  if (!page) return response

  const url = path === '/' ? `${SITE}/` : `${SITE}${path}`
  const title = escapeAttribute(page.title)
  const description = escapeAttribute(page.description)

  let html = await response.text()
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`)
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
  if (path !== '/') {
    html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
    html = replaceOnce(
      html,
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${description}" />`,
    )
    html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`)
    html = replaceOnce(
      html,
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
  }
  if (page.body) {
    html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${page.body}</div>`)
  }

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: ['/', '/kalkulator', '/regulamin', '/polityka-prywatnosci'] }
