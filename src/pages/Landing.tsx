import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { formatDateTime } from '../lib/format'
import type { Article } from '../types'

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
    body: 'Dostęp wyłącznie na zaproszenie, bez reklam i bez śledzenia. Historia logowań pokazuje dokładnie, kto i kiedy wchodził na Twoje konto.',
  },
]

const STEPS = [
  { n: '1', title: 'Dostajesz zaproszenie', body: 'Rejestracja jest możliwa tylko na zaproszenie od kogoś, kto już korzysta ze skieta.' },
  { n: '2', title: 'Dodajesz swoje konta', body: 'Kilka minut wystarczy, żeby dodać konta bankowe, portfel akcji, lokaty i obligacje.' },
  { n: '3', title: 'Widzisz cały obraz', body: 'Dashboard aktualizuje się na bieżąco — majątek, zwrot z inwestycji i budżet w jednym miejscu.' },
]

function MockDashboardCard() {
  return (
    <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Wartość majątku</p>
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
          +4.5%
        </span>
      </div>
      {/* Illustrative placeholder figures only — never real account data (this is a public, logged-out page). */}
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">142 300 zł</p>
      <div className="mt-4 flex items-end gap-1.5">
        {[40, 55, 48, 62, 58, 70, 65, 80, 74, 90, 84, 96].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-accent-500/30 to-accent-500" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Zysk</p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">+6 150 zł</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Dywidendy YTD</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">3 200 zł</p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-accent-400/20 blur-2xl"
      />
    </div>
  )
}

function RequestAccessForm() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/access-requests/', { email }),
    onSuccess: () => setSent(true),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    mutation.mutate()
  }

  const errorDetail = (mutation.error as { response?: { data?: { detail?: string; email?: string } } } | undefined)
    ?.response?.data
  const errorMessage = errorDetail?.detail ?? errorDetail?.email

  if (sent) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        {t('Dziękujemy! Sprawdź skrzynkę e-mail — napiszemy, gdy administrator rozpatrzy Twoją prośbę.')}
      </p>
    )
  }

  if (!open) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">
        {t('Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika.')}{' '}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
        >
          {t('Nie masz zaproszenia? Poproś o dostęp →')}
        </button>
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-start gap-2">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('Twój adres e-mail')}
          required
          className="rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-accent-500 focus:outline-none"
        />
        {errorMessage && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-full bg-slate-900 dark:bg-slate-100 px-5 py-2 text-sm font-semibold text-white dark:text-slate-900 transition hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? t('Wysyłanie…') : t('Poproś o dostęp')}
      </button>
    </form>
  )
}

export default function Landing() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const { data: articles } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => (await api.get<Article[]>('/content/articles/')).data,
  })

  // A signed-in visitor still sees the landing page (e.g. clicking the logo
  // from inside the app) — the CTAs below just point into the app instead of
  // to the login form.
  const ctaHref = user ? '/dashboard' : '/logowanie'
  const ctaLabel = user ? t('Wejdź do aplikacji') : t('Zaloguj się')

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link
            to={ctaHref}
            className="rounded-full bg-accent-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent-600/30 transition hover:bg-accent-700 hover:shadow-md"
          >
            {user ? ctaLabel : t('Zaloguj się do aplikacji')}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden"
        >
          <div className="absolute left-1/2 top-[-120px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent-400/25 via-accent-500/10 to-transparent blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 px-3 py-1 text-xs font-medium text-accent-700 dark:text-accent-400">
              {t('Dostępne wyłącznie na zaproszenie')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
              {t('Panuj nad')}{' '}
              <span className="bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent">{t('swoimi finansami')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              {t(
                'skieta łączy konta bankowe, inwestycje, lokaty i obligacje w jednym miejscu — zobacz, jak naprawdę rośnie Twój majątek, bez arkusza kalkulacyjnego i bez zgadywania.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={ctaHref}
                className="rounded-full bg-accent-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-accent-600/30 transition hover:-translate-y-0.5 hover:bg-accent-700 hover:shadow-xl"
              >
                {ctaLabel}
              </Link>
            </div>
            {!user && (
              <div className="mt-4">
                <RequestAccessForm />
              </div>
            )}
          </div>
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <MockDashboardCard />
          </div>
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

      {/* How it works */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Jak to działa')}</h2>
          <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-slate-200 dark:bg-slate-700 sm:block" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative text-center sm:text-left">
                <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-600 text-lg font-bold text-white ring-4 ring-white dark:ring-slate-900">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{t(s.title)}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t(s.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Artykuły o finansach osobistych')}</h2>
        {!articles?.length ? (
          <p className="text-slate-400 dark:text-slate-500">{t('Wkrótce pojawią się tu pierwsze artykuły.')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to={`/artykuly/${a.slug}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-md"
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

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-400 dark:text-slate-500 sm:flex-row">
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
            <span>© {new Date().getFullYear()} skieta</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
