import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'
import type { CryptoSearchResult } from '../types'

export default function CryptoAutocomplete({
  onSelect,
  placeholder,
}: {
  onSelect: (result: CryptoSearchResult) => void
  placeholder?: string
}) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CryptoSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const { data } = await api.get<CryptoSearchResult[]>('/crypto/search/', {
          params: { q: query },
        })
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(result: CryptoSearchResult) {
    onSelect(result)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? t('Szukaj monety (np. Bitcoin, Ethereum)…')}
        className="input"
      />
      {open && (loading || results.length > 0) && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">{t('Szukam…')}</div>}
          {!loading &&
            results.map((r) => (
              <button
                key={r.coingecko_id}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent-50"
              >
                <span>
                  <span className="font-medium">{r.symbol}</span>{' '}
                  <span className="text-slate-500 dark:text-slate-400">{r.name}</span>
                </span>
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500">{t('Brak wyników.')}</div>
          )}
        </div>
      )}
    </div>
  )
}
