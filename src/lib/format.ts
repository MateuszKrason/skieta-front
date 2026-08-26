// Mirrors i18n/LanguageContext's STORAGE_KEY — read directly rather than
// importing the context here, since format.ts is a plain utility module used
// from ~25 places that don't (and shouldn't need to) thread a `language`
// argument through every call.
const LOCALE_BY_LANGUAGE: Record<string, string> = {
  pl: 'pl-PL',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
}

function activeLocale(): string {
  const lang = localStorage.getItem('myfaj_language') ?? ''
  return LOCALE_BY_LANGUAGE[lang] ?? 'pl-PL'
}

export function formatMoney(
  value: string | number | null | undefined,
  currency = 'PLN',
  fractionDigits?: number,
): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  const options: Intl.NumberFormatOptions = { style: 'currency', currency }
  if (fractionDigits !== undefined) {
    options.minimumFractionDigits = fractionDigits
    options.maximumFractionDigits = fractionDigits
  }
  return new Intl.NumberFormat(activeLocale(), options).format(num)
}

// Client-side mirror of the backend's per-residency-country investment-income
// tax (accounts.tax.after_tax / stocks.services.after_belka_tax) - see that
// module for the same simplifying-assumptions disclaimer (per-calculation,
// not annual-aggregate allowances; not a substitute for real tax advice).
export const BELKA_TAX_RATE = 0.19 // Poland (default/blank residency) - podatek Belki

const FLAT_TAX_RATES: Record<string, number> = {
  DE: 0.26375, // Abgeltungssteuer 25% + 5.5% Solidaritätszuschlag on that
  GB: 0.24, // CGT higher rate on shares/other assets (from 30 Oct 2024)
  US: 0.15, // Federal long-term capital gains, most common bracket - ignores state tax etc.
}

const TAX_ALLOWANCES: Record<string, number> = {
  DE: 1000, // Sparer-Pauschbetrag, single-filer amount
  GB: 3000, // Annual exempt amount (2024/25)
}

// Spanish savings-income scale (capital gains + dividends), progressive -
// [upperBound, rate]; null upperBound means "and above".
const ES_TAX_BRACKETS: [number | null, number][] = [
  [6000, 0.19],
  [50000, 0.21],
  [200000, 0.23],
  [300000, 0.27],
  [null, 0.28],
]

function progressiveTax(amount: number, brackets: [number | null, number][]): number {
  let tax = 0
  let lower = 0
  for (const [upper, rate] of brackets) {
    const span = upper === null ? amount - lower : Math.min(amount, upper) - lower
    if (span <= 0) break
    tax += span * rate
    if (upper === null || amount <= upper) break
    lower = upper
  }
  return tax
}

/** After-tax amount for a gain/interest/dividend, based on the account's
 * residency country (Profile.residency_country) - '', undefined, null, or
 * any country without its own rule below all fall back to Poland's flat 19%.
 * Losses (<=0) pass through unchanged. */
export function afterBelkaTax(value: number, country?: string | null): number {
  if (value <= 0) return value
  if (country === 'ES') return value - progressiveTax(value, ES_TAX_BRACKETS)
  if (country && country in FLAT_TAX_RATES) {
    const taxable = value - (TAX_ALLOWANCES[country] ?? 0)
    if (taxable <= 0) return value
    return value - taxable * FLAT_TAX_RATES[country]
  }
  return value - value * BELKA_TAX_RATE
}

export function formatPct(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`
}

export function formatNumber(value: string | number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString(activeLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Share count as a whole number, with any fractional remainder shown in
 * parentheses (and omitted entirely when the holding is a whole number) —
 * e.g. 12.345 -> "12 (0.345)", 12 -> "12", 0.5 -> "0 (0.5)". */
export function formatShareQuantity(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  const whole = Math.trunc(num)
  const fraction = Math.abs(num - whole)
  if (fraction < 1e-9) return `${whole}`
  const fractionStr = fraction.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return `${whole} (${fractionStr})`
}

/** Auto-scaling tick label for chart axes: uses "k" only once values actually reach
 * the thousands, so small amounts (e.g. 17) don't render as a misleading "0.0k". */
export function formatAxisValue(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`
  }
  if (Number.isInteger(value)) return `${value}`
  return value.toFixed(abs < 10 ? 1 : 0)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(activeLocale())
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(activeLocale())
}

/** Countdown like "2d 04:15:32" once the target is more than a day away, else
 * just "04:15:32" — shared by the landing-page promotion banner and the
 * personal-invite QR countdown (both count down to a fixed instant). Returns
 * null once the deadline has passed, so callers know to stop rendering it. */
export function formatCountdown(target: Date, now: Date = new Date()): string | null {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return null
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${clock}` : clock
}

/** Session-length style duration - e.g. 45 -> "45 s", 125 -> "2 min 5 s",
 * 4000 -> "1 godz 6 min". Drops the smaller unit once the larger one hits
 * hours, since seconds stop being meaningful at that scale. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—'
  const total = Math.round(seconds)
  if (total < 60) return `${total} s`
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours} godz ${minutes} min`
  const secs = total % 60
  return `${minutes} min ${secs} s`
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'osobiste',
  savings: 'oszczędnościowe',
  brokerage: 'maklerskie',
  business: 'firmowe',
  ike: 'IKE',
  ikze: 'IKZE',
  crypto: 'kryptowalutowe',
}

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type
}

export const BOND_TYPE_LABELS: Record<string, string> = {
  OTS: 'OTS – 3-miesięczne',
  ROR: 'ROR – roczne, zmienne',
  DOR: 'DOR – 2-letnie, zmienne',
  TOS: 'TOS – 3-letnie, stałoprocentowe',
  COI: 'COI – 4-letnie, indeksowane inflacją',
  EDO: 'EDO – 10-letnie, indeksowane inflacją',
  ROS: 'ROS – rodzinne oszczędnościowe',
  ROD: 'ROD – rodzinne, indeksowane inflacją',
  OTHER: 'Inne',
}

export function bondTypeLabel(type: string): string {
  return BOND_TYPE_LABELS[type] ?? type
}
