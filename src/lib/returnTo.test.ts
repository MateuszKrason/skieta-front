import { beforeEach, describe, expect, it } from 'vitest'
import { rememberReturnTo, takeReturnTo } from './returnTo'

describe('returnTo', () => {
  beforeEach(() => sessionStorage.clear())

  it('hands the remembered path back once', () => {
    rememberReturnTo('/wspolne/abc')
    expect(takeReturnTo()).toBe('/wspolne/abc')
    expect(takeReturnTo()).toBeNull()
  })

  it('never remembers another site', () => {
    rememberReturnTo('https://example.com/')
    rememberReturnTo('//example.com/')
    expect(takeReturnTo()).toBeNull()
  })
})
