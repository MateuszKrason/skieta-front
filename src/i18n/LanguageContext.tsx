import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { en } from './dictionaries/en'
import { de } from './dictionaries/de'
import { es } from './dictionaries/es'

// Kept to the 4 languages that map onto the 4 supported tax-residency
// countries (Poland/Germany/Spain/{USA,UK} - see lib/countries.ts and
// accounts.tax on the backend). frontend/src/i18n/dictionaries/{no,da,sq}.ts
// still exist on disk (completed translations) but are deliberately
// disconnected here - re-enabling one of those languages is just adding it
// back to this list plus its import, not redoing the translation work.
export type Language = 'pl' | 'en' | 'de' | 'es'

export const LANGUAGES: Language[] = ['pl', 'en', 'de', 'es']

export const LANGUAGE_LABELS: Record<Language, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
}

// pl is the source language (no dictionary — its own keys are the text).
const DICTIONARIES: Partial<Record<Language, Record<string, string>>> = { en, de, es }

// Default account currency per language, mirrored server-side in
// Profile.CURRENCY_BY_LANGUAGE (backend/accounts/models.py) — used to
// pre-fill the currency picker at registration when the user changes
// language, without forcing it (they can still override it freely).
export const CURRENCY_BY_LANGUAGE: Record<Language, string> = {
  pl: 'PLN',
  en: 'USD',
  de: 'EUR',
  es: 'EUR',
}

const STORAGE_KEY = 'myfaj_language'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (text: string, ...args: Array<string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

// Best-effort browser-locale -> supported Language mapping, used only when
// nothing has been saved yet (fresh visitor, incl. the logged-out landing
// page — LanguageProvider is the outermost provider, see main.tsx). Matches
// on the primary subtag (e.g. "de-AT" -> "de").
function detectBrowserLanguage(): Language {
  const candidates = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const raw of candidates) {
    const primary = raw?.toLowerCase().split('-')[0]
    if (primary === 'de') return 'de'
    if (primary === 'es') return 'es'
    if (primary === 'en') return 'en'
    if (primary === 'pl') return 'pl'
  }
  return 'pl'
}

function readInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (LANGUAGES as string[]).includes(stored)) return stored as Language
  return detectBrowserLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  function t(text: string, ...args: Array<string | number>): string {
    const dict = DICTIONARIES[language]
    const template = dict ? (dict[text] ?? text) : text
    if (args.length === 0) return template
    return template.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? ''))
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
