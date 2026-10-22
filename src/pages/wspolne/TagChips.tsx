import { useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Tag } from '../../types'

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30

function clean(raw: string) {
  return raw.trim().replace(/^#+/, '').trim().slice(0, MAX_TAG_LENGTH)
}

const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase()

/** The tags of one shared expense, picked the way the budget's own forms
 * pick them: every tag already in use - in this event or in the person's
 * budget - is a chip to tap, and a new one is typed into a small field
 * beside them. Deliberately not inside a <label>: on a phone a tap inside a
 * label focuses its input first, the keyboard jumps up and the tap lands on
 * whatever slid under the finger. */
export default function TagChips({
  value,
  onChange,
  groupTags,
}: {
  value: string[]
  onChange: (next: string[]) => void
  groupTags: string[]
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState('')
  const { data: budgetTags } = useQuery({
    queryKey: ['budget-tags'],
    queryFn: async () => (await api.get<Tag[]>('/budget/tags/')).data,
    staleTime: 5 * 60 * 1000,
  })

  const available: string[] = []
  for (const name of [...value, ...groupTags, ...(budgetTags ?? []).map((tag) => tag.name)]) {
    if (name && !available.some((x) => same(x, name))) available.push(name)
  }
  const full = value.length >= MAX_TAGS

  function toggle(name: string) {
    if (value.some((x) => same(x, name))) onChange(value.filter((x) => !same(x, name)))
    else if (!full) onChange([...value, name])
  }

  function addDraft() {
    const name = clean(draft)
    setDraft('')
    if (!name || full || value.some((x) => same(x, name))) return
    const existing = available.find((x) => same(x, name))
    onChange([...value, existing ?? name])
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addDraft()
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('Tagi (opcjonalnie)')}</p>
      {available.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {available.map((name) => {
            const on = value.some((x) => same(x, name))
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => toggle(name)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 sm:py-1 ${
                  on
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {on ? '✓ ' : ''}#{name}
              </button>
            )
          })}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          className="input min-w-0 flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={available.length ? t('Nowy tag') : t('np. jedzenie')}
          maxLength={MAX_TAG_LENGTH + 1}
          enterKeyHint="done"
          aria-label={t('Nowy tag')}
          disabled={full}
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={full || !clean(draft)}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {t('Dodaj')}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {full
          ? t('To już {0} tagów - więcej się nie zmieści.', String(MAX_TAGS))
          : t('Dotknij tagu, żeby go dodać albo zdjąć. Tagi z Twojego budżetu też tu są.')}
      </p>
    </div>
  )
}
