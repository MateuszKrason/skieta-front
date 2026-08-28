import { useLanguage } from '../i18n/LanguageContext'

export function LoadMoreButton({
  onClick,
  loading,
  visible,
}: {
  onClick: () => void
  loading: boolean
  visible: boolean
}) {
  const { t } = useLanguage()
  if (!visible) return null
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-3 w-full rounded-md border border-slate-200 dark:border-slate-700 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60"
    >
      {loading ? t('Ładowanie…') : t('Załaduj więcej')}
    </button>
  )
}
