import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../i18n/LanguageContext'

// Unlike StockAutocomplete (search → pick → clear), this stays a plain free-
// text field the whole time — suggestions are just a convenience, any typed
// name is accepted and kept as the value.
export default function BankNameAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  required,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}) {
  const { t } = useLanguage()
  const [results, setResults] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        const { data } = await api.get<string[]>('/banking/banks/', { params: { q: value } })
        setResults(data)
      } catch {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(handle)
  }, [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(name: string) {
    onChange(name)
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? t('np. mBank')}
        className={className ?? 'input'}
        autoComplete="off"
        required={required}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelect(name)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
