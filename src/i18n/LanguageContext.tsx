import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Kept to the 4 languages that map onto the 4 supported tax-residency
// countries (Poland/Germany/Spain/{USA,UK} - see lib/countries.ts and
// accounts.tax on the backend). frontend/src/i18n/dictionaries/{no,da,sq}.ts
// still exist on disk (completed translations) but are deliberately
// disconnected here - re-enabling one of those languages is just adding it
// back to this list plus its loader below, not redoing the translation work.
export type Language = 'pl' | 'en' | 'de' | 'es'

export const LANGUAGES: Language[] = ['pl', 'en', 'de', 'es']

export const LANGUAGE_LABELS: Record<Language, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
}

// Default account currency per language, mirrored server-side in
// Profile.CURRENCY_BY_LANGUAGE (backend/accounts/models.py) - used to
// pre-fill the currency picker at registration when the user changes
// language, without forcing it (they can still override it freely).
export const CURRENCY_BY_LANGUAGE: Record<Language, string> = {
  pl: 'PLN',
  en: 'USD',
  de: 'EUR',
  es: 'EUR',
}

const STORAGE_KEY = 'myfaj_language'

type Dictionary = Record<string, string>

// Fetched on demand, one language at a time. These three files are ~90 KB
// gzipped between them, and they used to be static imports - which put all of
// them in the chunk every single visitor downloads before anything renders,
// on a site whose source language is Polish and whose default (and fallback
// for any unrecognised browser locale) is therefore the one language with no
// dictionary at all. A Polish visitor now downloads none of this.
//
// pl is absent on purpose: it is the source language, so its own keys are the
// text and `t()` falls through to them.
const DICTIONARY_LOADERS: Record<Exclude<Language, 'pl'>, () => Promise<Dictionary>> = {
  en: () => import('./dictionaries/en').then((m) => m.en),
  de: () => import('./dictionaries/de').then((m) => m.de),
  es: () => import('./dictionaries/es').then((m) => m.es),
}

/** Resolves to null both for Polish (nothing to fetch) and for a failed fetch,
 * so a visitor whose dictionary chunk never arrives reads the Polish source
 * text instead of staring at a page that refuses to render. */
function loadDictionary(language: Language): Promise<Dictionary | null> {
  if (language === 'pl') return Promise.resolve(null)
  return DICTIONARY_LOADERS[language]().catch(() => null)
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (text: string, ...args: Array<string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

// Best-effort browser-locale -> supported Language mapping, used only when
// nothing has been saved yet (fresh visitor, incl. the logged-out landing
// page - LanguageProvider is the outermost provider, see main.tsx). Matches
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
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (LANGUAGES as string[]).includes(stored)) return stored as Language
  } catch {
    // Storage can be unreadable (Safari private mode, blocked site data) -
    // fall back to the browser locale rather than failing to boot.
  }
  return detectBrowserLanguage()
}

// Resolved once, at module evaluation, so the dictionary request is already in
// flight while React boots. Starting it from an effect instead would serialise
// two round trips: the app chunk, and only then the dictionary.
const INITIAL_LANGUAGE = readInitialLanguage()
const INITIAL_DICTIONARY = loadDictionary(INITIAL_LANGUAGE)

/** The language currently on screen together with the dictionary it is read
 * from. They are one value because they must change together: setting the
 * language first would leave `t()` briefly translating through the previous
 * language's dictionary - or, worse, through no dictionary at all, flashing
 * raw Polish at someone who asked for German. */
interface ActiveLanguage {
  language: Language
  dictionary: Dictionary | null
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveLanguage | null>(
    INITIAL_LANGUAGE === 'pl' ? { language: 'pl', dictionary: null } : null,
  )

  useEffect(() => {
    let cancelled = false
    INITIAL_DICTIONARY.then((dictionary) => {
      // Only fills the initial value in. Someone who switched language while
      // this was still downloading has already set a newer one, and their
      // choice must win.
      if (!cancelled) setActive((current) => current ?? { language: INITIAL_LANGUAGE, dictionary })
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (active) document.documentElement.lang = active.language
  }, [active])

  function setLanguage(lang: Language) {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // A rejected write only costs the choice being remembered next visit.
    }
    // The page keeps showing the old language until the new dictionary is in
    // hand, then swaps in one go - no half-translated intermediate state.
    void loadDictionary(lang).then((dictionary) => setActive({ language: lang, dictionary }))
  }

  function t(text: string, ...args: Array<string | number>): string {
    const template = active?.dictionary?.[text] ?? text
    if (args.length === 0) return template
    return template.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? ''))
  }

  // Only reachable on a first visit in a non-Polish language, for the one
  // round trip its dictionary takes: rendering Polish source text and
  // replacing it a moment later would be a worse first impression than a beat
  // of nothing. Polish visitors have no dictionary to wait for.
  if (!active) return null

  return <LanguageContext.Provider value={{ language: active.language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
