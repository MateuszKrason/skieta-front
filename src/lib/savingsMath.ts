// The arithmetic behind the three small public calculators (compound
// interest, Belka tax, savings goal). Kept apart from the pages so every
// number a visitor sees can be checked by a test rather than by eye.
//
// Amounts are plain numbers in złoty. Rounding happens once, at the edge:
// tax amounts follow the rounding the tax rules prescribe, everything else
// is rounded to the grosz when it is handed back.

export const BELKA_RATE = 0.19

export type TaxMode =
  /** Tax taken out of every interest payment - a deposit or a savings account. */
  | 'each'
  /** Tax on the whole gain when the money is withdrawn - an accumulating fund or ETF. */
  | 'end'
  /** No tax - an IKE held to the age the law requires. */
  | 'none'

export interface GrowthInput {
  initial: number
  monthly: number
  annualRatePct: number
  years: number
  /** How many times a year interest is added to the balance: 12, 4 or 1. */
  periodsPerYear: number
  taxMode: TaxMode
}

export interface GrowthYear {
  year: number
  /** Everything paid in so far, the starting amount included. */
  contributed: number
  /** Balance at the end of the year - for 'end', before the tax due at withdrawal. */
  value: number
}

export interface GrowthResult {
  rows: GrowthYear[]
  contributed: number
  /** What is left in hand after tax. */
  finalValue: number
  /** The part of finalValue that is not the person's own money. */
  gain: number
  tax: number
}

const grosz = (value: number) => Math.round(value * 100) / 100
const ceilGrosz = (value: number) => Math.ceil(value * 100 - 1e-9) / 100

/**
 * Month-by-month growth with a contribution at the start of each month.
 * Interest accrues monthly on the balance and is added to it at the end of
 * each capitalisation period, which is when a bank takes its tax as well.
 */
export function compoundGrowth(input: GrowthInput): GrowthResult {
  const months = Math.max(0, Math.round(input.years * 12))
  const monthsPerPeriod = 12 / input.periodsPerYear
  const monthlyRate = input.annualRatePct / 100 / 12
  let balance = Math.max(0, input.initial)
  let contributed = balance
  let accrued = 0
  let taxPaid = 0
  const rows: GrowthYear[] = []

  for (let month = 1; month <= months; month++) {
    balance += input.monthly
    contributed += input.monthly
    accrued += balance * monthlyRate
    if (month % monthsPerPeriod === 0 || month === months) {
      const tax = input.taxMode === 'each' ? Math.max(0, accrued) * BELKA_RATE : 0
      taxPaid += tax
      balance += accrued - tax
      accrued = 0
    }
    if (month % 12 === 0 || month === months) {
      rows.push({ year: Math.ceil(month / 12), contributed: grosz(contributed), value: grosz(balance) })
    }
  }

  if (input.taxMode === 'end') {
    taxPaid = Math.max(0, balance - contributed) * BELKA_RATE
    balance -= taxPaid
  }
  return {
    rows,
    contributed: grosz(contributed),
    finalValue: grosz(balance),
    gain: grosz(balance - contributed),
    tax: grosz(taxPaid),
  }
}

export interface InterestTax {
  gross: number
  tax: number
  net: number
  /** The rate the money really earned, after tax, per year. */
  netRatePct: number
}

/**
 * Tax on interest from a deposit paid out once, at the end. The bank takes
 * 19% and rounds both the taxable amount and the tax up to the grosz
 * (Ordynacja podatkowa, art. 63 § 1a).
 */
export function depositInterestTax(amount: number, annualRatePct: number, months: number): InterestTax {
  const interest = Math.max(0, amount) * (annualRatePct / 100) * (Math.max(0, months) / 12)
  const gross = grosz(interest)
  const tax = ceilGrosz(ceilGrosz(interest) * BELKA_RATE)
  return { gross, tax, net: grosz(gross - tax), netRatePct: annualRatePct * (1 - BELKA_RATE) }
}

export interface SaleTax {
  profit: number
  /** Zero for a loss - a loss is carried forward instead (see the page copy). */
  tax: number
  net: number
}

/**
 * Tax on selling shares, ETF units or fund units, the way it is settled in
 * PIT-38: income minus costs for the whole year, the base and the tax both
 * rounded to the full złoty (Ordynacja podatkowa, art. 63 § 1).
 */
export function saleTax(proceeds: number, cost: number): SaleTax {
  const profit = grosz(proceeds - cost)
  if (profit <= 0) return { profit, tax: 0, net: profit }
  const tax = Math.round(Math.round(profit) * BELKA_RATE)
  return { profit, tax, net: grosz(profit - tax) }
}

/** The interest a deposit has to pay for the money to keep up with inflation after tax. */
export function breakEvenRatePct(inflationPct: number): number {
  return inflationPct / (1 - BELKA_RATE)
}

export interface GoalInput {
  target: number
  saved: number
  months: number
  annualRatePct: number
  /** Whether interest is taxed as it is paid (a savings account) or not at all (cash, IKE). */
  taxed: boolean
}

export interface GoalResult {
  /** What to put aside at the start of each month. Zero when the goal is already covered. */
  monthly: number
  /** How much of the target the person pays in themselves, the starting amount included. */
  ownMoney: number
  /** The rest - what the interest adds. */
  fromInterest: number
  alreadyCovered: boolean
}

/**
 * The monthly amount that reaches `target` in `months`, with interest added
 * every month on the net rate. Solves the annuity-due formula for the
 * payment; with no interest it is simply the gap divided by the months.
 */
export function monthlyForGoal(input: GoalInput): GoalResult {
  const months = Math.max(1, Math.round(input.months))
  const rate = (input.annualRatePct / 100 / 12) * (input.taxed ? 1 - BELKA_RATE : 1)
  const growth = Math.pow(1 + rate, months)
  const savedLater = Math.max(0, input.saved) * growth
  if (savedLater >= input.target) {
    return { monthly: 0, ownMoney: grosz(Math.max(0, input.saved)), fromInterest: grosz(input.target - Math.max(0, input.saved)), alreadyCovered: true }
  }
  const gap = input.target - savedLater
  const factor = rate === 0 ? months : ((growth - 1) / rate) * (1 + rate)
  const monthly = ceilGrosz(gap / factor)
  const ownMoney = grosz(Math.max(0, input.saved) + monthly * months)
  return { monthly, ownMoney, fromInterest: grosz(Math.max(0, input.target - ownMoney)), alreadyCovered: false }
}
