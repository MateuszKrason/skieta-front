export interface CurrentBondOfferEntry {
  rate: string | null
  series: string
  tenor_months: number
  source: 'live' | 'cache' | 'fallback'
}

export type CurrentBondOffer = Record<string, CurrentBondOfferEntry>

/** Adds `months` calendar months to an ISO date string (YYYY-MM-DD).
 * Builds the result from local date parts rather than toISOString() — that
 * converts through UTC, which shifts the date by a day for any timezone
 * with a negative UTC offset. */
export function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
