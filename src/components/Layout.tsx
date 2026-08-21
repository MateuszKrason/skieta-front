import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FeedbackWidget from './FeedbackWidget'
import SockLogo from './SockLogo'
import { useTheme } from '../theme/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import type { User } from '../types'

// Main categories only — each of these already has its own sub-tabs shown on
// the page itself (see GieldaLayout/AnalysisLayout + SubTabs) once you're in
// it, so the top bar doesn't also need flat shortcuts to those subcategories
// (e.g. "Przychody"/"Wydatki" used to be duplicated here AND inside Analiza).
// "Giełda"/"Analiza"/"Planowanie" are additionally hidden per the account's
// own feature-interest toggles (set at onboarding, editable in Account.tsx) —
// "Konta i lokaty" always shows since a bank account is required at signup.
const baseLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/gielda', label: 'Giełda', interest: 'interest_stocks' as const },
  { to: '/konta', label: 'Konta i lokaty' },
  { to: '/analiza', label: 'Analiza', interest: 'interest_budget' as const },
  { to: '/planowanie', label: 'Planowanie', interest: 'interest_planning' as const },
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
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()

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
        onClick={toggleLanguage}
        title={t('Zmień język interfejsu')}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {language === 'pl' ? 'PL' : 'EN'}
      </button>
      <button
        onClick={toggleTheme}
        title={
          theme === 'light'
            ? t('Przełącz na ciemny motyw')
            : theme === 'dark'
              ? t('Przełącz na lawendowy motyw')
              : t('Przełącz na jasny motyw')
        }
        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
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
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400"
            >
              <SockLogo className="h-6 w-6" />
              Skieta
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
      <FeedbackWidget />
    </div>
  )
}
