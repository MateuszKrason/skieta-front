// Which of our own links a visitor arrived by.
//
// An ad or a post links here with a label on the end
// (?utm_source=facebook&utm_campaign=rolka-kalkulator). The label is kept for
// the length of the visit and sent along when the visitor opens the demo or
// creates an account (accounts.campaigns on the backend), so a campaign can be
// judged by the accounts it brought in rather than by clicks.
//
// It is read from our own link and nothing else - not the referrer, not any
// history - and lives in sessionStorage, so it ends with the tab. That is
// what keeps it outside the need for a consent banner (see lib/analytics).

const STORAGE_KEY = 'skieta.campaign'
const MAX_LENGTH = 80

function clean(value: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '')
}

/** The label a link's query string carries: "source/campaign", or just the
 * source when the link names nothing more. Empty when there is no utm_source. */
export function campaignFromQuery(search: string): string {
  const params = new URLSearchParams(search)
  const source = clean(params.get('utm_source'))
  if (!source) return ''
  const detail = clean(params.get('utm_campaign')) || clean(params.get('utm_medium'))
  return (detail ? `${source}/${detail}` : source).slice(0, MAX_LENGTH)
}

/** Called once when the app starts. The first labelled link of a visit wins:
 * someone who arrives from an ad and later clicks a link in an article is
 * still a visitor the ad brought. */
export function captureCampaign(search: string = window.location.search): void {
  const label = campaignFromQuery(search)
  if (!label) return
  try {
    if (!sessionStorage.getItem(STORAGE_KEY)) sessionStorage.setItem(STORAGE_KEY, label)
  } catch {
    // Blocked site data: the visit simply goes unattributed.
  }
}

export function currentCampaign(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}
