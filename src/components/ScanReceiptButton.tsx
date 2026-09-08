import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenStore } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import type { ParsedReceipt } from '../types'

/** Where a scan started outside the expenses page lands. Wydatki reads this
 * off the router state on arrival and then clears it, so a refresh or a back
 * navigation doesn't re-open the form with a receipt the user already saved
 * (or already dismissed). */
export type ReceiptScanNavState = {
  receipt?: ParsedReceipt
  needsGeminiKey?: boolean
  scanError?: string
}

export const RECEIPT_SCAN_TARGET = '/budzet/wydatki'

// Deliberately its own module rather than part of pages/analysis/shared.tsx,
// where this used to live: the header (components/Layout) renders on every
// authenticated page and is NOT lazy-loaded, so importing from shared.tsx
// would pull recharts and the whole analysis page set into the bundle every
// visitor downloads on first paint.
//
// Calls /receipt-scan, a Netlify edge function (not the Django API - see
// netlify/edge-functions/receipt-scan.ts) that reads the photo with the
// user's own Gemini key and returns a proposed transaction. Reports the
// result through callbacks rather than opening a form itself, so the caller
// decides where the parsed values land (AddTransactionForm's initialValues)
// and how to surface an error - this component only knows how to take a
// photo and ask.
export function ScanReceiptButton({
  onParsed,
  onNeedsGeminiKey,
  onError,
  className,
  label,
  dataTour,
}: {
  onParsed: (result: ParsedReceipt) => void
  onNeedsGeminiKey: () => void
  onError: (message: string) => void
  /** Overrides the default outline-button styling - the header and the
   * dashboard card each need this to sit with their own neighbours. */
  className?: string
  label?: string
  dataTour?: string
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Read off the profile that /auth/me/ already returns - see
  // ProfileSerializer.has_gemini_api_key for why this doesn't ask the
  // dedicated key endpoint.
  const hasKey = user?.profile.has_gemini_api_key ?? true

  // Without a key there is nothing a photo could be read with, so don't ask
  // for one: picking a file, waiting for the upload and only then being told
  // to go set something up wastes the effort and reads as a failure. The
  // instructions come first instead, and the picker opens on the next click,
  // once the key is in place.
  function onClick() {
    if (!hasKey) {
      onNeedsGeminiKey()
      return
    }
    inputRef.current?.click()
  }

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Lets the same file be picked again right after a failed scan, instead
    // of the input silently ignoring an unchanged selection.
    e.target.value = ''
    if (!file) return

    setScanning(true)
    try {
      const form = new FormData()
      form.append('photo', file)
      const token = tokenStore.getAccess()
      const response = await fetch('/receipt-scan', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.error === 'no_gemini_key') {
          onNeedsGeminiKey()
        } else {
          onError(data.detail ?? t('Nie udało się odczytać paragonu.'))
        }
        return
      }
      trackEvent('receipt_scanned')
      onParsed(data as ParsedReceipt)
    } catch {
      onError(t('Nie udało się odczytać paragonu - sprawdź połączenie i spróbuj ponownie.'))
    } finally {
      setScanning(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={scanning}
        data-tour={dataTour}
        title={t('Zalecamy robić zdjęcie paragonu od razu telefonem - Gemini odczytuje je najlepiej.')}
        className={
          className ??
          'rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60'
        }
      >
        {scanning ? t('Odczytywanie…') : (label ?? t('📷 Wgraj paragon'))}
      </button>
      {/* capture="environment" opens the camera directly on a phone; on
          desktop it's ignored and this is a plain file picker. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelected}
        className="hidden"
      />
    </>
  )
}

/** The same button for places that have nowhere to show a result themselves -
 * the header and the dashboard. All three outcomes (parsed, no key, error)
 * end up on the expenses page, which already knows how to render each one,
 * so wherever a scan is started from, it finishes in the same place: looking
 * at the transaction it just created. */
export function ScanReceiptNavButton({
  className,
  label,
  dataTour,
  onStateChange,
}: {
  className?: string
  label?: string
  dataTour?: string
  /** Lets a caller close its own menu once the scan is on its way - the
   * mobile nav needs this or it stays open over the destination page. */
  onStateChange?: () => void
}) {
  const navigate = useNavigate()

  function go(state: ReceiptScanNavState) {
    onStateChange?.()
    navigate(RECEIPT_SCAN_TARGET, { state })
  }

  return (
    <ScanReceiptButton
      className={className}
      label={label}
      dataTour={dataTour}
      onParsed={(receipt) => go({ receipt })}
      onNeedsGeminiKey={() => go({ needsGeminiKey: true })}
      onError={(scanError) => go({ scanError })}
    />
  )
}
