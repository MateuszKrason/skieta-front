import { useTheme } from '../theme/ThemeContext'
import { LANGUAGES, useLanguage, type Language } from '../i18n/LanguageContext'

const LANGUAGE_CODE_LABELS: Record<Language, string> = {
  pl: 'PL',
  en: 'EN',
  de: 'DE',
  es: 'ES',
}

/** Theme/language switcher shown on the pre-login pages (login, register, password
 * reset, email verification) — these render outside <Layout>, which is the only
 * place these toggles used to live, so signed-out visitors had no way to switch
 * to dark mode or a different language before creating an account. */
export default function AuthTopBar() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="fixed right-4 top-4 flex items-center gap-2 text-sm">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        title={t('Zmień język interfejsu')}
        className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_CODE_LABELS[lang]}
          </option>
        ))}
      </select>
      <button
        onClick={toggleTheme}
        title={
          theme === 'light'
            ? t('Przełącz na ciemny motyw')
            : theme === 'dark'
              ? t('Przełącz na lawendowy motyw')
              : t('Przełącz na jasny motyw')
        }
        className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {theme === 'light' ? '🌙' : theme === 'dark' ? '🌸' : '☀️'}
      </button>
    </div>
  )
}
