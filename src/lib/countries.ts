// Supported tax-residency countries (Profile.residency_country), mirrored
// from backend/accounts/countries.py — kept deliberately small: these are
// the only countries lib/format.ts's afterBelkaTax has actual rate rules
// for. Blank/unset residency also means Poland (same as the explicit 'PL'
// choice - both fall back to the flat 19% Belka tax).
export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code
}
