import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import SockLogo from './SockLogo'
import { useTheme } from '../theme/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/gielda', label: 'Giełda' },
  { to: '/konta', label: 'Konta i lokaty' },
  { to: '/analiza', label: 'Analiza' },
  { to: '/planowanie', label: 'Planowanie' },
  { to: '/timeline', label: 'Timeline' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
              <SockLogo className="h-6 w-6" />
              Skieta
            </span>
            <nav className="flex gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`
                  }
                >
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <NavLink
              to="/onboarding"
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
              title={theme === 'dark' ? t('Przełącz na jasny motyw') : t('Przełącz na ciemny motyw')}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <NavLink
              to="/moje-konto"
              className={({ isActive }) =>
                `rounded-md px-2 py-1 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`
              }
            >
              {user?.username}
            </NavLink>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('Wyloguj')}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
