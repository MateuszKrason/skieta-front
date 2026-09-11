import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import FeedbackWidget from './FeedbackWidget'
import InstallPrompt from './InstallPrompt'
import InviteNudgeBubble from './InviteNudgeBubble'
import { ScanReceiptNavButton } from './ScanReceiptButton'
import ScanningIndicator from './ScanningIndicator'
import SockLogo from './SockLogo'
import { useTheme, type Theme } from '../theme/ThemeContext'
import { LANGUAGES, useLanguage, type Language } from '../i18n/LanguageContext'
import { useDismissableMenu } from '../lib/useDismissableMenu'
import { TourProvider } from '../tour/TourContext'
import TourOverlay from '../tour/TourOverlay'
import type { User } from '../types'

const LANGUAGE_CODE_LABELS: Record<Language, string> = {
  pl: 'PL',
  en: 'EN',
  de: 'DE',
  es: 'ES',
}

// Main categories only - each of these already has its own sub-tabs shown on
// the page itself (see GieldaLayout/AnalysisLayout + SubTabs) once you're in
// it, so the top bar doesn't also need flat shortcuts to those subcategories
// (e.g. "Przychody"/"Wydatki" used to be duplicated here AND inside Budżet).
// "Giełda"/"Budżet"/"Planowanie" are additionally hidden per the account's
// own feature-interest toggles (set at onboarding, editable in Account.tsx) -
// "Konta i lokaty" always shows since a bank account is required at signup.
type InterestKey = 'interest_stocks' | 'interest_budget' | 'interest_planning' | 'interest_analysis'

const DASHBOARD_LINK = { to: '/dashboard', label: 'Dashboard', end: true, tourId: 'nav-dashboard' }

// Everything except Dashboard (always first) and Admin (conditional, always
// last) - keyed by route slug so a user's custom order (Profile.nav_order,
// reorderable in Account.tsx) can be applied by key lookup. Must mirror the
// backend's Profile.NAV_ORDER_KEYS / DEFAULT_NAV_ORDER exactly. `tourId`
// feeds the first-login interactive tour (see ../tour) - it spotlights each
// nav link by this data-tour value, so it must stay unique per link.
export const REORDERABLE_LINKS: Record<
  string,
  { to: string; label: string; interest?: InterestKey; end?: boolean; tourId: string }
> = {
  budzet: { to: '/budzet', label: 'Budżet', interest: 'interest_budget', tourId: 'nav-budzet' },
  konta: { to: '/konta', label: 'Konta i lokaty', tourId: 'nav-konta' },
  gielda: { to: '/gielda', label: 'Giełda', interest: 'interest_stocks', tourId: 'nav-gielda' },
  planowanie: { to: '/planowanie', label: 'Planowanie', interest: 'interest_planning', tourId: 'nav-planowanie' },
  analiza: { to: '/analiza', label: 'Analiza', interest: 'interest_analysis', tourId: 'nav-analiza' },
}
export const DEFAULT_NAV_ORDER = ['budzet', 'konta', 'gielda', 'planowanie', 'analiza']

function getNavLinks(profile: User['profile'] | undefined, isStaff: boolean | undefined) {
  // Saved orders are honoured even when they predate a tab: an order stored
  // before "Samochód" existed lists five keys, and demanding an exact length
  // would throw away a customisation the user made on purpose. Unknown keys
  // are dropped, missing ones join at the end in their default order.
  const saved = (profile?.nav_order ?? []).filter((key) => key in REORDERABLE_LINKS)
  const order = [...saved, ...DEFAULT_NAV_ORDER.filter((key) => !saved.includes(key))]
  const ordered = order
    .map((key) => REORDERABLE_LINKS[key])
    .filter((link): link is (typeof REORDERABLE_LINKS)[string] => !!link)
  const links = [DASHBOARD_LINK, ...ordered].filter(
    (link) => !('interest' in link) || !link.interest || !profile || profile[link.interest],
  )
  return isStaff ? [...links, { to: '/admin', label: 'Admin', tourId: 'nav-admin' }] : links
}

