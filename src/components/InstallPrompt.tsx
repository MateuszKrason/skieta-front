import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { isDismissalActive, readDismissedAt, writeDismissedAt } from '../lib/installPrompt'

/** Not in lib.dom yet - Chromium-only, and the reason this component exists
 * at all: without capturing the event there is no way to offer installation
 * from inside the app, only the browser's own menu, which nobody opens. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// The browser fires beforeinstallprompt only when the app is genuinely
// installable and not already installed, so its arrival is the gate - there
// is no need to guess at platform or state. Safari never fires it, and gets
// nothing rather than a bar of instructions it would have to read and
// follow; that is a fair trade for not nagging the majority.
export default function InstallPrompt() {
  const { t } = useLanguage()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)

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

  if (!promptEvent) return null

  function dismiss() {
    writeDismissedAt(Date.now())
    setPromptEvent(null)
  }

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
