import { lazy, Suspense, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import RequestAccessForm from '../components/RequestAccessForm'
import SockLogo from '../components/SockLogo'
import { LANGUAGES, LANGUAGE_LABELS, useLanguage, type Language } from '../i18n/LanguageContext'
import { useTheme } from '../theme/ThemeContext'
import { formatCountdown, formatDateTime } from '../lib/format'
import type { ActiveLandingPromotion, Article } from '../types'

// Only rendered when an admin has an active promotion running, which is
// almost never — so the QR library stays out of the chunk every visitor to
// the landing page downloads, and is fetched on the rare occasion a banner
// actually shows.
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })))

// Public, works logged-in or out (same as RequestAccessForm below) — shows an
// admin-created temporary banner (see AdminLandingPromotions.tsx) with a live
// countdown, its invite QR/link, and hides itself once the countdown expires.
// Title/message come back already resolved to the current site language
// (server-side, see ActiveLandingPromotionSerializer) — `language` is part of
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
  coins: 'M8 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0Zm0 0a5 3 0 1 1 10 0M4 9a5 3 0 0 1 8-2.4M4 9v3a5 3 0 0 0 8 2.4M4 9a5 3 0 0 0 4.5 2.98',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-2.5 9 1.8 1.8L15.5 10',
}

const FEATURES: { icon: keyof typeof ICONS; title: string; body: string }[] = [
  {
    icon: 'layers',
    title: 'Wszystko w jednym miejscu',
    body: 'Konta bankowe, akcje, obligacje i lokaty — jeden widok na cały Twój majątek, bez przełączania się między aplikacjami banków i domów maklerskich.',
  },
  {
    icon: 'trending',
    title: 'Realny zwrot z inwestycji',
    body: 'Zysk liczony osobno od wpłaconego kapitału — zobaczysz dokładnie, ile realnie zarobiłeś na lokatach, obligacjach i akcjach, po podatku Belki.',
  },
  {
    icon: 'wallet',
    title: 'Przychody, wydatki i budżet',
    body: 'Zarządzaj przychodami i wydatkami, monitoruj budżet miesiąc po miesiącu i sprawdzaj bilans — automatyczny import wyciągów, kategorie, sklepy i tagi robią to za Ciebie.',
  },
  {
    icon: 'target',
    title: 'Cele oszczędnościowe',
    body: 'Ustaw cel, rezerwuj kwoty z konkretnych wypłat lub z bieżących oszczędności i śledź postęp na żywo.',
  },
  {
    icon: 'coins',
    title: 'Dywidendy i podatki',
    body: 'Historia i prognoza wypłat dywidend, szacowany podatek Belki do zapłaty — żadnych niespodzianek przy rozliczeniu.',
  },
  {
    icon: 'shield',
    title: 'Twoje dane, Twoja kontrola',
    // Says precisely what's true - nobody browses users' finances - instead of
    // a blanket "no tracking" claim, which would sit awkwardly next to the
    // site's own analytics on page views.
    body: 'Dostęp wyłącznie na zaproszenie i bez reklam. Nikt nie zagląda w Twoje konta — Twoje liczby służą wyłącznie do wyliczeń, które widzisz w aplikacji. Historia logowań pokazuje, kto i kiedy wchodził na Twoje konto.',
  },
]

// The three claims from FEATURES that are hardest to believe without seeing
// them - profit split from contributed capital, dividends projected forward,
// goals funded from a specific payslip - each paired with the screen that
// proves it. Deliberately not one row per feature: six screenshots would be a
// scroll marathon, and the remaining features are believable as text.
const SHOWCASE: { name: 'portfel' | 'dywidendy' | 'planowanie'; title: string; body: string; alt: string }[] = [
  {
    name: 'portfel',
    title: 'Zysk, a nie tylko saldo',
    body: 'Portfel pokazuje osobno wpłacony kapitał i osobno zysk — brutto oraz po podatku Belki. Przy akcjach kupionych w obcej walucie widzisz dodatkowo, ile z wyniku zrobił sam kurs, a nie kurs spółki.',
    alt: 'Portfel akcji w skiecie z kolumnami zysku brutto i po podatku Belki oraz wpływem kursu waluty',
  },
  {
    name: 'dywidendy',
    title: 'Dywidendy policzone w przód',
    body: 'Historia wypłat, prognoza kolejnych na podstawie rytmu każdej spółki i szacowany podatek do zapłaty. Nie musisz nic wpisywać ręcznie ani pilnować terminów.',
    alt: 'Profil dywidendowy w skiecie: suma wypłat, projekcja rocznego dochodu i planowane dywidendy',
  },
  {
    name: 'planowanie',
    title: 'Cele, które same się pilnują',
    body: 'Ustaw cel i zarezerwuj na niego kwotę z konkretnej wypłaty albo z bieżących oszczędności. skieta liczy, ile wypłat zostało i ile trzeba odkładać z każdej, żeby zdążyć.',
    alt: 'Planowanie budżetu w skiecie z celami oszczędnościowymi i postępem zbierania',
  },
]

const STEPS = [
  { n: '1', title: 'Dostajesz zaproszenie', body: 'Rejestracja jest możliwa tylko na zaproszenie od kogoś, kto już korzysta ze skieta.' },
  { n: '2', title: 'Dodajesz swoje konta', body: 'Kilka minut wystarczy, żeby dodać konta bankowe, portfel akcji, lokaty i obligacje.' },
  { n: '3', title: 'Widzisz cały obraz', body: 'Dashboard aktualizuje się na bieżąco — majątek, zwrot z inwestycji i budżet w jednym miejscu.' },
]

