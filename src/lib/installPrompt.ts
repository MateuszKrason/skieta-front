// "Add to home screen" is worth offering once and then leaving alone. A
// banner that comes back on every visit after being dismissed is the reason
// people learn to ignore banners, so a dismissal is remembered - but not
// forever, because someone who said "not now" in their first week may well
// mean "yes" once the app has proved useful.
const DISMISSED_KEY = 'skieta.installPromptDismissedAt'
export const DISMISSAL_DAYS = 60

/** Exported for its own sake: the storage read/write are untestable side
 * effects, this is the actual decision. */
export function isDismissalActive(dismissedAt: number | null, now: number): boolean {
  if (dismissedAt === null) return false
  // A timestamp in the future means a clock change or a tampered value, not a
  // dismissal 60 days from now - treat it as no dismissal at all rather than
  // hiding the prompt until the date catches up.
  if (dismissedAt > now) return false
  return now - dismissedAt < DISMISSAL_DAYS * 24 * 60 * 60 * 1000
}

export function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    // Private browsing or blocked site data - the prompt just won't remember
    // being dismissed, which is a far smaller problem than throwing here.
    return null
  }
}

export function writeDismissedAt(now: number) {
  try {
    localStorage.setItem(DISMISSED_KEY, String(now))
  } catch {
    // See above.
  }
}

/** Browsers embedded inside another app. They open links from posts and
 * messages - the whole Facebook campaign lands in one - and none of them can
 * add a page to the home screen, so telling their users how would be telling
 * them to do something their screen does not offer. */
const IN_APP_BROWSER = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|LinkedInApp|TikTok|musical_ly|Snapchat|Twitter/i

export interface BrowserEnvironment {
  userAgent: string
  platform: string
  maxTouchPoints: number
  /** Already opened from the home screen - nothing left to offer. */
  standalone: boolean
}

/** Safari never fires beforeinstallprompt, so on an iPhone the app cannot
 * offer installation itself - only explain the two taps that do it. This
 * decides whether that explanation applies here at all. */
export function canAddToIosHomeScreen(env: BrowserEnvironment): boolean {
  if (env.standalone) return false
  // iPadOS asks for desktop sites by default and reports itself as a Mac;
  // the touch screen is what gives it away.
  const isIos = /iPhone|iPad|iPod/.test(env.userAgent) || (env.platform === 'MacIntel' && env.maxTouchPoints > 1)
  if (!isIos) return false
  return !IN_APP_BROWSER.test(env.userAgent)
}
