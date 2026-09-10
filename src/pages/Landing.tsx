import { lazy, Suspense, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import SockLogo from '../components/SockLogo'
import { LANGUAGES, LANGUAGE_LABELS, useLanguage, type Language } from '../i18n/LanguageContext'
import { useTheme } from '../theme/ThemeContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'
import { formatCountdown, formatDateTime } from '../lib/format'
import type { ActiveLandingPromotion, Article } from '../types'

// Only rendered when an admin has an active promotion running, which is
// almost never - so the QR library stays out of the chunk every visitor to
// the landing page downloads, and is fetched on the rare occasion a banner
// actually shows.
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })))

// Public, works logged-in or out - shows an
// admin-created temporary banner (see AdminLandingPromotions.tsx) with a live
// countdown, its invite QR/link, and hides itself once the countdown expires.
// Title/message come back already resolved to the current site language
// (server-side, see ActiveLandingPromotionSerializer) - `language` is part of
// the query key so switching languages refetches instead of showing stale text.
function PromotionBanner() {
  const { language, t } = useLanguage()
  const { data: promotion } = useQuery({
    queryKey: ['landing-promotion', language],
    queryFn: async () =>
      (await api.get<ActiveLandingPromotion | null>('/auth/landing-promotion/', { params: { language } })).data,
  })
  const [expired, setExpired] = useState(false)

  const target = promotion ? new Date(promotion.countdown_ends_at) : null
  const [label, setLabel] = useState<string | null>(target ? formatCountdown(target) : null)

  useEffect(() => {
    if (!target) return
    setExpired(false)
    setLabel(formatCountdown(target))
    const interval = setInterval(() => {
      const next = formatCountdown(target)
      setLabel(next)
      if (next === null) {
        setExpired(true)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotion?.id])

  if (!promotion || expired || label === null) return null

  return (
    <div className="border-b border-accent-800/20 bg-gradient-to-r from-accent-700 to-accent-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="shrink-0 rounded-md bg-white p-1.5">
            {/* Fallback holds the exact 56px the code will occupy, so the
                banner doesn't reflow when the chunk lands. */}
            <Suspense fallback={<div className="h-14 w-14" />}>
              <QRCodeSVG value={promotion.invite_url} size={56} />
            </Suspense>
          </div>
          <div>
            <p className="text-sm font-semibold">{promotion.title}</p>
            {promotion.message && <p className="text-xs text-accent-50/90">{promotion.message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-mono text-lg font-bold tabular-nums">{label}</p>
            <p className="text-[10px] uppercase tracking-wide text-accent-50/80">{t('Zostało')}</p>
          </div>
          <a
            href={promotion.invite_url}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent-700 shadow-sm transition hover:bg-accent-50"
          >
            {t('Zarejestruj się')}
          </a>
        </div>
      </div>
    </div>
  )
}

function Icon({ path, className = 'h-6 w-6' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const ICONS = {
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  trending: 'M3 17l6-6 4 4 8-8M15 6h6v6',
  wallet: 'M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm14 6h.01',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  camera: 'M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-2.5 9 1.8 1.8L15.5 10',
}

// Ordered by who is reading, not by what the app is proudest of. The page
// used to open with net worth, brokerage accounts and Belka tax, which reads
// as "portfolio tracker for people who already invest" - two of its three
// screenshots were stock screens - and quietly told everyone who just wants
// to know where their salary goes that this is not for them. That is the far
// larger group, and it does not work the other way round: someone who
// invests does not leave a page about budgeting, because they have expenses
// too. So budgeting leads and the investment features stay as depth, which
// is also where the real differentiator against every other budget app is.
const FEATURES: { icon: keyof typeof ICONS; title: string; body: string }[] = [
  {
    icon: 'wallet',
    title: 'Przychody, wydatki i budżet',
    body: 'Zarządzaj przychodami i wydatkami, monitoruj budżet miesiąc po miesiącu i sprawdzaj bilans - automatyczny import wyciągów, kategorie, sklepy i tagi robią to za Ciebie.',
  },
  {
    icon: 'camera',
    title: 'Wydatek ze zdjęcia paragonu',
    body: 'Zrób paragonowi zdjęcie telefonem, a skieta odczyta kwotę, datę i sklep oraz sama zaproponuje kategorię z Twojej listy. Zostaje Ci sprawdzić i zapisać.',
  },
  {
    icon: 'target',
    title: 'Cele oszczędnościowe',
    body: 'Ustaw cel, rezerwuj kwoty z konkretnych wypłat lub z bieżących oszczędności i śledź postęp na żywo.',
  },
  {
    icon: 'layers',
    title: 'Wszystko w jednym miejscu',
    body: 'Konta bankowe, akcje, obligacje i lokaty - jeden widok na cały Twój majątek, bez przełączania się między aplikacjami banków i domów maklerskich.',
  },
  {
    // Two investor-facing cards merged into one: the section keeps six tiles
    // (a clean 3x2 grid) with budgeting now taking the first three.
    icon: 'trending',
    title: 'Realny zwrot, dywidendy i podatki',
    body: 'Jeśli inwestujesz: zysk liczony osobno od wpłaconego kapitału, po podatku Belki, plus historia i prognoza dywidend wraz z szacowanym podatkiem do zapłaty.',
  },
  {
    icon: 'shield',
    title: 'Twoje dane, Twoja kontrola',
    // Says precisely what's true - nobody browses users' finances - instead of
    // a blanket "no tracking" claim, which would sit awkwardly next to the
    // site's own analytics on page views.
    body: 'Bez reklam i bez sprzedawania danych. Nikt nie zagląda w Twoje konta - Twoje liczby służą wyłącznie do wyliczeń, które widzisz w aplikacji. Historia logowań pokazuje, kto i kiedy wchodził na Twoje konto.',
  },
]

// The three claims from FEATURES that are hardest to believe without seeing
// them - profit split from contributed capital, dividends projected forward,
// goals funded from a specific payslip - each paired with the screen that
// proves it. Deliberately not one row per feature: six screenshots would be a
// scroll marathon, and the remaining features are believable as text.
const SHOWCASE: { name: 'wydatki' | 'portfel' | 'planowanie'; title: string; body: string; alt: string }[] = [
  {
    name: 'wydatki',
    title: 'Widać, na co naprawdę idą pieniądze',
    body: 'Wydatki z podziałem na kategorie, sklepy i tagi, miesiąc po miesiącu. Nowy wydatek dodajesz zdjęciem paragonu - kwota, data i sklep odczytują się same, a kategoria jest proponowana z Twojej własnej listy.',
    alt: 'Strona wydatków w skiecie: podział na kategorie i sklepy, wykres wydatków w czasie i przycisk wgrywania paragonu',
  },
  {
    name: 'portfel',
    title: 'Zysk, a nie tylko saldo',
    body: 'Portfel pokazuje osobno wpłacony kapitał i osobno zysk - brutto oraz po podatku Belki. Przy akcjach kupionych w obcej walucie widzisz dodatkowo, ile z wyniku zrobił sam kurs, a nie kurs spółki.',
    alt: 'Portfel akcji w skiecie z kolumnami zysku brutto i po podatku Belki oraz wpływem kursu waluty',
  },
  {
    name: 'planowanie',
    title: 'Cele, które same się pilnują',
    body: 'Ustaw cel i zarezerwuj na niego kwotę z konkretnej wypłaty albo z bieżących oszczędności. skieta liczy, ile wypłat zostało i ile trzeba odkładać z każdej, żeby zdążyć.',
    alt: 'Planowanie budżetu w skiecie z celami oszczędnościowymi i postępem zbierania',
  },
]

const STEPS = [
  { n: '1', title: 'Zakładasz konto', body: 'Rejestracja jest otwarta i zajmuje minutę. Nie potrzebujesz zaproszenia ani karty płatniczej.' },
  { n: '2', title: 'Zaczynasz notować', body: 'Dodajesz konto bankowe, a wydatki wrzucasz zdjęciem paragonu. Portfel akcji, lokaty i obligacje - jeśli je masz.' },
  { n: '3', title: 'Widzisz cały obraz', body: 'Dashboard aktualizuje się na bieżąco - budżet, majątek i zwrot z inwestycji w jednym miejscu.' },
]

// Written for someone who arrived from a search engine and is deciding
// whether to hand a finance app their numbers. The questions are the ones
// that decide that - what it costs, whether it wants bank passwords, who
// reads the data, and whether they can leave - rather than the ones that
// happen to be easy to answer.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Ile to kosztuje?',
    // Present tense, and deliberately promising nothing about the future.
    // The original wording ("bez płatnych funkcji [...] ani później") ruled
    // out ever charging for anything; a later draft promised that whatever
    // someone uses today stays free. Both were commitments the product does
    // not want to make - today's features may be priced later too. So the
    // answer states what is true now and stops there.
    //
    // The one forward-looking clause that stays is the export, and it is not
    // a marketing concession: a copy of one's own data is owed under RODO
    // art. 15/20 whatever the price list says. Saying so is what keeps the
    // rest of the paragraph from reading as a trap - the honest answer to
    // "what if you start charging" is "you can always leave with your data".
    a: 'Nic. skieta jest dziś w całości bezpłatna - bez abonamentu, bez reklam i bez podawania numeru karty. Gdyby w przyszłości pojawiła się wersja płatna, uprzedzimy o tym z wyprzedzeniem, a pobranie kopii swoich danych pozostanie bezpłatne - to Twoje prawo wynikające z RODO, nie element oferty.',
  },
  {
    // High up on purpose: it is the objection this page used to create by
    // itself. Answerable with a plain "yes" because the app really does hide
    // the whole investing side behind the interest toggles picked at signup
    // (see Onboarding's INTERESTS and Layout's getNavLinks).
    q: 'Czy mogę używać skiety tylko do budżetu, bez inwestycji?',
    a: 'Tak, i nie musisz niczego obchodzić. Przy zakładaniu konta zaznaczasz, co Cię interesuje - jeśli nie zaznaczysz giełdy, cała część inwestycyjna po prostu znika z menu i zostaje czysta aplikacja do przychodów, wydatków, paragonów i celów oszczędnościowych. Możesz to zmienić w każdej chwili w ustawieniach konta.',
  },
  {
    q: 'Jak działa dodawanie wydatku ze zdjęcia paragonu?',
    // Says out loud that it needs the user's own key. Discovering that only
    // after photographing a receipt is exactly how people bounced off this
    // feature in the app, and hiding it here would repeat the mistake.
    a: 'Robisz paragonowi zdjęcie telefonem, a skieta odczytuje z niego kwotę, datę i nazwę sklepu oraz proponuje kategorię z Twojej własnej listy - poprawiasz, co trzeba, i zapisujesz. Odczytem zajmuje się Google Gemini na Twoim własnym, darmowym kluczu, który wklejasz raz przy pierwszym skanowaniu. Samego zdjęcia nigdzie nie zapisujemy - jest odczytywane w locie i nie trafia do naszej bazy.',
  },
  {
    q: 'Czy potrzebuję zaproszenia?',
    a: 'Nie. Rejestracja jest otwarta dla wszystkich - wystarczy założyć konto. Zaproszenia nadal działają: jeśli ktoś prześle Ci swój link, zapiszemy, że to dzięki niemu tu trafiłeś/aś, ale nie jest to warunek założenia konta.',
  },
  {
    q: 'Czy muszę podawać dane logowania do banku?',
    a: 'Nie. skieta nie łączy się z bankami i nigdy nie prosi o hasła bankowe. Konta, lokaty i transakcje dodajesz sam, a historię możesz zaimportować z pliku wyciągu. Automatycznie pobierane są wyłącznie publiczne dane rynkowe: notowania akcji, kursy walut NBP i oprocentowanie obligacji skarbowych.',
  },
  {
    q: 'Czym to się różni od arkusza kalkulacyjnego?',
    a: 'Arkusz nie zrobi za Ciebie zdjęcia paragonu i nie policzy, ile realnie zarobiłeś. skieta odczytuje wydatek ze zdjęcia i sama pilnuje kategorii, a przy inwestycjach liczy zysk osobno od wpłaconego kapitału, po podatku Belki, z kosztem zakupu akcji przeliczonym po kursie NBP z dnia transakcji, a nie dzisiejszym. To rzeczy, które w arkuszu trzeba utrzymywać ręcznie i łatwo w nich o błąd.',
  },
  {
    q: 'Skąd biorą się kursy i oprocentowanie?',
    a: 'Z publicznych źródeł: notowania z Yahoo Finance i Stooq, kursy walut z NBP, aktualne oprocentowanie obligacji skarbowych z obligacjeskarbowe.pl. Dane odświeżane są automatycznie, a przy porównaniach zawsze widzisz, z jakiego okresu pochodzą.',
  },
  {
    q: 'Kto widzi moje finanse?',
    a: 'Tylko Ty. Nikt nie przegląda sald ani transakcji poszczególnych użytkowników - dane są przetwarzane po to, żeby wyliczyć to, co widzisz na swoim dashboardzie. W ustawieniach konta znajdziesz historię logowań, więc sam sprawdzisz, kto i kiedy wchodził na Twoje konto.',
  },
  {
    q: 'Czy mogę usunąć swoje konto i dane?',
    a: 'Tak, w każdej chwili i samodzielnie, z poziomu ustawień konta - bez pisania do kogokolwiek.',
  },
]

// Real screenshots of the running app, replacing the hand-drawn mock card that
// used to sit in the hero with invented figures. They are captures of a
// demo account, not anyone's finances - see the caption under the hero shot,
// which says so rather than leaving a visitor to assume these are real
// customer balances.
//
// Intrinsic sizes are the light variant's; the dark file differs by a pixel or
// two, which the browser scales into the same box. They're set as width/height
// attributes so the browser reserves the right space before the image arrives
// instead of shoving the page down when it lands.
const PRODUCT_SHOTS = {
  dashboard: { width: 1262, height: 843 },
  wydatki: { width: 1262, height: 1015 },
  portfel: { width: 1262, height: 725 },
  planowanie: { width: 1261, height: 788 },
} as const

function ProductShot({
  name,
  alt,
  priority = false,
}: {
  name: keyof typeof PRODUCT_SHOTS
  alt: string
  priority?: boolean
}) {
  const { theme } = useTheme()
  // Only two sets of captures exist; the pink theme keeps the app's light
  // chrome, so it reads the light one too.
  const variant = theme === 'dark' ? 'dark' : 'light'
  const { width, height } = PRODUCT_SHOTS[name]
  return (
    <img
      src={`/screens/${name}-${variant}.webp`}
      alt={alt}
      width={width}
      height={height}
      // The hero shot is the largest thing above the fold, so it loads
      // eagerly; everything below waits until the visitor scrolls to it.
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-slate-900/10"
    />
  )
}

export default function Landing() {
  const { language, setLanguage, t } = useLanguage()
  const { user } = useAuth()

  const { data: articlesData } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => (await api.get<Article[]>('/content/articles/')).data,
  })
  // Anything other than an array means the API didn't answer with what it
  // promises - the SPA fallback returning index.html for /api/* is the way
  // this actually happens, and a 200 full of HTML sails past every error
  // path. Without this the landing page died on `.map` of a string, taking
  // the whole page down with it rather than just the articles section.
  const articles = Array.isArray(articlesData) ? articlesData : []
  // Articles are all written in Polish today - admin-toggleable per site
  // language (see AdminArticlesVisibility.tsx) so the section can stay
  // hidden for languages without translated content yet.
  const { data: articlesVisibility } = useQuery({
    queryKey: ['articles-visibility'],
    queryFn: async () => (await api.get<Record<string, boolean>>('/content/articles-visibility/')).data,
  })
  const articlesEnabled = articlesVisibility?.[language] ?? true

  // A signed-in visitor still sees the landing page (e.g. clicking the logo
  // from inside the app) - the CTAs below just point into the app instead of
  // to the login form.
  const ctaHref = user ? '/dashboard' : '/logowanie'
  const ctaLabel = user ? t('Wejdź do aplikacji') : t('Zaloguj się')

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <PromotionBanner />
      <header className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              title={t('Zmień język interfejsu')}
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
            {/* Two actions for a stranger, one for a signed-in visitor.
                Signing up is the one being pushed, so log-in sits next to it
                as a quiet link rather than a second button competing with
                it - returning users go looking for it anyway. */}
            {!user && (
              <Link
                to="/logowanie"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-accent-700 dark:hover:text-accent-400"
              >
                {t('Zaloguj się')}
              </Link>
            )}
            <Link
              to={user ? ctaHref : '/register'}
              className="rounded-full bg-accent-700 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent-600/30 transition hover:bg-accent-800 hover:shadow-md"
            >
              {user ? ctaLabel : t('Załóż konto')}
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden"
        >
          <div className="absolute left-1/2 top-[-120px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent-400/25 via-accent-500/10 to-transparent blur-3xl" />
        </div>
        {/* Text above, product shot below, rather than side by side: a real
            screenshot squeezed into half a column is too small to read, and
            the whole point of showing one is that a visitor can see what they
            would actually be using. */}
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 px-3 py-1 text-xs font-medium text-accent-700 dark:text-accent-400">
              {t('Bezpłatnie, bez reklam, bez karty')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
              {t('Panuj nad')}{' '}
              <span className="bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent">{t('swoimi finansami')}</span>
            </h1>
            <p className="mt-3 text-base font-medium italic text-accent-700 dark:text-accent-400">
              {t('skieta - Twoja wirtualna skarpeta z oszczędnościami.')}
            </p>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              {t(
                'Zapisuj wydatki zdjęciem paragonu i zobacz, gdzie naprawdę idą Twoje pieniądze. A jeśli inwestujesz - skieta doliczy do tego akcje, lokaty i obligacje i pokaże realny zysk, a nie samo saldo.',
              )}
            </p>
            {/* The order flips with who's reading. A signed-in visitor wants
                the app. A stranger gets the one action that now actually
                exists for them - creating an account - with the calculator
                kept alongside as the no-commitment way to see the maths
                first. */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? ctaHref : '/register'}
                onClick={() => {
                  if (user) return
                  trackEvent('register_clicked', { source: 'landing_hero' })
                  rememberSignupSource('landing_hero')
                }}
                className="rounded-full bg-accent-700 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-accent-600/30 transition hover:-translate-y-0.5 hover:bg-accent-800 hover:shadow-xl"
              >
                {user ? ctaLabel : t('Załóż darmowe konto →')}
              </Link>
              <Link
                to="/kalkulator"
                className="rounded-full border border-slate-300 dark:border-slate-600 px-7 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 transition hover:border-accent-400 hover:text-accent-700 dark:hover:text-accent-400"
              >
                {t('Wypróbuj kalkulator →')}
              </Link>
            </div>
            {/* Answered next to the decision, not only in the FAQ far below:
                "what does it cost" is the question a stranger asks before
                handing over an email address, and silence about price reads
                worse than any price. */}
            {!user && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t('Konto zakładasz w minutę. Bez zaproszenia, bez karty, bez zobowiązań.')}
              </p>
            )}
          </div>

          <figure className="mx-auto mt-14 max-w-5xl">
            <ProductShot name="dashboard" alt={t('Dashboard skiety: wartość majątku, podział na akcje, gotówkę, lokaty i obligacje oraz wykres majątku w czasie')} priority />
            {/* Says plainly whose numbers these are. They come from a demo
                account, and a finance app showing balances owes the visitor
                that much rather than letting them assume it's a real user. */}
            <figcaption className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
              {t('Zrzut z działającej aplikacji, na danych demonstracyjnych.')}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Zbudowane, żeby faktycznie z tego korzystać')}</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            {t('Nie kolejny arkusz kalkulacyjny - narzędzie, które samo liczy to, co dla Ciebie ważne.')}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition hover:-translate-y-1 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-lg"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400 transition group-hover:bg-accent-600 group-hover:text-white">
                <Icon path={ICONS[f.icon]} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t(f.body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase - the claims above, shown rather than asserted. Left on the
          page background so the white "Jak to działa" band below still reads
          as a change of section rather than two white blocks in a row. */}
      <section>
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Zobacz, jak to wygląda w środku')}</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {t('Poniżej prawdziwe ekrany aplikacji - te same, które zobaczysz po zalogowaniu.')}
            </p>
          </div>
          <div className="mt-14 flex flex-col gap-16 sm:gap-20">
            {SHOWCASE.map((item, i) => (
              <div key={item.name} className="grid items-center gap-8 lg:grid-cols-5 lg:gap-12">
                {/* Alternating sides, but only from lg up - stacked on a
                    phone the image always comes first, so the reader sees
                    what's being described before reading about it. */}
                <div className={i % 2 === 1 ? 'lg:col-span-3 lg:order-2' : 'lg:col-span-3'}>
                  <ProductShot name={item.name} alt={t(item.alt)} />
                </div>
                <div className={i % 2 === 1 ? 'lg:col-span-2 lg:order-1' : 'lg:col-span-2'}>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t(item.title)}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">{t(item.body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Jak to działa')}</h2>
          <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-slate-200 dark:bg-slate-700 sm:block" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative text-center sm:text-left">
                <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-700 text-lg font-bold text-white ring-4 ring-white dark:ring-slate-900">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{t(s.title)}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t(s.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t('Częste pytania')}
        </h2>
        <div className="mt-10 flex flex-col gap-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm transition hover:border-accent-300 dark:hover:border-accent-700"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                {t(item.q)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg font-normal text-accent-600 dark:text-accent-400 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(item.a)}</p>
            </details>
          ))}
        </div>
        {!user && (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center">
            {/* Someone who read to the bottom of the FAQ has done the work of
                being convinced - don't make them scroll back up to act on it. */}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('Przekonaliśmy Cię?')}
            </p>
            <Link
              to="/register"
              onClick={() => {
                trackEvent('register_clicked', { source: 'landing_faq' })
                rememberSignupSource('landing_faq')
              }}
              className="mt-3 inline-block rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800"
            >
              {t('Załóż darmowe konto →')}
            </Link>
          </div>
        )}
      </section>

      {/* Articles */}
      {articlesEnabled && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Artykuły o finansach osobistych')}</h2>
          {!articles.length ? (
            <p className="text-slate-500 dark:text-slate-400">{t('Wkrótce pojawią się tu pierwsze artykuły.')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to={`/artykuly/${a.slug}`}
                  className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-md"
                >
                  <time dateTime={a.published_at} className="text-xs text-slate-500 dark:text-slate-400">
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
      )}

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-600 to-accent-800 px-8 py-14 text-center shadow-xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          />
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {user ? t('Wróć do swojego majątku') : t('Zacznij dziś')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-accent-50/90">
            {user
              ? t('Kontynuuj tam, gdzie skończyłeś/aś - Twój dashboard czeka.')
              : t('Załóż konto i zacznij notować wydatki jeszcze dziś - pierwszy paragon wrzucisz zdjęciem w kilka sekund.')}
          </p>
          <Link
            to={user ? ctaHref : '/register'}
            className="mt-6 inline-block rounded-full bg-white px-7 py-3 text-base font-semibold text-accent-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {user ? ctaLabel : t('Załóż darmowe konto →')}
          </Link>
          {!user && (
            <p className="mt-4 text-sm text-accent-50/80">
              {t('Masz już konto?')}{' '}
              <Link to="/logowanie" className="font-semibold text-white underline">
                {t('Zaloguj się')}
              </Link>
            </p>
          )}
        </div>
      </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-slate-500 dark:text-slate-400">
            <SockLogo className="h-5 w-5" />
            skieta
          </span>
          <div className="flex items-center gap-5">
            <Link to="/polityka-prywatnosci" className="hover:text-accent-700 dark:hover:text-accent-400 hover:underline">
              {t('Polityka prywatności')}
            </Link>
            <Link to="/regulamin" className="hover:text-accent-700 dark:hover:text-accent-400 hover:underline">
              {t('Regulamin')}
            </Link>
            <a
              href="https://www.facebook.com/profile.php?id=61593710680861"
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent-700 dark:hover:text-accent-400 hover:underline"
            >
              Facebook
            </a>
            <span>© {new Date().getFullYear()} skieta</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
