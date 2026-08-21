import { useLanguage } from '../i18n/LanguageContext'

const SPINNER_SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const

export function Spinner({ size = 'md', className = '' }: { size?: keyof typeof SPINNER_SIZES; className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block animate-spin rounded-full border-slate-200 dark:border-slate-700 border-t-accent-600 dark:border-t-accent-500 ${SPINNER_SIZES[size]} ${className}`}
    />
  )
}

// Whole-page/whole-section placeholder — swap in for the entire content area
// while its first query is still in flight, so a slow response reads as
// "loading" instead of "empty".
export function PageLoader({ label }: { label?: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{label ?? t('Ładowanie…')}</p>
    </div>
  )
}

// Same idea but sized for a single card/chart slot instead of a full page.
export function CardLoader({ label }: { label?: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400 dark:text-slate-500">
      <Spinner size="md" />
      <p className="text-xs">{label ?? t('Ładowanie…')}</p>
    </div>
  )
}
