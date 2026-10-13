import { describe, expect, it } from 'vitest'
import { monthName, shareLines, type YearReview } from './yearReview'

const t = (text: string, ...args: Array<string | number>) => text.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? ''))
const money = (value: string) => `${value} zł`

function review(overrides: Partial<YearReview> = {}): YearReview {
  return {
    year: 2025,
    available_years: [2025],
    is_current_year: false,
    through: '2025-12-31',
    has_data: true,
    net_worth: {
      since: '2024-12-30',
      until: '2025-12-31',
      covers_whole_year: true,
      start_total: '100000.00',
      end_total: '112000.00',
      change: '12000.00',
      change_pct: '12.0',
      saved: '9000.00',
      market_and_rest: '3000.00',
    },
    income_total: '72000.00',
    expense_total: '54000.00',
    saved: '18000.00',
    savings_rate_pct: '25.0',
    average_monthly_expense: '4500.00',
    fixed_costs_monthly: '2000.00',
    fixed_costs_share_pct: '33.3',
    top_categories: [{ name: 'Mieszkanie', total: '24000.00', share_pct: '44.4' }],
    cushion: { liquid: '20000.00', months: '4.4' },
    months: [],
    facts: {
      transaction_count: 312,
      days_with_entries: 200,
      active_days: 150,
      priciest_month: null,
      best_month: null,
      biggest_expense: null,
      favourite_store: null,
      dividends: null,
      realized_gain: null,
      stock_trades: 0,
      goal_contributions: null,
      goals_reached: 2,
      goals_total: 3,
    },
    ...overrides,
  }
}

describe('shareLines', () => {
  it('shows no sum of money unless asked to', () => {
    const lines = shareLines(review(), { amounts: false, locale: 'pl-PL', money }, t)

    expect(lines.map((l) => `${l.value} ${l.label}`).join(' | ')).not.toMatch(/zł/)
    expect(lines[0]).toEqual({ value: '25%', label: 'dochodów odłożone' })
  })

  it('adds the saved sum to the savings rate when amounts are on', () => {
    const lines = shareLines(review(), { amounts: true, locale: 'pl-PL', money }, t)

    expect(lines[0]).toEqual({ value: '25%', label: 'dochodów odłożone, czyli 18000.00 zł' })
  })

  it('keeps to four lines, the most telling first', () => {
    const lines = shareLines(review(), { amounts: false, locale: 'pl-PL', money }, t)

    expect(lines).toHaveLength(4)
    expect(lines.map((l) => l.value)).toEqual(['25%', '+12%', 'Mieszkanie', '4,4'])
  })

  it('leaves out what would not be worth showing', () => {
    const lines = shareLines(
      review({
        savings_rate_pct: '-5.0',
        net_worth: null,
        cushion: { liquid: '100.00', months: '0.2' },
        top_categories: [],
      }),
      { amounts: false, locale: 'pl-PL', money },
      t,
    )

    // A year in the red, no net worth history, a cushion under a month: only the plain counts remain.
    expect(lines.map((l) => l.value)).toEqual(['312', '2'])
  })

  it('names spending without a category in the reader\'s words', () => {
    const lines = shareLines(
      review({ top_categories: [{ name: null, total: '10.00', share_pct: '100.0' }] }),
      { amounts: false, locale: 'pl-PL', money },
      t,
    )

    expect(lines.find((l) => l.label.startsWith('największa kategoria'))?.value).toBe('Bez kategorii')
  })

  it('has nothing to say about an empty year', () => {
    const empty = review({
      savings_rate_pct: null,
      net_worth: null,
      cushion: null,
      top_categories: [],
      facts: { ...review().facts, transaction_count: 0, goals_reached: 0 },
    })

    expect(shareLines(empty, { amounts: false, locale: 'pl-PL', money }, t)).toEqual([])
  })
})

describe('monthName', () => {
  it('names a month in the reader\'s language', () => {
    expect(monthName(1, 'pl-PL')).toBe('styczeń')
    expect(monthName(12, 'en-US')).toBe('December')
  })
})
