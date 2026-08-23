export function formatMoney(value: string | number | null | undefined, currency = 'PLN'): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(num)
}

// Client-side mirror of the backend's flat 19% capital-gains tax
// (stocks.services.after_belka_tax) - losses pass through untaxed, same rule.
export const BELKA_TAX_RATE = 0.19

export function afterBelkaTax(value: number): number {
  return value > 0 ? value - value * BELKA_TAX_RATE : value
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
  return num.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits })
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
  return new Date(value).toLocaleDateString('pl-PL')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pl-PL')
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
