import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import {
  canAddToIosHomeScreen,
  isDismissalActive,
  readDismissedAt,
  writeDismissedAt,
  type BrowserEnvironment,
} from '../lib/installPrompt'

/** Not in lib.dom yet - Chromium-only, and the reason this component exists
 * at all: without capturing the event there is no way to offer installation
 * from inside the app, only the browser's own menu, which nobody opens. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readBrowserEnvironment(): BrowserEnvironment {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    standalone:
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches,
  }
}

function shouldShowIosSteps(): boolean {
  try {
    return canAddToIosHomeScreen(readBrowserEnvironment()) && !isDismissalActive(readDismissedAt(), Date.now())
  } catch {
    // A browser without matchMedia or navigator details simply gets no hint.
    return false
  }
}

// The browser fires beforeinstallprompt only when the app is genuinely
// installable and not already installed, so its arrival is the gate - there
// is no need to guess at platform or state.
//
// Safari never fires it. Leaving iPhones with nothing used to look like the
// quieter choice, but it meant nobody on an iPhone ever learned the app could
// live on their home screen at all - and with no Android device there is no
// way into Google Play either, so for iPhone users these two taps are the
// only "install" skieta has. They get the same bar and the same 60-day
// dismissal, with the steps in place of a button the platform does not allow.
export default function InstallPrompt() {
  const { t } = useLanguage()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  // Lazy initialiser: decided once when the bar mounts, nothing to sync later.
  const [showIosSteps, setShowIosSteps] = useState(shouldShowIosSteps)

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // Suppress Chrome's own mini-infobar so the offer appears where the
      // rest of the app's interface is, in the app's own language.
      event.preventDefault()
      if (isDismissalActive(readDismissedAt(), Date.now())) return
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  function dismiss() {
    writeDismissedAt(Date.now())
    setPromptEvent(null)
    setShowIosSteps(false)
  }

  if (!promptEvent && showIosSteps) {
    return (
      <div className="border-b border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          {/* The glyph Safari itself uses for Share - easier to find on the
              screen than a word most people have never read on that button. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-accent-700 dark:text-accent-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 15V3" />
            <path d="M8 7l4-4 4 4" />
            <path d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H17" />
          </svg>
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
            {t(
              'Dodaj skietę do ekranu początkowego: stuknij Udostępnij (w nowszym Safari pod przyciskiem ⋯), a potem „Do ekranu początkowego". Otworzysz ją jak zwykłą aplikację.',
            )}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('Nie teraz')}
            className="rounded-md px-2 py-1 text-sm text-slate-500 dark:text-slate-400 hover:bg-accent-100 dark:hover:bg-accent-900/50"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  if (!promptEvent) return null

  async function install() {
    const event = promptEvent
    if (!event) return
    // The captured event is single-use: whichever way the user answers, it
    // cannot be shown again, so the bar goes either way.
    setPromptEvent(null)
    await event.prompt()
    const { outcome } = await event.userChoice
    // Declining in the browser's own dialog is still a "not now", and
    // deserves the same quiet period as dismissing the bar.
    if (outcome === 'dismissed') writeDismissedAt(Date.now())
  }

  return (
    <div className="border-b border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5">
        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
          {t('Dodaj skietę do ekranu głównego - paragon wrzucisz wtedy jednym tapnięciem, bez szukania adresu w przeglądarce.')}
        </p>
        <button
          type="button"
          onClick={install}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700"
        >
          {t('Zainstaluj')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('Nie teraz')}
          className="rounded-md px-2 py-1 text-sm text-slate-500 dark:text-slate-400 hover:bg-accent-100 dark:hover:bg-accent-900/50"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
