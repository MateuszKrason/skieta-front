// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { campaignFromQuery, captureCampaign, currentCampaign } from './campaign'

describe('campaignFromQuery', () => {
  it('joins the source and the campaign into one label', () => {
    expect(campaignFromQuery('?utm_source=facebook&utm_medium=cpc&utm_campaign=rolka-kalkulator')).toBe('facebook/rolka-kalkulator')
  })

  it('falls back to the medium, then to the source alone', () => {
    expect(campaignFromQuery('?utm_source=google&utm_medium=cpc')).toBe('google/cpc')
    expect(campaignFromQuery('?utm_source=wykop')).toBe('wykop')
  })

  it('is empty without a source, whatever else the link carries', () => {
    expect(campaignFromQuery('')).toBe('')
    expect(campaignFromQuery('?utm_campaign=start&ref=abc')).toBe('')
  })

  it('keeps only what a label is made of', () => {
    expect(campaignFromQuery('?utm_source=Face Book&utm_campaign=<b>Start</b>')).toBe('face-book/b-start-/b')
    expect(campaignFromQuery(`?utm_source=${'a'.repeat(200)}`).length).toBe(80)
  })
})

describe('captureCampaign', () => {
  beforeEach(() => sessionStorage.clear())

  it('remembers the label for the rest of the visit', () => {
    captureCampaign('?utm_source=wykop&utm_campaign=start')

    expect(currentCampaign()).toBe('wykop/start')
  })

  it('keeps the first labelled link of a visit', () => {
    captureCampaign('?utm_source=google&utm_campaign=pit-38')
    captureCampaign('?utm_source=facebook&utm_campaign=rolka')

    expect(currentCampaign()).toBe('google/pit-38')
  })

  it('leaves an unlabelled visit unlabelled', () => {
    captureCampaign('?page=2')

    expect(currentCampaign()).toBe('')
  })
})
