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

export interface DepositInput {
  amount: number
  annualRatePct: number
  months: number
  /** How often interest is added to the deposit: 12, 4 or 1 times a year, or
   * 0 when it is paid once, when the deposit ends. */
  periodsPerYear: number
}

export interface DepositResult {
  grossInterest: number
  tax: number
  netInterest: number
  finalValue: number
  /** What the deposit really pays per year after tax, compounding included. */
  netRatePct: number
}

/** A term deposit from start to finish, with Belka taken out of every interest payment. */
export function depositOutcome(input: DepositInput): DepositResult {
  const amount = Math.max(0, input.amount)
  const months = Math.max(0, Math.round(input.months))
  let netInterest: number
  let tax: number
  if (input.periodsPerYear === 0) {
    const single = depositInterestTax(amount, input.annualRatePct, months)
    netInterest = single.net
    tax = single.tax
  } else {
    const growth = compoundGrowth({
      initial: amount,
      monthly: 0,
      annualRatePct: input.annualRatePct,
      years: months / 12,
      periodsPerYear: input.periodsPerYear,
      taxMode: 'each',
    })
    netInterest = growth.gain
    tax = growth.tax
  }
  const finalValue = grosz(amount + netInterest)
  const netRatePct = amount > 0 && months > 0 ? (Math.pow(finalValue / amount, 12 / months) - 1) * 100 : 0
  return { grossInterest: grosz(netInterest + tax), tax, netInterest, finalValue, netRatePct }
}

export interface RealValue {
  /** What the amount will buy after the years, in today's money. */
  real: number
  lost: number
  rows: { year: number; real: number }[]
}

/** What inflation does to money that earns nothing. */
export function realValue(amount: number, inflationPct: number, years: number): RealValue {
  const whole = Math.max(0, Math.round(years))
  const rows = []
  for (let year = 1; year <= whole; year++) {
    rows.push({ year, real: grosz(amount / Math.pow(1 + inflationPct / 100, year)) })
  }
  const real = whole > 0 ? rows[whole - 1].real : grosz(amount)
  return { real, lost: grosz(amount - real), rows }
}

/** Tax on a withdrawal from IKZE after 65: a flat 10% of everything taken out. */
export const IKZE_EXIT_RATE = 0.1

export interface IkzeInput {
  /** Paid in once a year. */
  contribution: number
  /** The rate the contribution is deducted at: 12, 19 or 32 for most people. */
  taxRatePct: number
  years: number
  /** Assumed yearly return on what is invested, before any tax. */
  annualReturnPct: number
}

export interface IkzeResult {
  refundPerYear: number
  refundTotal: number
  /** The account's value at the end, before the withdrawal tax. */
  value: number
  exitTax: number
  /** What IKZE leaves in hand: the withdrawal after its 10%, plus the refunds along the way. */
  netIkze: number
  /** The same contributions and return on an ordinary account, with Belka on the gain. */
  netRegular: number
  advantage: number
}

/**
 * IKZE against an ordinary account, on the same contributions and the same
 * assumed return. Contributions are made at the end of each year; the yearly
 * refunds are counted as received but not reinvested, which understates IKZE
 * slightly rather than flattering it.
 */
export function ikzeOutcome(input: IkzeInput): IkzeResult {
  const years = Math.max(0, Math.round(input.years))
  const contribution = Math.max(0, input.contribution)
  const rate = input.annualReturnPct / 100
  const paidIn = contribution * years
  const value = rate === 0 ? paidIn : contribution * ((Math.pow(1 + rate, years) - 1) / rate)
  const refundPerYear = contribution * (input.taxRatePct / 100)
  const refundTotal = refundPerYear * years
  const exitTax = value * IKZE_EXIT_RATE
  const netIkze = value - exitTax + refundTotal
  const netRegular = paidIn + Math.max(0, value - paidIn) * (1 - BELKA_RATE)
  return {
    refundPerYear: grosz(refundPerYear),
    refundTotal: grosz(refundTotal),
    value: grosz(value),
    exitTax: grosz(exitTax),
    netIkze: grosz(netIkze),
    netRegular: grosz(netRegular),
    advantage: grosz(netIkze - netRegular),
  }
}
