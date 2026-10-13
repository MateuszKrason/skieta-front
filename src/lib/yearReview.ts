// "Twój rok w skiecie": the shape of the server's answer (networth.year_review)
// and the one piece of logic worth testing apart from the page - choosing what
// goes on the picture people share.

export interface YearReview {
  year: number
  available_years: number[]
  is_current_year: boolean
  through: string
  has_data: boolean
  net_worth: {
    since: string
    until: string
    covers_whole_year: boolean
    start_total: string
    end_total: string
    change: string
    change_pct: string | null
    saved: string
    market_and_rest: string
  } | null
  income_total: string
  expense_total: string
  saved: string
  savings_rate_pct: string | null
  average_monthly_expense: string | null
  fixed_costs_monthly: string | null
  fixed_costs_share_pct: string | null
  top_categories: { name: string | null; total: string; share_pct: string | null }[]
  cushion: { liquid: string; months: string } | null
  months: { month: number; income: string; expense: string }[]
  facts: {
    transaction_count: number
    days_with_entries: number
    active_days: number
    priciest_month: { month: number; expense: string } | null
    best_month: { month: number; saved: string } | null
    biggest_expense: { amount: string; description: string; category: string | null; date: string } | null
    favourite_store: { name: string; visits: number; total: string } | null
    dividends: string | null
    realized_gain: string | null
    stock_trades: number
    goal_contributions: string | null
    goals_reached: number
    goals_total: number
  }
}

type Translate = (text: string, ...args: Array<string | number>) => string

export interface ShareLine {
  value: string
  label: string
}

/** The month's name on its own, in the reader's language: "styczeń", "January". */
export function monthName(month: number, locale: string): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(locale, { month: 'long' })
}

function percent(value: string, locale: string, signed = false): string {
  const number = Number(value)
  const text = new Intl.NumberFormat(locale, { maximumFractionDigits: number % 1 === 0 ? 0 : 1 }).format(Math.abs(number))
  const sign = number < 0 ? '-' : signed && number > 0 ? '+' : ''
  return `${sign}${text}%`
}

/**
 * What the shared picture says, at most four lines.
 *
 * Without `amounts` nothing on it is a sum of money - only shares, counts
 * and names - because a picture posted in public should not tell strangers
 * what someone earns or owns unless they chose to say so. With `amounts`
 * the saved sum joins the savings rate, and nothing else changes.
 */
export function shareLines(
  review: YearReview,
  options: { amounts: boolean; locale: string; money: (value: string) => string },
  t: Translate,
): ShareLine[] {
  const lines: ShareLine[] = []

  if (review.savings_rate_pct !== null && Number(review.savings_rate_pct) > 0) {
    lines.push({
      value: percent(review.savings_rate_pct, options.locale),
      label: options.amounts
        ? t('dochodów odłożone, czyli {0}', options.money(review.saved))
        : t('dochodów odłożone'),
    })
  }
  if (review.net_worth?.change_pct && Number(review.net_worth.change_pct) > 0) {
    lines.push({ value: percent(review.net_worth.change_pct, options.locale, true), label: t('majątek w górę') })
  }
  const top = review.top_categories[0]
  if (top?.share_pct) {
    lines.push({
      value: top.name ?? t('Bez kategorii'),
      label: t('największa kategoria, {0} wydatków', percent(top.share_pct, options.locale)),
    })
  }
  if (review.cushion && Number(review.cushion.months) >= 1) {
    lines.push({
      value: new Intl.NumberFormat(options.locale, { maximumFractionDigits: 1 }).format(Number(review.cushion.months)),
      label: t('mies. życia z poduszki'),
    })
  }
  if (review.facts.transaction_count > 0) {
    lines.push({ value: String(review.facts.transaction_count), label: t('zapisanych wydatków i wpływów') })
  }
  if (review.facts.goals_reached > 0) {
    lines.push({ value: String(review.facts.goals_reached), label: t('osiągnięte cele') })
  }
  return lines.slice(0, 4)
}
