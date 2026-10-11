// The public calculators, in the order they are offered to someone who has
// just used one of them. Labels are Polish source strings for t().
export const CALCULATORS = [
  { path: '/kalkulator/procent-skladany', label: 'Kalkulator procentu składanego' },
  { path: '/kalkulator/podatek-belki', label: 'Kalkulator podatku Belki' },
  { path: '/kalkulator/cel-oszczednosciowy', label: 'Ile odkładać na cel' },
  { path: '/kalkulator', label: 'Lokata, obligacje czy giełda' },
] as const

/** A text field's content as a number; anything unreadable counts as zero. */
export function num(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}
