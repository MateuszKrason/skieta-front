import { describe, expect, it } from 'vitest'
import {
  breakEvenRatePct,
  compoundGrowth,
  depositInterestTax,
  depositOutcome,
  ikzeOutcome,
  monthlyForGoal,
  realValue,
  saleTax,
} from './savingsMath'

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

describe('depositOutcome', () => {
  it('pays interest once at the end when the deposit says so', () => {
    // 10 000 zł at 5% for 12 months: 500 zł gross, 95 zł tax.
    const result = depositOutcome({ amount: 10000, annualRatePct: 5, months: 12, periodsPerYear: 0 })

    expect(result.grossInterest).toBe(500)
    expect(result.tax).toBe(95)
    expect(result.netInterest).toBe(405)
    expect(result.finalValue).toBe(10405)
    expect(result.netRatePct).toBeCloseTo(4.05, 6)
  })

  it('compounds monthly on what is left after tax', () => {
    const result = depositOutcome({ amount: 10000, annualRatePct: 6, months: 12, periodsPerYear: 12 })

    expect(result.finalValue).toBeCloseTo(10000 * Math.pow(1 + (0.06 * 0.81) / 12, 12), 2)
    expect(result.grossInterest).toBeCloseTo(result.netInterest + result.tax, 2)
    // Monthly compounding beats the nominal 6% * 0.81 = 4.86% by a little.
    expect(result.netRatePct).toBeGreaterThan(4.86)
    expect(result.netRatePct).toBeLessThan(5)
  })

  it('scales a three-month deposit to a yearly rate that can be compared', () => {
    const result = depositOutcome({ amount: 10000, annualRatePct: 6, months: 3, periodsPerYear: 0 })

    expect(result.netInterest).toBe(121.5)
    expect(result.netRatePct).toBeCloseTo((Math.pow(1.01215, 4) - 1) * 100, 6)
  })

  it('has nothing to report for no money or no time', () => {
    expect(depositOutcome({ amount: 0, annualRatePct: 6, months: 12, periodsPerYear: 12 }).netRatePct).toBe(0)
    expect(depositOutcome({ amount: 1000, annualRatePct: 6, months: 0, periodsPerYear: 0 }).finalValue).toBe(1000)
  })
})

describe('realValue', () => {
  it('matches the figure in the article: 10 000 zł at 4% for ten years', () => {
    const result = realValue(10000, 4, 10)

    expect(result.real).toBe(6755.64)
    expect(result.lost).toBe(3244.36)
    expect(result.rows).toHaveLength(10)
    expect(result.rows[0]).toEqual({ year: 1, real: 9615.38 })
  })

  it('leaves money alone when there is no inflation', () => {
    expect(realValue(5000, 0, 20).real).toBe(5000)
  })
})

describe('ikzeOutcome', () => {
  it('refunds the contribution at the tax rate', () => {
    // The article's own figures: 6 000 zł gives 720, 1 140 or 1 920 zł back.
    expect(ikzeOutcome({ contribution: 6000, taxRatePct: 12, years: 1, annualReturnPct: 0 }).refundPerYear).toBe(720)
    expect(ikzeOutcome({ contribution: 6000, taxRatePct: 19, years: 1, annualReturnPct: 0 }).refundPerYear).toBe(1140)
    expect(ikzeOutcome({ contribution: 6000, taxRatePct: 32, years: 1, annualReturnPct: 0 }).refundPerYear).toBe(1920)
  })

  it('takes ten percent of everything on the way out', () => {
    const result = ikzeOutcome({ contribution: 6000, taxRatePct: 12, years: 1, annualReturnPct: 0 })

    expect(result.value).toBe(6000)
    expect(result.exitTax).toBe(600)
    // 6 000 - 600 + 720 back from the tax office, against 6 000 kept in an ordinary account.
    expect(result.netIkze).toBe(6120)
    expect(result.netRegular).toBe(6000)
    expect(result.advantage).toBe(120)
  })

  it('grows yearly contributions made at the end of each year', () => {
    const result = ikzeOutcome({ contribution: 1000, taxRatePct: 32, years: 2, annualReturnPct: 10 })

    // 1 000 grows for one year, the second 1 000 not at all.
    expect(result.value).toBe(2100)
    expect(result.refundTotal).toBe(640)
    expect(result.netRegular).toBe(2081)
    expect(result.netIkze).toBe(2530)
  })

  it('can come out behind when the deduction is small and nothing is earned', () => {
    // With no return there is no Belka to save, and a deduction under 10% does not cover the exit tax.
    const result = ikzeOutcome({ contribution: 6000, taxRatePct: 8.5, years: 10, annualReturnPct: 0 })

    expect(result.advantage).toBeLessThan(0)
  })
})
