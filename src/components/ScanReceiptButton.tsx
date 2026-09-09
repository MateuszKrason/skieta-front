import { useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tokenStore } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { useDismissableMenu } from '../lib/useDismissableMenu'
import { setScanInFlight } from '../lib/scanStatus'
import type { ParsedReceipt } from '../types'

/** Where a scan (or a manual add) started outside the expenses page lands.
 * Wydatki reads this off the router state on arrival and then clears it, so
 * a refresh or a back navigation doesn't re-open the form with a receipt
 * that was already saved (or already dismissed), or re-open a blank form
 * the user had already closed. */
export type ReceiptScanNavState = {
  receipt?: ParsedReceipt
  needsGeminiKey?: boolean
  scanError?: string
  openManualAdd?: boolean
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
  split = false,
  categoryNames,
}: {
  onParsed: (result: ParsedReceipt) => void
  onNeedsGeminiKey: () => void
  onError: (message: string) => void
  /** Overrides the default outline-button styling - the header and the
   * dashboard card each need this to sit with their own neighbours. */
  className?: string
  label?: string
  dataTour?: string
  /** Ask for a reading product by product rather than one amount for the
   * whole receipt. Costs a request against the stronger model's much
   * smaller daily allowance, so it is opt-in per scan, never the default. */
  split?: boolean
  /** The few categories the user said this receipt is likely to fall into.
   * Narrowing the list Gemini chooses from raises the odds of a sensible
   * assignment; left out, the edge function uses every expense category. */
  categoryNames?: string[]
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // The menu's `left`, in pixels, relative to the wrapper it's positioned
  // against - computed fresh on every open (see onTriggerClick) rather than
  // fixed at left-0, because this button sits in wildly different spots: a
  // wide desktop header, a cramped mobile burger row, a dashboard card. A
  // fixed alignment overflows the viewport in at least one of those (a
  // 224px-wide menu anchored left-0 on a button near the right edge of a
  // 375px phone screen runs 66px past it).
  const [menuLeft, setMenuLeft] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useDismissableMenu<HTMLDivElement>(menuOpen, () => setMenuOpen(false))
  // Read off the profile that /auth/me/ already returns - see
  // ProfileSerializer.has_gemini_api_key for why this doesn't ask the
  // dedicated key endpoint.
  const hasKey = user?.profile.has_gemini_api_key ?? true

  // Without a key there is nothing a photo could be read with, so don't ask
  // for one: picking a file, waiting for the upload and only then being told
  // to go set something up wastes the effort and reads as a failure. The
  // instructions come first instead, and the picker opens on the next click,
  // once the key is in place.
  function onTriggerClick() {
    if (!hasKey) {
      onNeedsGeminiKey()
      return
    }
    if (!menuOpen && triggerRef.current) {
      const MENU_WIDTH = 224 // matches the menu's w-56
      const EDGE_PADDING = 8
      const buttonLeft = triggerRef.current.getBoundingClientRect().left
      const maxLeft = window.innerWidth - EDGE_PADDING - MENU_WIDTH
      // Clamped to both edges: the button's own position is the natural
      // (left-aligned) choice, pulled leftward if that would run off the
      // right of the screen, and never pushed past 0 on the left in turn.
      setMenuLeft(Math.max(EDGE_PADDING, Math.min(buttonLeft, maxLeft)) - buttonLeft)
    }
    setMenuOpen((v) => !v)
  }

  // Two separate inputs rather than one: a file input's capture="environment"
  // attribute is only a hint, and on Android Chrome in particular it is
  // often taken as an instruction to skip the chooser and open the camera
  // app directly, with no way back to a gallery photo from there. A user
  // photographing a fresh receipt still gets straight to the camera in one
  // tap; a user who already has the photo (an emailed e-receipt screenshot,
  // one taken earlier) gets an equally direct route to their gallery instead
  // of hoping the OS offers it.
  function pick(source: 'camera' | 'gallery') {
    setMenuOpen(false)
    const target = source === 'camera' ? cameraInputRef : galleryInputRef
    target.current?.click()
  }

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Lets the same file be picked again right after a failed scan, instead
    // of the input silently ignoring an unchanged selection.
    e.target.value = ''
    if (!file) return

    setScanning(true)
    setScanInFlight(true)
    try {
      const form = new FormData()
      form.append('photo', file)
      if (split) form.append('split', '1')
      if (categoryNames && categoryNames.length > 0) {
        form.append('categories', JSON.stringify(categoryNames))
      }
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
      setScanInFlight(false)
    }
  }

  const buttonClass =
    className ??
    'rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60'

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={onTriggerClick}
        disabled={scanning}
        data-tour={dataTour}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={t('Zalecamy robić zdjęcie paragonu od razu telefonem - Gemini odczytuje je najlepiej.')}
        className={buttonClass}
      >
        {scanning ? t('Odczytywanie…') : (label ?? t('📷 Wgraj paragon'))}
      </button>
      {menuOpen && (
        <div
          role="menu"
          style={{ left: menuLeft }}
          className="absolute z-30 mt-1 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick('camera')}
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('📷 Zrób zdjęcie')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => pick('gallery')}
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('🖼️ Wybierz z galerii')}
          </button>
        </div>
      )}
      {/* capture="environment" opens the camera app directly on a phone; on
          desktop it's ignored and this is a plain file picker, same as the
          one below it. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelected}
        className="hidden"
      />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
    </div>
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

/** A quiet, secondary way in next to the scan button, for places (the
 * dashboard) that only ever offered the camera - typing an expense in by
 * hand is still the more familiar path for a lot of people, and it
 * shouldn't take a trip to the budget section to find it. Deliberately a
 * plain text link rather than a second button: the scan button is the
 * point of this row, and a same-weight neighbour would compete with it
 * instead of reading as the fallback it is. */
export function AddExpenseManuallyLink({ className }: { className?: string }) {
  const { t } = useLanguage()
  const navState: ReceiptScanNavState = { openManualAdd: true }
  return (
    <Link
      to={RECEIPT_SCAN_TARGET}
      state={navState}
      className={
        className ??
        'text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-accent-700 dark:hover:text-accent-400 hover:underline'
      }
    >
      {t('lub dodaj ręcznie')}
    </Link>
  )
}
