// Google Analytics is loaded for page views only (see public/gtag-init.js), so
// the campaign could show how many people read an article but not whether any
// of them asked for access - which is the only number that separates an
// article that attracts readers from one that attracts users.
//
// Nothing here ever carries personal data. The access-request form knows the
// visitor's email address; only the source of the conversion is reported.

type EventName = 'access_request_submitted' | 'invite_nudge_clicked' | 'article_login_clicked'

/** Where a conversion came from, so articles can be compared against the
 * landing page and against each other. */
export type ConversionSource = 'landing_hero' | 'landing_faq' | 'article'

type EventParams = {
  source?: ConversionSource
  /** Which article produced it - a slug, never anything user-specific. */
  article?: string
  /** What surfaced the invite nudge: a real gain, or a login streak. */
  trigger?: 'moment' | 'streak'
}

export function trackEvent(name: EventName, params: EventParams = {}) {
  // gtag is absent whenever the script didn't load - an ad blocker, an offline
  // dev run, a privacy-focused browser. Measurement is never worth breaking a
  // form submission over, so this stays a no-op rather than throwing.
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  try {
    gtag('event', name, params)
  } catch {
    // Analytics must never take a user flow down with it.
  }
}
