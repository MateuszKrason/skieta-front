import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const SHOWN_AFTER_MS = 5 * 60 * 1000
const DISMISSED_KEY = 'skieta_invite_nudge_dismissed'

/** Speech bubble pointing at the username in the header - nudges an
 * active-for-a-while user to invite friends, since the app is invite-only.
 * Shows once (ever, per browser - see DISMISSED_KEY), closable, and
 * clicking it (not the close button) jumps straight to the invite section
 * on the account page instead of just linking to the page in general. */
export default function InviteNudgeBubble() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return
    const timer = setTimeout(() => setVisible(true), SHOWN_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  function goToInvites() {
    dismiss()
    navigate('/moje-konto#zaproszenia')
  }

  if (!visible) return null

  return (
    // Anchored to the trigger's right edge (not centered under it) so the
    // fixed-width bubble never overflows past the viewport's right edge on
    // narrower desktop widths, where the username sits close to the header's
    // right edge with little room to spare.
    <div className="absolute right-0 top-full z-30 mt-4 w-64 max-w-[calc(100vw-2rem)]">
      {/* Comic-style tail: a solid triangle sitting right at the bubble's
          top edge - not just a subtle rotated-square tooltip arrow. */}
      <div className="absolute -top-[9px] right-8">
        <div className="h-0 w-0 border-x-[10px] border-b-[10px] border-x-transparent border-b-slate-300 dark:border-b-slate-600" />
        <div className="absolute left-1/2 top-[2.5px] h-0 w-0 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-white dark:border-b-slate-800" />
      </div>
      <div className="relative rounded-2xl border border-slate-300 dark:border-slate-600 bg-white p-3.5 text-left shadow-lg dark:bg-slate-800">
        <button
          onClick={dismiss}
          aria-label={t('Zamknij')}
          className="absolute right-2 top-2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          ✕
        </button>
        <button onClick={goToInvites} className="block w-full pr-4 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
          {t(
            'Jeśli podoba Ci się skieta, zaproś znajomych! Mogą dołączyć tylko dzięki Twojemu zaproszeniu ;)',
          )}
        </button>
      </div>
    </div>
  )
}
