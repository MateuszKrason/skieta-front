import { afterEach, describe, expect, it, vi } from 'vitest'
import { rememberSignupSource, takeSignupSource } from './analytics'

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('signup source attribution', () => {
  it('carries the article slug through to the registration payload', () => {
    rememberSignupSource('article', 'jak-oszczedzac')
    expect(takeSignupSource()).toEqual({
      signup_source: 'article',
      signup_article: 'jak-oszczedzac',
    })
  })

  it('drops a stale slug when the next click came from somewhere else', () => {
    // Read an article, went back to the home page, signed up from there.
    // The article did not convert them and must not be credited as if it had.
    rememberSignupSource('article', 'jak-oszczedzac')
    rememberSignupSource('landing_hero')
    expect(takeSignupSource()).toEqual({ signup_source: 'landing_hero' })
  })

  it('reports nothing for someone who went straight to the form', () => {
    expect(takeSignupSource()).toEqual({})
  })

  it('never breaks registration when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => rememberSignupSource('article', 'x')).not.toThrow()
    expect(takeSignupSource()).toEqual({})
  })
})
