import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import FeedbackWidget from './FeedbackWidget'
import SockLogo from './SockLogo'
import { useTheme, type Theme } from '../theme/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import type { User } from '../types'

// Main categories only — each of these already has its own sub-tabs shown on
// the page itself (see GieldaLayout/AnalysisLayout + SubTabs) once you're in
// it, so the top bar doesn't also need flat shortcuts to those subcategories
// (e.g. "Przychody"/"Wydatki" used to be duplicated here AND inside Budżet).
// "Giełda"/"Budżet"/"Planowanie" are additionally hidden per the account's
// own feature-interest toggles (set at onboarding, editable in Account.tsx) —
// "Konta i lokaty" always shows since a bank account is required at signup.
const baseLinks = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/gielda', label: 'Giełda', interest: 'interest_stocks' as const },
  { to: '/konta', label: 'Konta i lokaty' },
  { to: '/budzet', label: 'Budżet', interest: 'interest_budget' as const },
  { to: '/planowanie', label: 'Planowanie', interest: 'interest_planning' as const },
  { to: '/analiza', label: 'Analiza', interest: 'interest_analysis' as const },
]

function getNavLinks(profile: User['profile'] | undefined, isStaff: boolean | undefined) {
  const links = baseLinks.filter((link) => !link.interest || !profile || profile[link.interest])
  return isStaff ? [...links, { to: '/admin', label: 'Admin' }] : links
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-800 dark:text-accent-300'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
  }`
}

function HeaderActions({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate: () => void }) {
  const { user, logout, updateProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  // Persist to the account too, not just localStorage — otherwise the next
  // login re-applies the server's stale value and silently reverts the pick
  // made from this quick toggle (the Account settings dropdown already did
  // this correctly; this button didn't). Update the local profile directly
  // (via AuthContext's `updateProfile`, not a PATCH-then-refetch) so e.g. the
  // Account page's "Domyślny kolor interfejsu" dropdown reflects the change
  // immediately — two clicks close together used to fire two independent
  // request pairs with no guaranteed resolution order, so whichever refetch
  // happened to land last "won" regardless of actual click order.
  const languageMutation = useMutation({
    mutationFn: async (next: 'pl' | 'en') => {
      setLanguage(next)
      updateProfile({ language: next })
      await api.patch('/auth/me/', { language: next })
    },
  })

  const themeMutation = useMutation({
    mutationFn: async (next: Theme) => {
      setTheme(next)
      updateProfile({ color_variant: next })
      await api.patch('/auth/me/', { color_variant: next })
    },
  })

  function handleToggleLanguage() {
    languageMutation.mutate(language === 'pl' ? 'en' : 'pl')
  }

  function handleToggleTheme() {
    themeMutation.mutate(theme === 'light' ? 'dark' : theme === 'dark' ? 'pink' : 'light')
  }

  return (
    <div
      className={`flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 ${
        stacked ? 'flex-wrap gap-y-2' : ''
      }`}
    >
      <NavLink
        to="/onboarding"
        onClick={onNavigate}
        title={t('Dodaj posiadane konta, akcje, lokaty lub obligacje')}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {t('+ Dodaj pozycje')}
      </NavLink>
      <button
        onClick={handleToggleLanguage}
        disabled={languageMutation.isPending}
        title={t('Zmień język interfejsu')}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
      >
        {language === 'pl' ? 'PL' : 'EN'}
      </button>
      <button
        onClick={handleToggleTheme}
        disabled={themeMutation.isPending}
        title={
          theme === 'light'
            ? t('Przełącz na ciemny motyw')
            : theme === 'dark'
              ? t('Przełącz na lawendowy motyw')
              : t('Przełącz na jasny motyw')
        }
        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
      >
        {theme === 'light' ? '🌙' : theme === 'dark' ? '🌸' : '☀️'}
      </button>
      <NavLink
        to="/moje-konto"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 ${isActive ? 'text-accent-700 dark:text-accent-400' : ''}`
        }
      >
        {user?.first_name || user?.username}
        {(user?.profile.login_streak ?? 0) > 0 && (
          <span title={t('Seria logowań: {0} dni', String(user!.profile.login_streak))}>
            🔥{user!.profile.login_streak}
          </span>
        )}
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

export default function Layout() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = getNavLinks(user?.profile, user?.is_staff)

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400"
            >
              <SockLogo className="h-6 w-6" />
              skieta
            </Link>
            <nav className="hidden md:flex gap-1">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="hidden md:block">
            <HeaderActions onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t('Menu')}
            aria-expanded={mobileOpen}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 md:hidden">
            <nav className="mb-3 flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
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
      <main className="mx-auto max-w-7xl px-4 py-6">
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
            <span>© {new Date().getFullYear()} skieta</span>
          </div>
        </div>
      </footer>
      <FeedbackWidget />
    </div>
  )
}
