import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { en } from './dictionary'

export type Language = 'pl' | 'en'

const STORAGE_KEY = 'myfaj_language'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (text: string, ...args: Array<string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function readInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'pl'
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

  function toggleLanguage() {
    setLanguage(language === 'pl' ? 'en' : 'pl')
  }

  function t(text: string, ...args: Array<string | number>): string {
    const template = language === 'en' ? (en[text] ?? text) : text
    if (args.length === 0) return template
    return template.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? ''))
  }

  return <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
