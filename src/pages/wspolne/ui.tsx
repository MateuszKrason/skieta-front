import type { ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatMoney } from '../../lib/format'

export const CARD = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm'
export const PRIMARY =
  'rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-60'
export const SECONDARY =
  'rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60'
export const DANGER =
  'rounded-md border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-60'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs font-normal text-slate-400 dark:text-slate-500">{hint}</p>}
    </label>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-red-600 dark:text-red-400">{children}</p>
}

export function Money({ value, currency, tone }: { value: string | number; currency: string; tone?: 'signed' }) {
  const num = Number(value)
  const text = formatMoney(value, currency)
  if (tone !== 'signed' || num === 0) return <span className="tabular-nums">{text}</span>
  return (
    <span className={`tabular-nums ${num > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
      {num > 0 ? '+' : ''}
      {text}
    </span>
  )
}

/** "dostaje 120 zł" / "oddaje 40 zł" / "rozliczone" for one balance. */
export function NetLabel({ net, currency, me }: { net: string; currency: string; me?: boolean }) {
  const { t } = useLanguage()
  const num = Number(net)
  if (Math.abs(num) < 0.005) {
    return <span className="text-slate-500 dark:text-slate-400">{t('rozliczone')}</span>
  }
  const amount = formatMoney(Math.abs(num), currency)
  if (num > 0) {
    return (
      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
        {me ? t('dostaniesz {0}', amount) : t('dostaje {0}', amount)}
      </span>
    )
  }
  return (
    <span className="font-semibold text-red-700 dark:text-red-400">
      {me ? t('oddajesz {0}', amount) : t('oddaje {0}', amount)}
    </span>
  )
}
