import { describe, expect, it } from 'vitest'
import { afterBelkaTax, formatMoney, formatNumber, formatPct } from './format'

// afterBelkaTax is the one calculation in this file with real money and
// real legal consequences riding on it: it decides the after-tax figure
// shown for every gain, dividend and interest payment in the app, and - since
// /kalkulator went public - the same number a logged-out visitor sees before
// they've ever created an account. A silent sign or bracket error here is a
// wrong number shown as fact, not a crash anyone would notice.
describe('afterBelkaTax', () => {
  it('applies the flat 19% Belka rate for Poland (blank/undefined residency)', () => {
    expect(afterBelkaTax(1000)).toBeCloseTo(810)
    expect(afterBelkaTax(1000, '')).toBeCloseTo(810)
    expect(afterBelkaTax(1000, null)).toBeCloseTo(810)
  })

  it('falls back to the Polish rate for a residency country with no rule of its own', () => {
    expect(afterBelkaTax(1000, 'FR')).toBeCloseTo(810)
  })

  it('passes losses and zero through unchanged, for every country', () => {
    expect(afterBelkaTax(0, 'PL')).toBe(0)
    expect(afterBelkaTax(-500, 'DE')).toBe(-500)
    expect(afterBelkaTax(-500, 'ES')).toBe(-500)
  })

  it('Germany: below the Sparer-Pauschbetrag allowance, nothing is taxed', () => {
    expect(afterBelkaTax(800, 'DE')).toBe(800)
    // Exactly at the allowance: taxable amount is 0, not negative-but-taxed.
    expect(afterBelkaTax(1000, 'DE')).toBe(1000)
  })

  it('Germany: only the amount above the allowance is taxed, at 26.375%', () => {
    expect(afterBelkaTax(2000, 'DE')).toBeCloseTo(1736.25)
  })

  it('United Kingdom: below the annual exempt amount, nothing is taxed', () => {
    expect(afterBelkaTax(2000, 'GB')).toBe(2000)
  })

  it('United Kingdom: only the amount above the allowance is taxed, at 24%', () => {
    expect(afterBelkaTax(5000, 'GB')).toBeCloseTo(4520)
  })

  it('United States: flat 15% with no allowance at all', () => {
    expect(afterBelkaTax(1000, 'US')).toBeCloseTo(850)
  })

  it('Spain: a gain inside the first bracket is taxed at 19% in full', () => {
    expect(afterBelkaTax(5000, 'ES')).toBeCloseTo(4050)
  })

  it('Spain: a gain crossing brackets is taxed progressively, not at one flat rate', () => {
    // 6000 @ 19% + 4000 @ 21% = 1980 tax on a 10000 gain - not 10000 * 0.19
    // and not 10000 * 0.21, which is the mistake a flat-rate simplification
    // would make.
    expect(afterBelkaTax(10000, 'ES')).toBeCloseTo(8020)
  })

  it('Spain: the top bracket applies only above its threshold, cumulatively', () => {
    expect(afterBelkaTax(350000, 'ES')).toBeCloseTo(264120)
  })
})

describe('formatPct', () => {
  it('renders a dash for missing values instead of "NaN%"', () => {
    expect(formatPct(null)).toBe('—')
    expect(formatPct(undefined)).toBe('—')
  })

  it('formats both numeric and string input the same way', () => {
    expect(formatPct(12.345)).toBe(formatPct('12.345'))
  })
})

describe('formatNumber', () => {
  it('renders a dash for missing values', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
  })

  it('rounds to the requested number of digits', () => {
    expect(formatNumber(1.005, 2)).toMatch(/1[.,]0[01]/)
    expect(formatNumber(3, 0)).toBe('3')
  })
})

describe('formatMoney', () => {
  it('renders a dash for missing or non-numeric values', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney('not-a-number')).toBe('—')
  })

  it('accepts both string and numeric amounts and renders the same figure', () => {
    expect(formatMoney('1234.5', 'PLN')).toBe(formatMoney(1234.5, 'PLN'))
  })

  it('includes the requested currency', () => {
    expect(formatMoney(10, 'USD')).toMatch(/\$|USD/)
    expect(formatMoney(10, 'EUR')).toMatch(/€|EUR/)
  })
})
