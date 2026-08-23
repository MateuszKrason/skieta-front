import { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

export type DailyPreset = '7' | '30' | '90' | 'custom'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetDailyRange(preset: DailyPreset): { from: string; to: string } {
  const today = new Date()
  const days = preset === 'custom' ? 30 : Number(preset)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  return { from: isoDate(start), to: isoDate(today) }
}

/** Shared date-range state for the admin panel's daily bar charts (used by
 * both the Users page's "Aktywni użytkownicy dziennie" and the Statystyki
 * page's "Nowe konta dziennie"). Mirrors analysis/shared.tsx's
 * usePeriodRange/PeriodSelector pattern, but with trailing-day presets
 * instead of calendar months - a better fit for "last N days" charts. */
export function useDailyRange(initial: DailyPreset = '30') {
  const [preset, setPreset] = useState<DailyPreset>(initial)
  const [customFrom, setCustomFrom] = useState(() => presetDailyRange(initial).from)
  const [customTo, setCustomTo] = useState(() => presetDailyRange(initial).to)
  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetDailyRange(preset)
  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range }
}

export function DailyRangePicker({
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: ReturnType<typeof useDailyRange>) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          ['7', 'Ostatnie 7 dni'],
          ['30', 'Ostatnie 30 dni'],
          ['90', 'Ostatnie 90 dni'],
          ['custom', 'Zakres własny'],
        ] as [DailyPreset, string][]
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setPreset(key)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            preset === key
              ? 'bg-accent-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {t(label)}
        </button>
      ))}
      {preset === 'custom' && (
        <>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input w-auto" />
          <span className="text-slate-400 dark:text-slate-500">–</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input w-auto" />
        </>
      )}
    </div>
  )
}
