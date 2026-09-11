import { describe, expect, it } from 'vitest'
import { canAddToIosHomeScreen, DISMISSAL_DAYS, isDismissalActive, type BrowserEnvironment } from './installPrompt'

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

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
const IPHONE_FACEBOOK =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.40.108;FBBV/0;FBDV/iPhone15,2]'
const IPHONE_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0'
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

function env(overrides: Partial<BrowserEnvironment>): BrowserEnvironment {
  return { userAgent: IPHONE_SAFARI, platform: 'iPhone', maxTouchPoints: 5, standalone: false, ...overrides }
}

describe('canAddToIosHomeScreen', () => {
  it('explains the two taps in Safari on an iPhone', () => {
    expect(canAddToIosHomeScreen(env({}))).toBe(true)
  })

  it('stays quiet once the app is already on the home screen', () => {
    expect(canAddToIosHomeScreen(env({ standalone: true }))).toBe(false)
  })

  it('stays quiet inside the Facebook and Instagram apps, which cannot add to the home screen', () => {
    // Where the campaign's own posts open - the one place the hint would be
    // an instruction nobody can follow.
    expect(canAddToIosHomeScreen(env({ userAgent: IPHONE_FACEBOOK }))).toBe(false)
    expect(canAddToIosHomeScreen(env({ userAgent: IPHONE_INSTAGRAM }))).toBe(false)
  })

  it('recognises an iPad that reports itself as a Mac', () => {
    expect(canAddToIosHomeScreen(env({ userAgent: IPAD_AS_MAC, platform: 'MacIntel', maxTouchPoints: 5 }))).toBe(true)
  })

  it('leaves a real Mac alone', () => {
    expect(canAddToIosHomeScreen(env({ userAgent: IPAD_AS_MAC, platform: 'MacIntel', maxTouchPoints: 0 }))).toBe(false)
  })

  it('leaves Android to the browser prompt it already has', () => {
    expect(canAddToIosHomeScreen(env({ userAgent: ANDROID_CHROME, platform: 'Linux armv8l' }))).toBe(false)
  })
})
