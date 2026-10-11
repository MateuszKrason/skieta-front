import { describe, expect, it } from 'vitest'
import { breakEvenRatePct, compoundGrowth, depositInterestTax, monthlyForGoal, saleTax } from './savingsMath'

describe('compoundGrowth', () => {
  it('matches the textbook formula for a lump sum compounded yearly', () => {
    // 10 000 zł at 5% for 10 years: 10 000 * 1.05^10
    const result = compoundGrowth({ initial: 10000, monthly: 0, annualRatePct: 5, years: 10, periodsPerYear: 1, taxMode: 'none' })

    expect(result.finalValue).toBeCloseTo(16288.95, 2)
    expect(result.contributed).toBe(10000)
    expect(result.gain).toBeCloseTo(6288.95, 2)
    expect(result.tax).toBe(0)
  })

  it('compounds a lump sum monthly the way (1 + r/12)^n does', () => {
    const result = compoundGrowth({ initial: 10000, monthly: 0, annualRatePct: 6, years: 5, periodsPerYear: 12, taxMode: 'none' })

    expect(result.finalValue).toBeCloseTo(10000 * Math.pow(1.005, 60), 2)
  })

  it('adds a contribution at the start of every month', () => {
    // An annuity due: 500 zł a month at 6% for a year, monthly compounding.
    const result = compoundGrowth({ initial: 0, monthly: 500, annualRatePct: 6, years: 1, periodsPerYear: 12, taxMode: 'none' })
    const expected = 500 * ((Math.pow(1.005, 12) - 1) / 0.005) * 1.005

    expect(result.finalValue).toBeCloseTo(expected, 2)
    expect(result.contributed).toBe(6000)
  })

  it('takes Belka out of every interest payment for a deposit', () => {
    // Taxed at each capitalisation, money grows at 81% of the nominal rate.
    const result = compoundGrowth({ initial: 10000, monthly: 0, annualRatePct: 5, years: 10, periodsPerYear: 1, taxMode: 'each' })

    expect(result.finalValue).toBeCloseTo(10000 * Math.pow(1 + 0.05 * 0.81, 10), 2)
    expect(result.tax).toBeGreaterThan(0)
  })

  it('taxes the whole gain once when the money is only taxed at withdrawal', () => {
    const result = compoundGrowth({ initial: 10000, monthly: 0, annualRatePct: 5, years: 10, periodsPerYear: 1, taxMode: 'end' })

    expect(result.tax).toBeCloseTo(6288.95 * 0.19, 1)
    expect(result.finalValue).toBeCloseTo(10000 + 6288.95 * 0.81, 1)
  })

  it('leaves more in hand when the tax waits until the end', () => {
    const base = { initial: 10000, monthly: 300, annualRatePct: 6, years: 20, periodsPerYear: 12 }
    const each = compoundGrowth({ ...base, taxMode: 'each' })
    const end = compoundGrowth({ ...base, taxMode: 'end' })
    const none = compoundGrowth({ ...base, taxMode: 'none' })

    expect(end.finalValue).toBeGreaterThan(each.finalValue)
    expect(none.finalValue).toBeGreaterThan(end.finalValue)
  })

  it('reports one row per year and what had been paid in by then', () => {
    const result = compoundGrowth({ initial: 1000, monthly: 100, annualRatePct: 4, years: 3, periodsPerYear: 12, taxMode: 'none' })

    expect(result.rows.map((r) => r.year)).toEqual([1, 2, 3])
    expect(result.rows.map((r) => r.contributed)).toEqual([2200, 3400, 4600])
  })

  it('returns the money untouched at a zero rate', () => {
    const result = compoundGrowth({ initial: 1000, monthly: 100, annualRatePct: 0, years: 2, periodsPerYear: 12, taxMode: 'each' })

    expect(result.finalValue).toBe(3400)
    expect(result.gain).toBe(0)
  })
})

describe('depositInterestTax', () => {
  it('takes 19% of the interest', () => {
    // 10 000 zł at 5% for 12 months: 500 zł of interest, 95 zł of tax.
    expect(depositInterestTax(10000, 5, 12)).toEqual({ gross: 500, tax: 95, net: 405, netRatePct: 5 * 0.81 })
  })

  it('rounds the tax up to the grosz, as banks have to', () => {
    // 1 000 zł at 4.3% for 3 months: 10.75 zł interest, 19% = 2.0425 -> 2.05 zł.
    const result = depositInterestTax(1000, 4.3, 3)

    expect(result.gross).toBe(10.75)
    expect(result.tax).toBe(2.05)
    expect(result.net).toBe(8.7)
  })
})

describe('saleTax', () => {
  it('rounds the base and the tax to the full złoty, as PIT-38 does', () => {
    // Profit 1 234.56 zł -> base 1 235 zł -> 234.65 -> 235 zł.
    expect(saleTax(11234.56, 10000)).toEqual({ profit: 1234.56, tax: 235, net: 999.56 })
  })

  it('charges nothing on a loss', () => {
    expect(saleTax(8000, 10000)).toEqual({ profit: -2000, tax: 0, net: -2000 })
  })
})

describe('breakEvenRatePct', () => {
  it('is the inflation rate divided by what is left after tax', () => {
    expect(breakEvenRatePct(4)).toBeCloseTo(4.938, 3)
  })
})

describe('monthlyForGoal', () => {
  it('divides the gap by the months when there is no interest', () => {
    const result = monthlyForGoal({ target: 12000, saved: 0, months: 24, annualRatePct: 0, taxed: false })

    expect(result).toEqual({ monthly: 500, ownMoney: 12000, fromInterest: 0, alreadyCovered: false })
  })

  it('counts what is already put aside', () => {
    expect(monthlyForGoal({ target: 12000, saved: 3000, months: 18, annualRatePct: 0, taxed: false }).monthly).toBe(500)
  })

  it('asks for less when the money earns interest, and the amount really gets there', () => {
    const input = { target: 60000, saved: 5000, months: 48, annualRatePct: 5, taxed: true }
    const result = monthlyForGoal(input)

    expect(result.monthly).toBeLessThan((60000 - 5000) / 48)
    // Replay it month by month: deposit, then a month of net interest.
    const rate = (0.05 / 12) * 0.81
    let balance = 5000
    for (let month = 0; month < 48; month++) balance = (balance + result.monthly) * (1 + rate)
    // The starting amount grows untouched in the formula; replay it the same way.
    let check = 5000 * Math.pow(1 + rate, 48)
    for (let month = 0; month < 48; month++) check += result.monthly * Math.pow(1 + rate, 48 - month)
    expect(check).toBeGreaterThanOrEqual(60000)
    expect(check - 60000).toBeLessThan(1)
    expect(balance).toBeCloseTo(check, 6)
    expect(result.fromInterest).toBeCloseTo(60000 - result.ownMoney, 2)
  })

  it('says so when the goal is already covered', () => {
    const result = monthlyForGoal({ target: 10000, saved: 12000, months: 12, annualRatePct: 3, taxed: true })

    expect(result.monthly).toBe(0)
    expect(result.alreadyCovered).toBe(true)
  })
})
