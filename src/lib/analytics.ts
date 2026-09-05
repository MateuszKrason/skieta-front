// Analytics that needs no consent banner.
//
// The transport used to be Google Analytics, loaded unconditionally in
// index.html before the page had even rendered. GA sets its own cookies and
// processes personal data, which under ePrivacy (in Poland: Prawo komunikacji
// elektronicznej) needs the visitor's consent *before* the script runs - so
// that setup meant either a consent banner in front of every visitor or a
// standing compliance problem, and a banner costs conversions on a landing
// page whose whole job is conversion.
//
// The way out is not to need consent: a provider that sets no cookies, stores
// nothing on the visitor's device and keeps no cross-site identifiers needs no
// banner. Umami and Plausible both work that way and both count what actually
// matters here - visits, sources, and a handful of funnel events. Only the
// transport changed; what is measured, and the promise that no event ever
// carries personal data, are the same as before.
//
// Nothing loads unless VITE_ANALYTICS_SRC and VITE_ANALYTICS_SITE are set, so
// local development and any build without them measure nothing at all.

type Provider = 'umami' | 'plausible'

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void }
    plausible?: (name: string, options?: { props?: Record<string, unknown> }) => void
  }
}

const PROVIDER = (import.meta.env.VITE_ANALYTICS_PROVIDER ?? 'umami') as Provider
const SRC = import.meta.env.VITE_ANALYTICS_SRC as string | undefined
const SITE = import.meta.env.VITE_ANALYTICS_SITE as string | undefined

const configured = Boolean(SRC && SITE)

// Event names are stable identifiers, not UI copy: renaming one splits its
// history in the dashboard into two unrelated series, so treat them as fixed.
//
// The first three answer the campaign question - an article that attracts
// readers versus one that attracts users. The rest are the funnel: whether
// people who get in actually finish setting up, put real data in, and can get
// it back out.
type EventName =
  | 'access_request_submitted'
  | 'invite_nudge_clicked'
  | 'article_login_clicked'
  | 'registered'
  | 'onboarding_completed'
  | 'statement_imported'
  | 'data_exported'

/** Where a conversion came from, so articles can be compared against the
 * landing page and against each other. */
export type ConversionSource = 'landing_hero' | 'landing_faq' | 'article' | 'calculator'

type EventParams = {
  source?: ConversionSource
  /** Which article produced it - a slug, never anything user-specific. */
  article?: string
  /** What surfaced the invite nudge: a real gain, or a login streak. */
  trigger?: 'moment' | 'streak'
  /** Which export was taken: the full copy or one of the CSV tables. */
  dataset?: string
}

export function initAnalytics() {
  if (!configured || document.querySelector('script[data-skieta-analytics]')) return

  const script = document.createElement('script')
  script.defer = true
  script.src = SRC as string
  script.dataset.skietaAnalytics = PROVIDER
  // Both providers read their site identifier off the script tag, they just
  // spell the attribute differently.
  if (PROVIDER === 'plausible') {
    script.dataset.domain = SITE as string
  } else {
    script.dataset.websiteId = SITE as string
  }
  document.head.appendChild(script)
}

export function trackEvent(name: EventName, params: EventParams = {}) {
  // The global is absent whenever the script didn't load - unconfigured build,
  // an ad blocker, an offline dev run. Measurement is never worth breaking a
  // form submission over, so this stays a no-op rather than throwing.
  if (!configured) return
  try {
    if (PROVIDER === 'plausible') {
      window.plausible?.(name, Object.keys(params).length ? { props: params } : undefined)
    } else {
      window.umami?.track(name, params)
    }
  } catch {
    // Analytics must never take a user flow down with it.
  }
}
