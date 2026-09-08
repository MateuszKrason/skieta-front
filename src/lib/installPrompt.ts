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
