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
//
// `register_clicked` replaced `access_request_submitted` when registration
// stopped being invite-only: the conversion a public page asks for is now
// "create an account" rather than "leave your address and wait". It carries
// the same `source`, so the per-article comparison survives the change - but
// as a new series, since the two measure different acts and merging them
// would flatter the new one.
type EventName =
  | 'register_clicked'
  | 'invite_nudge_clicked'
  | 'article_login_clicked'
  | 'registered'
  | 'onboarding_completed'
  | 'statement_imported'
  | 'receipt_scanned'
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

// Where the visitor was when they decided to sign up, kept until they finish
// registering so the account itself can be attributed - not just the click.
//
// sessionStorage, not localStorage: this describes one visit. Someone who
// read an article in March and comes back in May to register did not come
// from that article, and a value that outlived the tab would keep saying
// otherwise. It is also why nothing here is ever sent anywhere except along
// with the registration the visitor is deliberately completing.
const SIGNUP_SOURCE_KEY = 'skieta.signupSource'
const SIGNUP_ARTICLE_KEY = 'skieta.signupArticle'

/** Called from the sign-up buttons, next to the analytics event they already
 * fire, so the two always agree about where a conversion started. */
export function rememberSignupSource(source: ConversionSource, article?: string) {
  try {
    sessionStorage.setItem(SIGNUP_SOURCE_KEY, source)
    if (article) {
      sessionStorage.setItem(SIGNUP_ARTICLE_KEY, article)
    } else {
      sessionStorage.removeItem(SIGNUP_ARTICLE_KEY)
    }
  } catch {
    // Blocked site data. The registration still works; it just arrives
    // unattributed, which the admin report counts as 'unknown'.
  }
}

/** Read once, by the registration form. Absent for anyone who went straight
 * to /register, which is a real answer ("came on their own"), not a gap to
 * paper over with a guess. */
export function takeSignupSource(): { signup_source?: string; signup_article?: string } {
  try {
    const source = sessionStorage.getItem(SIGNUP_SOURCE_KEY)
    if (!source) return {}
    const article = sessionStorage.getItem(SIGNUP_ARTICLE_KEY)
    return article ? { signup_source: source, signup_article: article } : { signup_source: source }
  } catch {
    return {}
  }
}
