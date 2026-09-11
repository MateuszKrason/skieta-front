import { describe, expect, it } from 'vitest'
import { supportsDirectCameraCapture } from './cameraCapture'

const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0'
const FIREFOX_TABLET = 'Mozilla/5.0 (Android 14; Tablet; rv:130.0) Gecko/130.0 Firefox/130.0'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
const FIREFOX_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15'
const FIREFOX_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'

describe('supportsDirectCameraCapture', () => {
  it('skips the shortcut in Firefox on Android, where the camera comes up black', () => {
    expect(supportsDirectCameraCapture(FIREFOX_ANDROID)).toBe(false)
    expect(supportsDirectCameraCapture(FIREFOX_TABLET)).toBe(false)
  })

  it('keeps the shortcut in Chrome on Android', () => {
    expect(supportsDirectCameraCapture(CHROME_ANDROID)).toBe(true)
  })

  it('keeps the shortcut on iPhone, including Firefox, which is WebKit there', () => {
    expect(supportsDirectCameraCapture(SAFARI_IOS)).toBe(true)
    expect(supportsDirectCameraCapture(FIREFOX_IOS)).toBe(true)
  })

  it('leaves desktop Firefox alone, where the attribute is ignored anyway', () => {
    expect(supportsDirectCameraCapture(FIREFOX_DESKTOP)).toBe(true)
  })
})
