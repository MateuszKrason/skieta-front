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
  /** Link-preview card, when the page has its own; otherwise the site's. */
  image?: string
  /** Plain-HTML version of the page's own text, for crawlers; omitted where the head is all that was wrong. */
  body?: string
}

// Same reason as IMAGE_HOST in article-meta.ts: Facebook rejects new image
// URLs on skieta.com, while the Netlify hostname serves the same deploy.
const IMAGE_HOST = 'https://skieta.netlify.app'

const WRAPPER_STYLE = 'max-width:48rem;margin:0 auto;padding:3rem 1rem;font-family:system-ui,sans-serif;line-height:1.6'

const PAGES: Record<string, Page> = {
  '/': {
    title: 'Darmowa aplikacja do budżetu domowego - skieta',
    description:
      'Darmowa aplikacja do budżetu domowego, bez reklam i bez podpinania banku. Budżet, cele i inwestycje w jednym miejscu, z zyskiem po podatku Belki.',
    // Mirrors what Landing.tsx renders, section by section, so a crawler that
    // reads the HTML before running the app sees the same page a person does.
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Zobacz, gdzie znika Twoja wypłata</h1>' +
      '<p>skieta - Twoja wirtualna skarpeta z oszczędnościami. Bezpłatnie, bez reklam, bez karty.</p>' +
      '<p>Budżet, cele oszczędnościowe i inwestycje w jednym miejscu. Z zyskiem liczonym po podatku Belki, a nie samym saldem.</p>' +
      '<p><a href="/register">Załóż darmowe konto</a> · <a href="/kalkulator">Kalkulator: lokata, obligacje czy giełda</a></p>' +
      '<h2>Widać, na co naprawdę idą pieniądze</h2>' +
      '<p>Wydatki z podziałem na kategorie, sklepy i tagi, miesiąc po miesiącu. Paragon dodasz zdjęciem.</p>' +
      '<h2>Wspólne wydatki ze znajomymi</h2>' +
      '<p>Wyjazd, wspólne mieszkanie albo prezent na składkę: każdy dopisuje swoje wydatki z telefonu, a skieta liczy, kto komu ile oddaje, najmniejszą liczbą przelewów. Także w euro. <a href="/rozliczenia">Jak działają wspólne rozliczenia</a></p>' +
      '<h2>Zysk, a nie tylko saldo</h2>' +
      '<p>Wpłacony kapitał osobno, zysk osobno, brutto i po podatku Belki. Przy akcjach z zagranicy widać też, ile zrobił sam kurs waluty.</p>' +
      '<h2>Cele, które same się pilnują</h2>' +
      '<p>Rezerwujesz kwotę z konkretnej wypłaty, a skieta liczy, ile odkładać z każdej, żeby zdążyć.</p>' +
      '<h2>Bez haczyków</h2>' +
      '<p>Bez podpinania banku. Bez reklam i bez sprzedawania Twoich danych. Sam budżet też wystarczy: jeśli nie inwestujesz, część giełdowa znika z menu. Dane pobierasz i konto usuwasz sam, z ustawień.</p>' +
      '<p><a href="/artykuly">Artykuły o finansach osobistych</a></p>' +
      '</main>',
  },
  '/artykuly': {
    title: 'Artykuły o finansach osobistych - skieta',
    description:
      'Oszczędzanie i inwestowanie w polskich realiach: podatek Belki, obligacje skarbowe, lokaty, ETF-y, IKE i IKZE, budżet domowy.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Artykuły o finansach osobistych</h1>' +
      '<p>Oszczędzanie i inwestowanie w polskich realiach: podatek Belki, obligacje skarbowe, lokaty, ETF-y, IKE i IKZE, budżet domowy.</p>' +
      '<p><a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator': {
    // No brand on the end: with it the title runs to 63 characters and a
    // search result cuts it (see TITLE_LIMIT in src/lib/seo.ts).
    title: 'Kalkulator inwestycyjny - lokata, obligacje czy giełda',
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
  '/kalkulator/procent-skladany': {
    title: 'Kalkulator procentu składanego po podatku Belki - skieta',
    description:
      'Policz, ile urosną Twoje oszczędności: kwota na start, wpłata co miesiąc, oprocentowanie i lata. Wynik od razu po podatku Belki, bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator procentu składanego</h1>' +
      '<p>Wpisz, ile masz, ile dokładasz co miesiąc i na ile procent. Zobaczysz, ile z końcowej kwoty to Twoje wpłaty, a ile dopisały odsetki, już po podatku Belki.</p>' +
      '<p>Procent składany to odsetki od odsetek: po pierwszym okresie zarabia nie tylko Twoja wpłata, ale też to, co do niej dopisano.</p>' +
      '<p>Kalkulator rozróżnia lokatę i konto oszczędnościowe (podatek od każdych dopisanych odsetek), fundusz albo ETF akumulujący (podatek raz, przy wypłacie) oraz IKE (bez podatku).</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator/podatek-belki': {
    title: 'Kalkulator podatku Belki - ile zostaje z odsetek i zysku',
    description:
      'Sprawdź, ile podatku Belki zapłacisz od lokaty albo od zysku ze sprzedaży akcji i ile zostanie na rękę. 19% policzone z zaokrągleniami, bez konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator podatku Belki</h1>' +
      '<p>Podatek Belki to 19% od zysków z oszczędności i inwestycji. Sprawdź, ile zabierze z odsetek od lokaty albo z zysku ze sprzedaży akcji i ile naprawdę zostanie Ci na rękę.</p>' +
      '<p>Od lokat, kont oszczędnościowych i obligacji podatek pobiera bank albo emitent. Sprzedaż akcji, ETF-ów i jednostek funduszy rozliczasz sam w PIT-38.</p>' +
      '<p>Oprocentowanie po podatku to oprocentowanie nominalne razy 0,81. Żeby lokata dotrzymała kroku inflacji, musi płacić więcej niż inflacja podzielona przez 0,81.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator/cel-oszczednosciowy': {
    title: 'Ile odkładać miesięcznie na cel - kalkulator oszczędzania',
    description:
      'Wpisz cel, termin i to, co już masz. Kalkulator pokaże, ile odkładać co miesiąc i ile dołożą odsetki po podatku Belki. Bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Ile odkładać miesięcznie, żeby uzbierać na cel</h1>' +
      '<p>Wkład własny, wesele, samochód albo poduszka bezpieczeństwa. Wpisz kwotę i termin, a zobaczysz, ile trzeba odkładać co miesiąc i ile z tego dołożą odsetki.</p>' +
      '<p>Wpłata trafia na konto na początku każdego miesiąca, a odsetki są dopisywane co miesiąc. Od odsetek z konta oszczędnościowego i lokaty odchodzi 19% podatku Belki.</p>' +
      '<p>Jeśli miesięczna kwota jest za wysoka, masz trzy ruchy: wydłużyć termin, obniżyć cel albo zacząć z większą kwotą na start.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator/lokata': {
    title: 'Kalkulator lokaty - ile zostaje po podatku Belki - skieta',
    description:
      'Ile naprawdę zarobisz na lokacie: odsetki po podatku Belki, kwota na koniec i oprocentowanie w skali roku po podatku. Za darmo, bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator lokaty po podatku Belki</h1>' +
      '<p>Bank podaje oprocentowanie przed podatkiem i w skali roku. Wpisz kwotę, oprocentowanie i czas, a zobaczysz, ile złotych naprawdę wpłynie na konto i ile to jest rocznie po podatku.</p>' +
      '<p>Od każdej wypłaty odsetek bank pobiera 19% podatku Belki. Przy 5% w skali roku roczna lokata na 10 000 zł daje 500 zł odsetek, z czego na konto wpływa 405 zł.</p>' +
      '<p>Oprocentowanie po podatku w skali roku pozwala porównać lokaty o różnej długości, na przykład promocję na trzy miesiące ze zwykłą ofertą na rok.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator/inflacja': {
    title: 'Kalkulator inflacji - ile będą warte Twoje pieniądze',
    description:
      'Sprawdź, ile siły nabywczej stracą pieniądze przy danej inflacji i ile musi płacić lokata, żeby po podatku Belki wyjść na zero. Bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator inflacji: ile będą warte Twoje pieniądze</h1>' +
      '<p>Pieniądze, które leżą bez odsetek, co roku kupują trochę mniej. Wpisz kwotę, inflację i liczbę lat, a zobaczysz, ile zostanie z ich siły nabywczej.</p>' +
      '<p>Przy inflacji 4% rocznie za 10 000 zł kupisz za dziesięć lat tyle, ile dziś za około 6 756 zł.</p>' +
      '<p>Żeby lokata dotrzymała kroku inflacji, musi płacić więcej niż sama inflacja, bo od odsetek odchodzi 19% podatku. Potrzebne oprocentowanie to inflacja podzielona przez 0,81.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/kalkulator/ikze': {
    title: 'Kalkulator IKZE - zwrot podatku i wynik po latach - skieta',
    description:
      'Ile podatku wróci po wpłacie na IKZE i jak IKZE wypada po latach na tle zwykłego rachunku, z podatkiem 10% przy wypłacie. Bez zakładania konta.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kalkulator IKZE: zwrot podatku i wynik po latach</h1>' +
      '<p>Wpłatę na IKZE odliczasz od dochodu, więc część pieniędzy wraca już przy najbliższym rozliczeniu PIT. Wpłata 6 000 zł to 720 zł zwrotu w pierwszym progu, 1 140 zł na podatku liniowym i 1 920 zł w drugim progu.</p>' +
      '<p>Przy wypłacie po 65. roku życia od całej wypłacanej kwoty odchodzi 10% podatku. Kalkulator porównuje wynik z tymi samymi wpłatami na zwykłym rachunku, gdzie płacisz 19% od zysku.</p>' +
      '<p>Roczny limit wpłat jest ogłaszany co roku. Niewykorzystany limit przepada z końcem roku.</p>' +
      '<p>Kalkulator działa bez zakładania konta. To symulacja, nie porada inwestycyjna ani podatkowa.</p>' +
      '<p><a href="/kalkulator">Kalkulator inwestycyjny: lokata, obligacje czy giełda</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/pit-38': {
    title: 'Kalkulator PIT-38: FIFO i kursy NBP z Twoich transakcji',
    description:
      'PIT-38 z zagranicznego brokera: przychód i koszty metodą FIFO, kursy NBP z dnia przed transakcją, dywidendy i krypto. Za darmo, z demo bez rejestracji.',
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>PIT-38 z zagranicznego brokera, policzony z Twoich transakcji</h1>' +
      '<p>Zagraniczny broker nie przyśle PIT-8C. Kolejność FIFO, kursy NBP z dnia przed każdą transakcją i prowizje trzeba policzyć samemu. skieta robi to za darmo i pokazuje każdy krok wyliczenia.</p>' +
      '<p>Akcje i ETF-y liczone są metodą FIFO osobno dla każdego rachunku maklerskiego, a kwoty w walutach po średnim kursie NBP z ostatniego dnia roboczego przed transakcją. Osobno dywidendy z zagranicy (19% minus podatek pobrany u źródła) i kryptowaluty.</p>' +
      '<p>Pomocnik nie wypełnia formularza i nie zastępuje PIT-8C ani doradcy podatkowego. Można go zobaczyć na koncie demo bez rejestracji.</p>' +
      '<p><a href="/kalkulator/podatek-belki">Kalkulator podatku Belki</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
      '</main>',
  },
  '/rozliczenia': {
    title: 'Rozliczenie wydatków ze znajomymi za darmo - skieta',
    description:
      'Kto komu ile? Rozlicz wyjazd, mieszkanie albo składkę: każdy dopisuje wydatki, a skieta liczy przelewy. Waluty po kursie NBP. Za darmo, bez reklam.',
    image: `${IMAGE_HOST}/og-wspolne.jpg`,
    body:
      `<main style="${WRAPPER_STYLE}">` +
      '<h1>Kto komu ile? Rozlicz wyjazd ze znajomymi za darmo</h1>' +
      '<p>Wspólne wydatki z wyjazdu, mieszkania albo składki na prezent w jednym miejscu. Każdy dopisuje swoje z telefonu, a skieta liczy, kto komu oddaje, najmniejszą liczbą przelewów. Bez reklam i bez dziennego limitu wpisów.</p>' +
      '<p><a href="/register">Załóż darmowe rozliczenie</a></p>' +
      '<h2>Jak to działa</h2>' +
      '<ol><li>Zakładasz rozliczenie: wyjazd, wspólne mieszkanie, wyjście albo inną okazję, i wpisujesz imiona.</li>' +
      '<li>Wysyłasz link na grupę, na Messengerze albo WhatsAppie. Znajomi logują się, wybierają swoje imię z listy i dołączają.</li>' +
      '<li>Każdy dopisuje swoje wydatki: kto płacił, ile i za kogo.</li>' +
      '<li>skieta pokazuje, kto komu ile oddaje, najmniejszą liczbą przelewów.</li></ol>' +
      '<h2>Co potrafi</h2>' +
      '<p>Podział po równo, procentowo albo kwotowo. Wydatki w 14 walutach, przeliczane po średnim kursie NBP z dnia wydatku. Podsumowanie do skopiowania na czat. Swoją część przeniesiesz do własnego budżetu. Do 10 osób i 1000 wydatków w jednym rozliczeniu.</p>' +
      '<h2>Czym to się różni od Splitwise?</h2>' +
      '<p>To ten sam pomysł: wspólna lista wydatków i wyliczenie, kto komu ile oddaje. skieta jest po polsku, przelicza waluty po kursie NBP, nie ma reklam, abonamentu ani dziennego limitu wpisów, a swoją część wydatków przeniesiesz do budżetu domowego w tej samej aplikacji.</p>' +
      '<p><a href="/artykuly/jak-rozliczyc-wyjazd-ze-znajomymi">Jak rozliczyć wyjazd ze znajomymi: kto komu ile</a> · <a href="/artykuly/alternatywa-dla-splitwise-bez-limitu">Alternatywa dla Splitwise: rozliczenia bez dziennego limitu</a> · <a href="/">skieta - darmowa aplikacja do budżetu domowego</a></p>' +
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

// The calculators, linked from the plain HTML of the home page and of every
// tool page. In the app the same list renders as "Inne kalkulatory", but only
// once JavaScript runs; Search Console (22.10.2026) still knew /pit-38 from
// no page at all. A copy of src/lib/calculators.ts (an edge function cannot
// import from src/) - keep the two in step.
const TOOLS: [string, string][] = [
  ['/kalkulator/procent-skladany', 'Kalkulator procentu składanego'],
  ['/kalkulator/podatek-belki', 'Kalkulator podatku Belki'],
  ['/kalkulator/cel-oszczednosciowy', 'Ile odkładać na cel'],
  ['/kalkulator/lokata', 'Kalkulator lokaty'],
  ['/kalkulator/inflacja', 'Kalkulator inflacji'],
  ['/kalkulator/ikze', 'Kalkulator IKZE'],
  ['/kalkulator', 'Lokata, obligacje czy giełda'],
  ['/pit-38', 'Pomocnik PIT-38'],
]

function toolsNav(current: string): string {
  const links = TOOLS.filter(([path]) => path !== current)
    .map(([path, label]) => `<li><a href="${path}">${label}</a></li>`)
    .join('')
  return `<nav><h2>Kalkulatory</h2><ul>${links}</ul></nav>`
}

const WITH_TOOLS_NAV = new Set(['/', ...TOOLS.map(([path]) => path)])

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
  if (page.image) {
    html = replaceOnce(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${page.image}" />`)
    html = replaceOnce(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${page.image}" />`)
  }
  if (page.body) {
    const body = WITH_TOOLS_NAV.has(path) ? page.body.replace(/<\/main>$/, `${toolsNav(path)}</main>`) : page.body
    html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`)
  }

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}

export const config = {
  path: [
    '/',
    '/artykuly',
    '/kalkulator',
    '/kalkulator/procent-skladany',
    '/kalkulator/podatek-belki',
    '/kalkulator/cel-oszczednosciowy',
    '/kalkulator/lokata',
    '/kalkulator/inflacja',
    '/kalkulator/ikze',
    '/pit-38',
    '/rozliczenia',
    '/regulamin',
    '/polityka-prywatnosci',
  ],
}
