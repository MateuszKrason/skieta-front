import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearUserScopedStorage,
  LAST_ACCOUNT_KEY_PREFIX,
  LAST_CATEGORY_KEY_PREFIX,
} from './userScopedStorage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('clearUserScopedStorage', () => {
  it('forgets the ids that belonged to whoever was signed in', () => {
    localStorage.setItem(`${LAST_ACCOUNT_KEY_PREFIX}expense`, '12')
    localStorage.setItem(`${LAST_CATEGORY_KEY_PREFIX}expense`, '34')
    localStorage.setItem(`${LAST_CATEGORY_KEY_PREFIX}income`, '56')

    clearUserScopedStorage()

    expect(localStorage.getItem(`${LAST_ACCOUNT_KEY_PREFIX}expense`)).toBeNull()
    expect(localStorage.getItem(`${LAST_CATEGORY_KEY_PREFIX}expense`)).toBeNull()
    expect(localStorage.getItem(`${LAST_CATEGORY_KEY_PREFIX}income`)).toBeNull()
  })

  it('leaves settings that belong to the device alone', () => {
    // Signing out is not a factory reset: the next person to use this
    // browser should still get the theme and language it was set to, and
    // the same person signing back in should not have to redo them.
    localStorage.setItem('myfaj_theme', 'dark')
    localStorage.setItem('myfaj_language', 'en')
    localStorage.setItem('myfaj_collapsed_account_types', '["savings"]')
    localStorage.setItem('skieta.installPromptDismissedAt', '1700000000000')

    clearUserScopedStorage()

    expect(localStorage.getItem('myfaj_theme')).toBe('dark')
    expect(localStorage.getItem('myfaj_language')).toBe('en')
    expect(localStorage.getItem('myfaj_collapsed_account_types')).toBe('["savings"]')
    expect(localStorage.getItem('skieta.installPromptDismissedAt')).toBe('1700000000000')
  })

  it('survives storage being blocked entirely', () => {
    // Private browsing and "block site data" make even reading throw. A
    // sign-out must still complete - there was nothing stored to leak.
    vi.spyOn(Object, 'keys').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => clearUserScopedStorage()).not.toThrow()
  })
})
