import { describe, expect, it } from 'vitest'
import { DISMISSAL_DAYS, isDismissalActive } from './installPrompt'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 8, 8)

describe('isDismissalActive', () => {
  it('offers the prompt when it has never been dismissed', () => {
    expect(isDismissalActive(null, NOW)).toBe(false)
  })

  it('stays quiet for the whole dismissal window', () => {
    expect(isDismissalActive(NOW - DAY, NOW)).toBe(true)
    expect(isDismissalActive(NOW - (DISMISSAL_DAYS - 1) * DAY, NOW)).toBe(true)
  })

  it('offers again once the window has passed', () => {
    // Someone who said "not now" in their first week may well mean yes once
    // the app has proved useful.
    expect(isDismissalActive(NOW - DISMISSAL_DAYS * DAY, NOW)).toBe(false)
    expect(isDismissalActive(NOW - 365 * DAY, NOW)).toBe(false)
  })

  it('ignores a timestamp from the future instead of hiding until it passes', () => {
    // A clock change or a hand-edited value, not a dismissal 60 days from now.
    expect(isDismissalActive(NOW + 365 * DAY, NOW)).toBe(false)
  })
})