const SCAN_BUTTON_CLASS =
  'rounded-md border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-950/40 px-2.5 py-1 text-sm font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/50 disabled:opacity-60'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-800 dark:text-accent-300'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
  }`
}

// Persist to the account too, not just localStorage - otherwise the next
// login re-applies the server's stale value and silently reverts the pick
// made from this quick toggle (the Account settings dropdown already did
// this correctly; this button didn't). Update the local profile directly
// (via AuthContext's `updateProfile`, not a PATCH-then-refetch) so e.g. the
// Account page's "Domyślny kolor interfejsu" dropdown reflects the change
// immediately - two clicks close together used to fire two independent
// request pairs with no guaranteed resolution order, so whichever refetch
// happened to land last "won" regardless of actual click order.
function LanguageSelect({ className }: { className?: string }) {
  const { updateProfile } = useAuth()
  const { language, setLanguage, t } = useLanguage()

  const mutation = useMutation({
    mutationFn: async (next: Language) => {
      setLanguage(next)
      updateProfile({ language: next })
      await api.patch('/auth/me/', { language: next })
    },
  })

  return (
    <select
      value={language}
      onChange={(e) => mutation.mutate(e.target.value as Language)}
      disabled={mutation.isPending}
      title={t('Zmień język interfejsu')}
      className={`h-8 rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 ${className ?? ''}`}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_CODE_LABELS[lang]}
        </option>
      ))}
    </select>
  )
}

function ThemeToggleButton({ className }: { className?: string }) {
  const { updateProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  const mutation = useMutation({
    mutationFn: async (next: Theme) => {
      setTheme(next)
      updateProfile({ color_variant: next })
      await api.patch('/auth/me/', { color_variant: next })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate(theme === 'light' ? 'dark' : theme === 'dark' ? 'pink' : 'light')}
      disabled={mutation.isPending}
      title={
        theme === 'light'
          ? t('Przełącz na ciemny motyw')
          : theme === 'dark'
            ? t('Przełącz na lawendowy motyw')
            : t('Przełącz na jasny motyw')
      }
      className={`h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 ${className ?? ''}`}
    >
      {theme === 'light' ? '🌙' : theme === 'dark' ? '🌸' : '☀️'}
    </button>
  )
}

/** Everything on the bar that isn't a place you go or a thing you add:
 * account, language, theme, log out. They used to sit out in the open as four
 * more controls next to six nav links, which made the bar read as a wall of
 * small boxes with no hierarchy - and none of them is something you touch
 * more than once in a while. Folded behind the name, the bar keeps only what
 * gets used daily. */
function UserMenu({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useDismissableMenu<HTMLDivElement>(open, () => setOpen(false))

  const streak = user?.profile.login_streak ?? 0

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {user?.first_name || user?.username}
        {streak > 0 && <span title={t('Seria logowań: {0} dni', String(streak))}>🔥{streak}</span>}
        <span aria-hidden="true" className="text-xs text-slate-400 dark:text-slate-500">
          ▾
        </span>
      </button>
      <InviteNudgeBubble />
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg"
        >
          <NavLink
            to="/moje-konto"
            onClick={() => {
              setOpen(false)
              onNavigate()
            }}
            className={({ isActive }) =>
              `block rounded-md px-2 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 ${
                isActive ? 'text-accent-700 dark:text-accent-400' : ''
              }`
            }
          >
            {t('Moje konto')}
          </NavLink>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">{t('Język')}</span>
            <LanguageSelect className="w-16 shrink-0" />
          </div>
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="text-slate-500 dark:text-slate-400">{t('Motyw')}</span>
            <ThemeToggleButton className="w-16 shrink-0" />
          </div>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <button
            onClick={logout}
            className="block w-full rounded-md px-2 py-1.5 text-left font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Wyloguj')}
          </button>
        </div>
      )}
    </div>
  )
}

function HeaderActions({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate: () => void }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const addPositions = (
    <NavLink
      to="/onboarding"
      onClick={onNavigate}
      title={t('Dodaj posiadane konta, akcje, lokaty lub obligacje')}
      data-tour="header-add-positions"
      className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
    >
      {t('+ Dodaj pozycje')}
    </NavLink>
  )

  // The burger menu is already a menu - nesting a second dropdown inside it
  // would only add a tap, so the stacked variant keeps everything flat.
  if (stacked) {
    return (
      <div className="flex flex-wrap items-center gap-2 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
        {addPositions}
        <LanguageSelect />
        <ThemeToggleButton />
        <NavLink
          to="/moje-konto"
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-md px-2 py-1 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 ${isActive ? 'text-accent-700 dark:text-accent-400' : ''}`
          }
        >
          {t('Moje konto')}
        </NavLink>
        <button
          onClick={logout}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Wyloguj')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {/* The moment this feature is for is "I just walked out of the shop",
          not "I happen to be on the Budżet > Wydatki tab" - so it lives here,
          one tap away on every page and on a phone, rather than three clicks
          deep where it used to be the only place it existed. Hidden for
          accounts that turned the budget off, same rule as the nav links. */}
      {user?.profile.interest_budget !== false && (
        <ScanReceiptNavButton
          onStateChange={onNavigate}
          label={t('📷 Paragon')}
          dataTour="header-scan-receipt"
          className={SCAN_BUTTON_CLASS}
        />
      )}
      {addPositions}
      <UserMenu onNavigate={onNavigate} />
    </div>
  )
}

export default function Layout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = getNavLinks(user?.profile, user?.is_staff)

  return (
    <TourProvider>
    <div className="min-h-screen">
      {/* Above the header rather than inside the page: it is an offer about
          the app as a whole, and it only ever renders when the browser has
          already decided the app is installable. */}
      <InstallPrompt />
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4 xl:gap-8">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400"
            >
              <SockLogo className="h-6 w-6" />
              skieta
            </Link>
            <nav className="hidden lg:flex gap-1">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass} data-tour={link.tourId}>
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden lg:block">
            <HeaderActions onNavigate={() => setMobileOpen(false)} />
          </div>
          {/* On a phone the rest of HeaderActions collapses into the burger
              menu, which is the wrong place for this one: photographing a
              receipt is the single most phone-shaped thing the app does, and
              burying it behind a menu tap defeats the point. It sits on the
              bar itself instead, and is left out of the stacked menu below so
              it never shows twice. */}
          <div className="flex items-center gap-2 lg:hidden">
            {user?.profile.interest_budget !== false && (
              <ScanReceiptNavButton
                onStateChange={() => setMobileOpen(false)}
                label={t('📷 Paragon')}
                dataTour="header-scan-receipt"
                className={SCAN_BUTTON_CLASS}
              />
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t('Menu')}
              aria-expanded={mobileOpen}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 lg:hidden">
            <nav className="mb-3 flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                  data-tour={link.tourId}
                >
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <HeaderActions stacked onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </header>
      {/* Extra bottom padding reserves room for the fixed feedback bubble
          (bottom-left, see FeedbackWidget) so it doesn't sit on top of the
          last card once a page is scrolled to the bottom - most visible on
          narrow phones where cards stack into a single tall column. */}
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-24">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 dark:text-slate-500 sm:flex-row">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <SockLogo className="h-4 w-4" />
            skieta
          </span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-accent-700 dark:hover:text-accent-400 hover:underline">
              {t('Strona główna')}
            </Link>
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
      <FeedbackWidget />
      <ScanningIndicator />
    </div>
    <TourOverlay />
    </TourProvider>
  )
}