// The first question anyone arriving from a search engine has is why they
// can't just sign up — leaving that unanswered on the page loses exactly the
// visitors the articles are meant to bring in. Invite-only is a deliberate
// product decision, so it's stated as one rather than apologized for.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'Dlaczego rejestracja jest tylko na zaproszenie?',
    a: 'To świadoma decyzja, a nie etap przejściowy. Baza użytkowników rośnie powoli i w kontrolowany sposób. Jeśli nie masz zaproszenia, zostaw adres e-mail w formularzu wyżej - prośby o dostęp są rozpatrywane pojedynczo.',
  },
  {
    q: 'Ile to kosztuje?',
    a: 'Nic. skieta jest bezpłatna - bez abonamentu, bez płatnych funkcji i bez reklam. Nie podajesz numeru karty ani przy zakładaniu konta, ani później.',
  },
  {
    q: 'Czy muszę podawać dane logowania do banku?',
    a: 'Nie. skieta nie łączy się z bankami i nigdy nie prosi o hasła bankowe. Konta, lokaty i transakcje dodajesz sam, a historię możesz zaimportować z pliku wyciągu. Automatycznie pobierane są wyłącznie publiczne dane rynkowe: notowania akcji, kursy walut NBP i oprocentowanie obligacji skarbowych.',
  },
  {
    q: 'Czym to się różni od arkusza kalkulacyjnego?',
    a: 'Arkusz pokaże Ci, ile masz. skieta pokazuje, ile z tego faktycznie zarobiłeś - zysk liczony osobno od wpłaconego kapitału, po podatku Belki, z kosztem zakupu akcji przeliczonym po kursie NBP z dnia transakcji, a nie dzisiejszym. To rzeczy, które w arkuszu trzeba utrzymywać ręcznie i łatwo w nich o błąd.',
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
  portfel: { width: 1262, height: 725 },
  dywidendy: { width: 1256, height: 821 },
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
  // from inside the app) — the CTAs below just point into the app instead of
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
            <Link
              to={ctaHref}
              className="rounded-full bg-accent-700 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent-600/30 transition hover:bg-accent-800 hover:shadow-md"
            >
              {user ? ctaLabel : t('Zaloguj się do aplikacji')}
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
              {t('Dostępne wyłącznie na zaproszenie')}
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
                'skieta łączy konta bankowe, inwestycje, lokaty i obligacje w jednym miejscu — zobacz, jak naprawdę rośnie Twój majątek, bez arkusza kalkulacyjnego i bez zgadywania.',
              )}
            </p>
            {/* The order flips with who's reading. A signed-in visitor wants
                the app. A stranger cannot log in at all - registration is
                invite-only - so leading them with a login button was sending
                the one group that can actually convert to a dead end, and
                duplicating the header's button while doing it. They get the
                calculator instead: it needs no account, and it carries its
                own access-request form at the bottom (PublicCalculator.tsx),
                so it hands them something before asking for anything. */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? ctaHref : '/kalkulator'}
                className="rounded-full bg-accent-700 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-accent-600/30 transition hover:-translate-y-0.5 hover:bg-accent-800 hover:shadow-xl"
              >
                {user ? ctaLabel : t('Wypróbuj kalkulator →')}
              </Link>
              <Link
                to={user ? '/kalkulator' : '/logowanie'}
                className="rounded-full border border-slate-300 dark:border-slate-600 px-7 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 transition hover:border-accent-400 hover:text-accent-700 dark:hover:text-accent-400"
              >
                {user ? t('Wypróbuj kalkulator →') : t('Zaloguj się')}
              </Link>
            </div>
            {/* Answered next to the decision, not only in the FAQ far below:
                "what does it cost" is the question a stranger asks before
                handing over an email address, and silence about price reads
                worse than any price. */}
            {!user && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t('Bezpłatnie, bez reklam i bez podawania karty.')}
              </p>
            )}
            {!user && (
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-5">
                {/* The prominent variant renders the field straight away. The
                    collapsed one hid the only action a new visitor can take
                    behind a text link they had to find and click first. */}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('Rejestracja jest na zaproszenie — nie masz go? Zostaw e-mail.')}
                </p>
                <div className="mt-3 flex justify-center">
                  <RequestAccessForm variant="prominent" source="landing_hero" />
                </div>
              </div>
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
            {t('Nie kolejny arkusz kalkulacyjny — narzędzie, które samo liczy to, co dla Ciebie ważne.')}
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

      {/* Showcase — the claims above, shown rather than asserted. Left on the
          page background so the white "Jak to działa" band below still reads
          as a change of section rather than two white blocks in a row. */}
      <section>
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Zobacz, jak to wygląda w środku')}</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {t('Poniżej prawdziwe ekrany aplikacji — te same, które zobaczysz po zalogowaniu.')}
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
                being convinced - don't make them hunt for the field. */}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('Rejestracja jest na zaproszenie — nie masz go? Zostaw e-mail.')}
            </p>
            <div className="mt-3 flex justify-center">
              <RequestAccessForm variant="prominent" source="landing_faq" />
            </div>
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
            {user ? t('Wróć do swojego majątku') : t('Masz już zaproszenie?')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-accent-50/90">
            {user
              ? t('Kontynuuj tam, gdzie skończyłeś/aś — Twój dashboard czeka.')
              : t('Zaloguj się i zobacz cały swój majątek w jednym miejscu — od razu po pierwszym dodaniu konta.')}
          </p>
          <Link
            to={ctaHref}
            className="mt-6 inline-block rounded-full bg-white px-7 py-3 text-base font-semibold text-accent-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {ctaLabel}
          </Link>
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
