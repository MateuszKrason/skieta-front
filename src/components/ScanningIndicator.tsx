import { useLanguage } from '../i18n/LanguageContext'
import { useIsScanInFlight } from '../lib/scanStatus'
import { Spinner } from './Loader'

// Mounted once in Layout, next to FeedbackWidget - shows whenever a receipt
// scan is in flight, regardless of which button started it (header,
// dashboard or Wydatki's own). Gemini's vision call can take up to half a
// minute (see GEMINI_TIMEOUT_MS in netlify/edge-functions/receipt-scan.ts),
// which is a long wait to leave unexplained behind a button whose label
// just quietly changes to "Odczytywanie…".
export default function ScanningIndicator() {
  const { t } = useLanguage()
  const scanning = useIsScanInFlight()

  if (!scanning) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-lg"
    >
      <Spinner size="md" />
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {t('Analizuję zdjęcie paragonu…')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('To może potrwać do pół minuty.')}</p>
      </div>
    </div>
  )
}
